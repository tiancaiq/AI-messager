import { execFile as execFileCallback, spawn } from "node:child_process";
import { promisify } from "node:util";
import { access, chmod, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";

import type { DevelopmentMemoryDebugSnapshot } from "./debug-snapshot.js";

const execFile = promisify(execFileCallback);
const LETOS_EXECUTABLE_NAME = "Letos.exe";
const LETOS_PLUGIN_FILENAME = "libDbSqliteMc.dll";
const LETOS_PLUGIN_LIST_NAME = "SQLite3MultipleCiphers";
const PORTABLE_WORKSPACE_DIRECTORY = "letos-workspace";
const PORTABLE_CONFIG_DIRECTORY = "letos-cfg";
const PORTABLE_CONFIG_FILENAME = "settings";
const CONNECTION_NAME = "AI Message Coach memory snapshot";
const SQLCIPHER_QUERY_ONLY_PRAGMAS = "PRAGMA legacy = 4;\nPRAGMA query_only = ON;";

type Environment = NodeJS.ProcessEnv;

export interface LetosLaunchPlan {
  executablePath: string;
  arguments: readonly ["--safe-mode"];
  workingDirectory: string;
  pluginPath: string;
  profileDirectory: string;
  configDatabasePath: string;
}

interface LetosDebugGuiDependencies {
  environment?: Environment;
  findExecutable?: (environment: Environment) => Promise<string>;
  launch?: (plan: LetosLaunchPlan) => Promise<number>;
}

function uint32(value: number): Buffer {
  const result = Buffer.allocUnsafe(4);
  result.writeUInt32BE(value);
  return result;
}

function qString(value: string): Buffer {
  const encoded = Buffer.from(value, "utf16le");
  encoded.swap16();
  return Buffer.concat([uint32(encoded.length), encoded]);
}

function qVariantString(value: string): Buffer {
  return Buffer.concat([
    uint32(10), // QMetaType::QString
    Buffer.from([0]), // non-null QVariant
    qString(value),
  ]);
}

/** Serialize the string-only QVariantHash used by Letos 4.0.3 connection options. */
export function serializeLetosConnectionOptions(values: Readonly<Record<string, string>>): Buffer {
  const entries = Object.entries(values).sort(([left], [right]) => left.localeCompare(right));
  const serializedEntries = entries.flatMap(([key, value]) => [
    qString(key),
    qVariantString(value),
  ]);
  return Buffer.concat([
    uint32(28), // QMetaType::QVariantHash
    Buffer.from([0]), // non-null QVariant
    uint32(entries.length),
    ...serializedEntries,
  ]);
}

function qVariantBoolean(value: boolean): Buffer {
  return Buffer.concat([
    uint32(1), // QMetaType::Bool
    Buffer.from([0]), // non-null QVariant
    Buffer.from([value ? 1 : 0]),
  ]);
}

function getKnownLetosPaths(environment: Environment): string[] {
  const candidates = [
    environment.AI_MESSAGE_COACH_LETOS_PATH,
    environment.ProgramFiles === undefined
      ? undefined
      : join(environment.ProgramFiles, "Letos", LETOS_EXECUTABLE_NAME),
    environment["ProgramFiles(x86)"] === undefined
      ? undefined
      : join(environment["ProgramFiles(x86)"], "Letos", LETOS_EXECUTABLE_NAME),
    "C:\\Program Files\\Letos\\Letos.exe",
  ];
  return [...new Set(candidates.filter((value): value is string => Boolean(value)))];
}

async function getRegistryLetosPaths(): Promise<string[]> {
  if (process.platform !== "win32") return [];
  const roots = [
    "HKLM\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
    "HKCU\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
    "HKLM\\SOFTWARE\\WOW6432Node\\Microsoft\\Windows\\CurrentVersion\\Uninstall",
  ];
  const paths: string[] = [];
  for (const root of roots) {
    try {
      const { stdout } = await execFile("reg.exe", ["query", root, "/s", "/f", "Letos", "/d"], {
        encoding: "utf8",
        timeout: 5_000,
        windowsHide: true,
      });
      for (const match of stdout.matchAll(/InstallLocation\s+REG_SZ\s+([^\r\n]+)/giu)) {
        const installLocation = match[1]?.trim();
        if (installLocation) paths.push(join(installLocation, LETOS_EXECUTABLE_NAME));
      }
    } catch {
      // Registry discovery is best effort; deterministic paths are checked too.
    }
  }
  return paths;
}

export async function findLetosExecutable(environment: Environment = process.env): Promise<string> {
  if (process.platform !== "win32") {
    throw new Error(
      "The Letos memory GUI helper currently supports Windows development hosts only.",
    );
  }
  const candidates = [...getKnownLetosPaths(environment), ...(await getRegistryLetosPaths())];
  for (const candidate of candidates) {
    try {
      await access(candidate);
      return resolve(candidate);
    } catch {
      // Continue to the next installation candidate.
    }
  }
  throw new Error(
    "Letos was not found. Install Letos 4.0.3, or set AI_MESSAGE_COACH_LETOS_PATH to Letos.exe.",
  );
}

export async function createLetosLaunchPlan(
  snapshot: DevelopmentMemoryDebugSnapshot,
  executablePath: string,
): Promise<LetosLaunchPlan> {
  const workingDirectory = join(snapshot.directoryPath, PORTABLE_WORKSPACE_DIRECTORY);
  const profileDirectory = join(workingDirectory, PORTABLE_CONFIG_DIRECTORY);
  const configDatabasePath = join(profileDirectory, PORTABLE_CONFIG_FILENAME);
  const pluginPath = join(dirname(executablePath), "plugins", LETOS_PLUGIN_FILENAME);

  const pluginBytes = await readFile(pluginPath).catch(() => {
    throw new Error(
      "Letos is installed without SQLite3MultipleCiphers. Install the official SQLite3MultipleCiphers plugin in Letos, then run this command again.",
    );
  });
  const pluginText = pluginBytes.toString("latin1");
  if (!pluginText.includes(LETOS_PLUGIN_LIST_NAME) || !pluginText.includes("DbSqliteMc")) {
    throw new Error(
      "Letos has an unrecognized SQLite3MultipleCiphers plugin file. Install the official plugin, then run this command again.",
    );
  }
  await mkdir(profileDirectory, { recursive: true, mode: 0o700 });
  await writeFile(join(profileDirectory, "settings.ini"), "AllowMultipleSessions=true\n", {
    mode: 0o600,
  });

  const config = new DatabaseSync(configDatabasePath);
  try {
    config.exec(`
      PRAGMA foreign_keys = ON;
      CREATE TABLE version (version NUMERIC);
      INSERT INTO version VALUES (16);
      CREATE TABLE settings ([group] TEXT, [key] TEXT, value, PRIMARY KEY([group], [key]));
      CREATE TABLE dblist (name TEXT PRIMARY KEY, path TEXT UNIQUE, options TEXT);
      CREATE TABLE groups (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        parent INTEGER REFERENCES groups(id),
        [order] INTEGER,
        open INTEGER DEFAULT 0,
        dbname TEXT UNIQUE REFERENCES dblist(name) ON UPDATE CASCADE ON DELETE CASCADE,
        db_expanded INTEGER DEFAULT 0,
        UNIQUE(name, parent)
      );
    `);
    config
      .prepare("INSERT INTO settings ([group], [key], value) VALUES (?, ?, ?)")
      .run("General", "LanguageAsked", qVariantBoolean(true));
    config.prepare("INSERT INTO dblist (name, path, options) VALUES (?, ?, ?)").run(
      CONNECTION_NAME,
      snapshot.databasePath,
      serializeLetosConnectionOptions({
        cipher: "sqlcipher",
        password: snapshot.passphrase,
        plugin: "DbSqliteMc",
        pragmas: SQLCIPHER_QUERY_ONLY_PRAGMAS,
      }),
    );
    config
      .prepare(
        "INSERT INTO groups (name, parent, [order], open, dbname, db_expanded) VALUES (?, NULL, 0, 1, ?, 1)",
      )
      .run(CONNECTION_NAME, CONNECTION_NAME);
  } finally {
    config.close();
  }
  await chmod(configDatabasePath, 0o600);

  return {
    executablePath,
    arguments: ["--safe-mode"],
    workingDirectory,
    pluginPath,
    profileDirectory,
    configDatabasePath,
  };
}

async function launchLetos(plan: LetosLaunchPlan): Promise<number> {
  return await new Promise<number>((resolvePromise, reject) => {
    const child = spawn(plan.executablePath, [...plan.arguments], {
      cwd: plan.workingDirectory,
      stdio: "inherit",
      windowsHide: false,
    });
    child.once("error", reject);
    child.once("exit", (code) => resolvePromise(code ?? 0));
  });
}

export async function openDevelopmentMemorySnapshotInLetos(
  snapshot: DevelopmentMemoryDebugSnapshot,
  dependencies: LetosDebugGuiDependencies = {},
): Promise<void> {
  const environment = dependencies.environment ?? process.env;
  const findExecutable = dependencies.findExecutable ?? findLetosExecutable;
  const executablePath = await findExecutable(environment);
  const plan = await createLetosLaunchPlan(snapshot, executablePath);
  try {
    // Letos opens files read/write before SQLite can apply query_only. The file is only the
    // independently keyed snapshot; every Letos connection is still forced into query-only mode.
    await chmod(snapshot.databasePath, 0o600);
    process.stdout.write(
      [
        "Opening an encrypted, query-only local-memory snapshot in Letos.",
        `Snapshot: ${snapshot.databasePath}`,
        `Schema version: ${snapshot.schemaVersion}`,
        "The live database and its OS-protected key are not shared with Letos.",
        "Close Letos to delete the temporary snapshot, password, and portable Letos profile.",
        "",
      ].join("\n"),
    );
    const exitCode = await (dependencies.launch ?? launchLetos)(plan);
    if (exitCode !== 0) throw new Error(`Letos exited with code ${exitCode}.`);
  } finally {
    await rm(plan.profileDirectory, { recursive: true, force: true });
  }
}
