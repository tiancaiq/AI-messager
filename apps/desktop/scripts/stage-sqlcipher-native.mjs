import { createHash } from "node:crypto";
import { cp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { createRequire } from "node:module";

const packageDirectory = resolve(import.meta.dirname, "..");
const nativeRoot = join(packageDirectory, "native");
const outputRoot = join(packageDirectory, "dist", "native", "sqlcipher");
const require = createRequire(import.meta.url);

const supported = process.platform === "win32" && process.arch === "x64";
if (!supported) {
  await rm(outputRoot, { recursive: true, force: true });
  process.stdout.write("SQLCipher durable memory is not staged on this platform.\n");
  process.exit(0);
}

const expectedHash = "535eac9ea27bb1e2d925eb055eb80e718896e06299f313587b911e36032fb6f4";
const binarySource = join(nativeRoot, "win32-x64", "node_sqlite3.node");
const binary = await readFile(binarySource);
const actualHash = createHash("sha256").update(binary).digest("hex");
if (actualHash !== expectedHash) {
  throw new Error("The reviewed SQLCipher native artifact failed its integrity check.");
}

const sqliteEntry = require.resolve("@appthreat/sqlite3");
const sqliteRoot = resolve(dirname(sqliteEntry), "..");
const sqliteManifest = JSON.parse(await readFile(join(sqliteRoot, "package.json"), "utf8"));
if (sqliteManifest.version !== "9.0.2" || sqliteManifest.license !== "BSD-3-Clause") {
  throw new Error("The installed SQLite wrapper does not match the reviewed dependency.");
}

const sqliteRequire = createRequire(join(sqliteRoot, "package.json"));
const nodeGypBuildManifest = sqliteRequire.resolve("node-gyp-build/package.json");
const nodeGypBuildRoot = dirname(nodeGypBuildManifest);
const stagedSqliteRoot = join(outputRoot, "node_modules", "@appthreat", "sqlite3");
const stagedLoaderRoot = join(outputRoot, "node_modules", "node-gyp-build");

await rm(outputRoot, { recursive: true, force: true });
await mkdir(join(stagedSqliteRoot, "build", "Release"), { recursive: true });
await cp(join(sqliteRoot, "lib"), join(stagedSqliteRoot, "lib"), { recursive: true });
await cp(join(sqliteRoot, "package.json"), join(stagedSqliteRoot, "package.json"));
await cp(join(sqliteRoot, "LICENSE"), join(stagedSqliteRoot, "LICENSE"));
await cp(nodeGypBuildRoot, stagedLoaderRoot, { recursive: true });
await cp(binarySource, join(stagedSqliteRoot, "build", "Release", "node_sqlite3.node"));
await cp(join(nativeRoot, "licenses"), join(outputRoot, "licenses"), { recursive: true });
await writeFile(
  join(outputRoot, "artifact.json"),
  `${JSON.stringify(
    {
      platform: "win32",
      arch: "x64",
      electron: "43.3.0",
      napi: 10,
      sqlcipher: "4.17.0 community",
      cipherProvider: "OpenSSL 3.6.4",
      wrapper: "@appthreat/sqlite3@9.0.2",
      sha256: actualHash,
    },
    null,
    2,
  )}\n`,
  "utf8",
);

process.stdout.write("Staged reviewed SQLCipher Community artifact for Windows x64.\n");
