# Reviewed SQLCipher Community artifact

`win32-x64/node_sqlite3.node` is the reviewed DATA-01 Windows x64 artifact. It is not an upstream plaintext prebuild.

- SHA-256: `535eac9ea27bb1e2d925eb055eb80e718896e06299f313587b911e36032fb6f4`
- Electron: 43.3.0 (Node 24.18.1, Node-API 10)
- SQLCipher: 4.17.0 Community, source commit `810db22f575ee7cf94ea96a3e91622b5fcece3dc`
- Crypto provider: OpenSSL 3.6.4, statically linked
- Node wrapper: `@appthreat/sqlite3` 9.0.2, built from source
- Windows dependency builder: vcpkg commit `a1cae005c39be7b18ba319fced856b68d7276271`
- Platform: Windows x64

The build used `SQLITE_HAS_CODEC`, `SQLITE_TEMP_STORE=2`, the SQLCipher extra init/shutdown hooks, session/preupdate support, and a static CRT. The wrapper's external-SQLite Windows link needed the documented Windows crypto system libraries and UTF-8 compiler input. `stage-sqlcipher-native.mjs` verifies the artifact hash and wrapper license/version before staging it under `dist/native/sqlcipher`; the application refuses durable storage unless runtime cipher checks pass.

Distribution packaging must unpack `dist/native/**` beside the application archive. The utility loader maps an `app.asar` native path to `app.asar.unpacked`, while development and relocated non-ASAR layouts retain the staged relative path. DATA-01 verifies the path mapping deterministically and the relocated native tree with Electron; actual installer creation, signing, and update delivery remain release work.

License notices are in `licenses/`. This artifact does not make durable memory available on other operating systems or architectures.
