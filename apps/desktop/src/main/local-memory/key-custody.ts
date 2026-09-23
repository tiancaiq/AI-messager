import { randomBytes, randomUUID } from "node:crypto";
import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

interface KeyEnvelope {
  version: 1;
  storeId: string;
  encryptedKey: string;
}

function parseEnvelope(value: unknown): KeyEnvelope | undefined {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return undefined;
  const record = value as Record<string, unknown>;
  if (
    Object.keys(record).length !== 3 ||
    record.version !== 1 ||
    typeof record.storeId !== "string" ||
    !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(
      record.storeId,
    ) ||
    typeof record.encryptedKey !== "string" ||
    record.encryptedKey.length === 0 ||
    record.encryptedKey.length > 16_384
  ) {
    return undefined;
  }
  return { version: 1, storeId: record.storeId, encryptedKey: record.encryptedKey };
}

export interface KeyProtector {
  isAsyncEncryptionAvailable(): Promise<boolean>;
  encryptStringAsync(value: string): Promise<Buffer>;
  decryptStringAsync(value: Buffer): Promise<{ result: string; shouldReEncrypt: boolean }>;
}

export interface LocalMemoryKey {
  databasePath: string;
  storeId: string;
  keyHex: string;
}

export interface LocalMemoryPaths {
  databasePath: string;
  envelopePath: string;
  resetMarkerPath: string;
  storeDirectory: string;
}

export class KeyUnavailableError extends Error {}

function throwIfAborted(signal?: AbortSignal): void {
  if (signal?.aborted) throw new KeyUnavailableError("The local memory operation timed out.");
}

const ENVELOPE_TEMP_PATTERN = /^\.memory-key-[0-9a-f-]{36}\.tmp$/iu;

export function getLocalMemoryPaths(userDataPath: string): LocalMemoryPaths {
  const userDataRoot = resolve(userDataPath);
  const storeDirectory = resolve(userDataRoot, "local-memory");
  if (relative(userDataRoot, storeDirectory) !== "local-memory") {
    throw new KeyUnavailableError("The local memory path is unavailable.");
  }
  return {
    databasePath: join(storeDirectory, "memory.db"),
    envelopePath: join(storeDirectory, "memory-key.json"),
    resetMarkerPath: join(storeDirectory, "reset-in-progress.json"),
    storeDirectory,
  };
}

export async function loadOrCreateLocalMemoryKey(
  userDataPath: string,
  protector: KeyProtector,
  signal?: AbortSignal,
): Promise<LocalMemoryKey> {
  throwIfAborted(signal);
  if (!(await protector.isAsyncEncryptionAvailable())) {
    throw new KeyUnavailableError("OS-protected local memory is unavailable.");
  }

  const { databasePath, envelopePath, resetMarkerPath, storeDirectory } =
    getLocalMemoryPaths(userDataPath);
  throwIfAborted(signal);
  await mkdir(storeDirectory, { recursive: true, mode: 0o700 });
  throwIfAborted(signal);
  try {
    await stat(resetMarkerPath);
    throw new KeyUnavailableError("Local memory reset must be completed before use.");
  } catch (error) {
    if (error instanceof KeyUnavailableError) throw error;
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw new KeyUnavailableError("The local memory key is unavailable.");
    }
  }

  try {
    const parsed = parseEnvelope(JSON.parse(await readFile(envelopePath, "utf8")));
    if (!parsed) throw new KeyUnavailableError("The local memory key is unavailable.");
    const decrypted = await protector.decryptStringAsync(
      Buffer.from(parsed.encryptedKey, "base64"),
    );
    throwIfAborted(signal);
    if (!/^[0-9a-f]{64}$/u.test(decrypted.result)) {
      throw new KeyUnavailableError("The local memory key is unavailable.");
    }
    if (decrypted.shouldReEncrypt) {
      await replaceEnvelope(envelopePath, parsed.storeId, decrypted.result, protector, signal);
    }
    return { databasePath, storeId: parsed.storeId, keyHex: decrypted.result };
  } catch (error) {
    if (error instanceof KeyUnavailableError) throw error;
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw new KeyUnavailableError("The local memory key is unavailable.");
    }
    try {
      await stat(databasePath);
      throw new KeyUnavailableError("The local memory key is unavailable.");
    } catch (databaseError) {
      if (databaseError instanceof KeyUnavailableError) throw databaseError;
      if ((databaseError as NodeJS.ErrnoException).code !== "ENOENT") {
        throw new KeyUnavailableError("The local memory key is unavailable.");
      }
    }
  }

  await removeStaleEnvelopeTemps(storeDirectory);
  throwIfAborted(signal);
  const keyHex = randomBytes(32).toString("hex");
  const storeId = randomUUID();
  await replaceEnvelope(envelopePath, storeId, keyHex, protector, signal);
  return { databasePath, storeId, keyHex };
}

export async function eraseUnavailableLocalMemory(
  userDataPath: string,
  signal?: AbortSignal,
): Promise<void> {
  throwIfAborted(signal);
  const { envelopePath, resetMarkerPath, storeDirectory, databasePath } =
    getLocalMemoryPaths(userDataPath);
  await mkdir(storeDirectory, { recursive: true, mode: 0o700 });
  throwIfAborted(signal);
  try {
    await writeFile(resetMarkerPath, '{"version":1}\n', {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "EEXIST") throw error;
  }

  const fixedFiles = new Set([
    databasePath,
    `${databasePath}-journal`,
    `${databasePath}-wal`,
    `${databasePath}-shm`,
    envelopePath,
  ]);
  const entries = await readdir(storeDirectory, { withFileTypes: true });
  for (const entry of entries) {
    throwIfAborted(signal);
    const path = join(storeDirectory, entry.name);
    if (entry.isFile() && (fixedFiles.has(path) || ENVELOPE_TEMP_PATTERN.test(entry.name))) {
      await unlink(path).catch((error: NodeJS.ErrnoException) => {
        if (error.code !== "ENOENT") throw error;
      });
    }
  }
  throwIfAborted(signal);
  await unlink(resetMarkerPath);
}

async function removeStaleEnvelopeTemps(storeDirectory: string): Promise<void> {
  const entries = await readdir(storeDirectory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && ENVELOPE_TEMP_PATTERN.test(entry.name)) {
      await unlink(join(storeDirectory, entry.name));
    }
  }
}

async function replaceEnvelope(
  envelopePath: string,
  storeId: string,
  keyHex: string,
  protector: KeyProtector,
  signal?: AbortSignal,
): Promise<void> {
  throwIfAborted(signal);
  const encrypted = await protector.encryptStringAsync(keyHex);
  throwIfAborted(signal);
  const temporaryPath = join(dirname(envelopePath), `.memory-key-${randomUUID()}.tmp`);
  const envelope: KeyEnvelope = {
    version: 1,
    storeId,
    encryptedKey: encrypted.toString("base64"),
  };
  try {
    await writeFile(temporaryPath, `${JSON.stringify(envelope)}\n`, {
      encoding: "utf8",
      flag: "wx",
      mode: 0o600,
      signal,
    });
    throwIfAborted(signal);
    await rename(temporaryPath, envelopePath);
  } catch (error) {
    await unlink(temporaryPath).catch(() => undefined);
    throw error;
  }
}
