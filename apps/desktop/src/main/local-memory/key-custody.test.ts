import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  KeyUnavailableError,
  eraseUnavailableLocalMemory,
  loadOrCreateLocalMemoryKey,
  type KeyProtector,
} from "./key-custody.js";

const directories: string[] = [];

class FakeProtector implements KeyProtector {
  async isAsyncEncryptionAvailable() {
    return true;
  }

  async encryptStringAsync(value: string) {
    return Buffer.from(`protected:${value}`, "utf8");
  }

  async decryptStringAsync(value: Buffer) {
    const encoded = value.toString("utf8");
    if (!encoded.startsWith("protected:")) throw new Error("unavailable");
    return { result: encoded.slice("protected:".length), shouldReEncrypt: false };
  }
}

afterEach(async () => {
  await Promise.all(
    directories.splice(0).map((path) => rm(path, { recursive: true, force: true })),
  );
});

async function directory() {
  const path = await mkdtemp(join(tmpdir(), "message-coach-key-test-"));
  directories.push(path);
  return path;
}

describe("local-memory key custody", () => {
  it("creates one OS-wrapped key and reuses it", async () => {
    const root = await directory();
    const protector = new FakeProtector();
    const first = await loadOrCreateLocalMemoryKey(root, protector);
    const second = await loadOrCreateLocalMemoryKey(root, protector);
    const envelope = await readFile(join(root, "local-memory", "memory-key.json"), "utf8");

    expect(first).toEqual(second);
    expect(first.keyHex).toMatch(/^[0-9a-f]{64}$/u);
    expect(first.storeId).toMatch(/^[0-9a-f-]{36}$/u);
    expect(envelope).not.toContain(first.keyHex);
  });

  it("fails closed for a corrupt envelope instead of replacing it", async () => {
    const root = await directory();
    const protector = new FakeProtector();
    await loadOrCreateLocalMemoryKey(root, protector);
    const envelopePath = join(root, "local-memory", "memory-key.json");
    await writeFile(envelopePath, "{}\n", "utf8");

    await expect(loadOrCreateLocalMemoryKey(root, protector)).rejects.toBeInstanceOf(
      KeyUnavailableError,
    );
    expect(await readFile(envelopePath, "utf8")).toBe("{}\n");
  });

  it("does not create a key when OS protection is unavailable", async () => {
    const root = await directory();
    const protector = new FakeProtector();
    protector.isAsyncEncryptionAvailable = async () => false;
    await expect(loadOrCreateLocalMemoryKey(root, protector)).rejects.toBeInstanceOf(
      KeyUnavailableError,
    );
  });

  it("does not replace a missing envelope for an existing database", async () => {
    const root = await directory();
    const store = join(root, "local-memory");
    await mkdir(store, { recursive: true });
    await writeFile(join(store, "memory.db"), "existing encrypted bytes", "utf8");
    await expect(loadOrCreateLocalMemoryKey(root, new FakeProtector())).rejects.toBeInstanceOf(
      KeyUnavailableError,
    );
  });

  it("fails closed while an interrupted reset marker exists", async () => {
    const root = await directory();
    const store = join(root, "local-memory");
    await mkdir(store, { recursive: true });
    await writeFile(join(store, "reset-in-progress.json"), '{"version":1}\n', "utf8");

    await expect(loadOrCreateLocalMemoryKey(root, new FakeProtector())).rejects.toBeInstanceOf(
      KeyUnavailableError,
    );
    expect(await readdir(store)).toContain("reset-in-progress.json");
  });

  it("resumes an interrupted reset by deleting only enumerated memory files", async () => {
    const root = await directory();
    const store = join(root, "local-memory");
    await mkdir(store, { recursive: true });
    await Promise.all([
      writeFile(join(store, "memory.db"), "encrypted", "utf8"),
      writeFile(join(store, "memory.db-journal"), "journal", "utf8"),
      writeFile(join(store, "memory-key.json"), "wrapped", "utf8"),
      writeFile(
        join(store, ".memory-key-00000000-0000-4000-8000-000000000001.tmp"),
        "wrapped temporary",
        "utf8",
      ),
      writeFile(join(store, "reset-in-progress.json"), '{"version":1}\n', "utf8"),
      writeFile(join(store, "keep-me.txt"), "unrelated", "utf8"),
    ]);

    await eraseUnavailableLocalMemory(root);

    expect(await readdir(store)).toEqual(["keep-me.txt"]);
    await expect(loadOrCreateLocalMemoryKey(root, new FakeProtector())).resolves.toMatchObject({
      databasePath: join(store, "memory.db"),
    });
  });

  it("cleans an orphaned wrapped-key temporary before creating the first envelope", async () => {
    const root = await directory();
    const store = join(root, "local-memory");
    await mkdir(store, { recursive: true });
    await writeFile(
      join(store, ".memory-key-00000000-0000-4000-8000-000000000001.tmp"),
      "wrapped temporary",
      "utf8",
    );

    await loadOrCreateLocalMemoryKey(root, new FakeProtector());

    expect((await readdir(store)).sort()).toEqual(["memory-key.json"]);
  });

  it("recovers from interrupted first-key protection without creating a database", async () => {
    const root = await directory();
    const protector = new FakeProtector();
    protector.encryptStringAsync = async () => {
      throw new Error("synthetic protection interruption");
    };

    await expect(loadOrCreateLocalMemoryKey(root, protector)).rejects.toThrow();
    expect(await readdir(join(root, "local-memory"))).toEqual([]);
    await expect(loadOrCreateLocalMemoryKey(root, new FakeProtector())).resolves.toMatchObject({
      databasePath: join(root, "local-memory", "memory.db"),
    });
  });

  it("does not publish a key envelope after an aborted protection operation", async () => {
    const root = await directory();
    const protector = new FakeProtector();
    const controller = new AbortController();
    protector.encryptStringAsync = async (value) => {
      controller.abort();
      return Buffer.from(`protected:${value}`, "utf8");
    };

    await expect(
      loadOrCreateLocalMemoryKey(root, protector, controller.signal),
    ).rejects.toBeInstanceOf(KeyUnavailableError);
    expect(await readdir(join(root, "local-memory"))).toEqual([]);
  });
});
