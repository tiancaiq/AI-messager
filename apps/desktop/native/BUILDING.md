# Rebuilding the reviewed Windows artifact

This recipe documents the DATA-01 artifact provenance. Run it in a disposable directory on Windows x64 with Visual Studio 2022 C++ tools. Do not replace the reviewed artifact automatically: rerun the native gate, review licenses and dependencies, then deliberately update the SHA-256 in `README.md` and `stage-sqlcipher-native.mjs`.

Pinned inputs:

- SQLCipher Community `v4.17.0`, commit `810db22f575ee7cf94ea96a3e91622b5fcece3dc`
- vcpkg commit `a1cae005c39be7b18ba319fced856b68d7276271`
- OpenSSL `3.6.4` from that vcpkg registry
- `@appthreat/sqlite3@9.0.2`, npm integrity `sha512-i/TUHpgZT210LsP47WSnOuUp8mCfJpuZ3VTiUYue54h4TR23NHbMJm8hbtD5Aq3CMjd5xg3+tTCRyvn0oEq32g==`
- Electron `43.3.0`, Node `24.18.1`, Node-API `10`

Build outline:

1. Clone the pinned SQLCipher and vcpkg commits into a disposable directory and bootstrap vcpkg.
2. Run `vcpkg install openssl:x64-windows-static --clean-after-build`.
3. From a Visual Studio 2022 x64 developer prompt, build `libsqlite3.lib` from the SQLCipher checkout with `nmake /f Makefile.msc libsqlite3.lib NO_TCL=1 SESSION=1 PLATFORM=x64 USE_CRT_DLL=0 OPTIMIZATIONS=2` and these `OPTS`: `SQLITE_HAS_CODEC`, `SQLITE_TEMP_STORE=2`, `SQLITE_EXTRA_INIT=sqlcipher_extra_init`, `SQLITE_EXTRA_SHUTDOWN=sqlcipher_extra_shutdown`, plus the vcpkg OpenSSL include directory.
4. Create an external prefix containing SQLCipher's generated `sqlite3.h`, `sqlite3ext.h`, and `sqlite3session.h`. Merge `libsqlite3.lib` and vcpkg's static `libcrypto.lib` into `prefix/lib/sqlcipher.lib` with `lib.exe`.
5. Install the exact wrapper without running its default install script. Apply `appthreat-sqlcipher-windows.patch` to its `binding.gyp` so the final addon links the Windows crypto and socket import libraries.
6. Set `CL=/utf-8` and `GYP_DEFINES=sqlite=<absolute-prefix> sqlite_libname=sqlcipher`, then run node-gyp against Electron 43.3.0 headers with `--runtime=electron --target=43.3.0 --dist-url=https://electronjs.org/headers --napi_build_version=10`.
7. Inspect `node_sqlite3.node` with `dumpbin /DEPENDENTS`. It should depend only on Windows system DLLs and delay-load `node.exe`; it must not require a separately packaged OpenSSL DLL.
8. Copy the candidate to `native/win32-x64`, update its reviewed hash, and run `pnpm --filter @ai-message-coach/desktop test:native-memory` before adoption.

The gate must confirm the SQLCipher version/provider, compile-time and runtime memory-only temp storage, encrypted database and rollback journal bytes, correct-key restart, wrong/no-key rejection, cipher integrity, stale-write conflict, clear-generation invalidation, async safeStorage, utility-process loading, and a relocated production layout. A failed check keeps durable memory unavailable; never use the wrapper's bundled plaintext SQLite prebuild as a fallback.
