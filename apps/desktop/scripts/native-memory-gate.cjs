const { randomBytes, randomUUID } = require("node:crypto");
const { mkdirSync } = require("node:fs");
const { copyFile, cp, mkdtemp, readFile, rm, writeFile } = require("node:fs/promises");
const { tmpdir } = require("node:os");
const { join, resolve } = require("node:path");
const { app, BrowserWindow, ipcMain, safeStorage, utilityProcess } = require("electron");

app.disableHardwareAcceleration();
const nativeGateRunId = /^[0-9a-f-]{36}$/u.test(
  process.env.AI_MESSAGE_COACH_NATIVE_GATE_RUN_ID ?? "",
)
  ? process.env.AI_MESSAGE_COACH_NATIVE_GATE_RUN_ID
  : randomUUID();
const nativeGateProfile = join(
  tmpdir(),
  `ai-message-coach-native-profile-${nativeGateRunId}-${randomUUID()}`,
);
mkdirSync(nativeGateProfile);
app.setPath("userData", nativeGateProfile);

const utilityPath = resolve(__dirname, "../dist/main/local-memory/storage-utility.cjs");
const sqliteEntry = resolve(
  __dirname,
  "../dist/native/sqlcipher/node_modules/@appthreat/sqlite3/lib/sqlite3.js",
);

async function openRawDatabase(databasePath, keyHex) {
  const loaded = require(sqliteEntry);
  const sqlite = loaded.default ?? loaded;
  const database = await sqlite.open(databasePath);
  if (keyHex) await database.exec(`PRAGMA key = "x'${keyHex}'";`);
  return database;
}

async function openPassphraseDatabase(databasePath, passphrase) {
  const loaded = require(sqliteEntry);
  const sqlite = loaded.default ?? loaded;
  const database = await sqlite.open(databasePath);
  await database.exec(`PRAGMA key = '${passphrase}';`);
  return database;
}

function startWorker(workerPath = utilityPath) {
  const child = utilityProcess.fork(workerPath, [], {
    env: Object.fromEntries(
      ["SystemRoot", "WINDIR", "TEMP", "TMP"].flatMap((name) =>
        process.env[name] === undefined ? [] : [[name, process.env[name]]],
      ),
    ),
    serviceName: "DATA-01 native memory gate",
    stdio: "ignore",
  });
  return child;
}

function request(child, value, timeoutMs = 10_000) {
  return new Promise((resolveResult, reject) => {
    const timer = setTimeout(() => reject(new Error("native gate timed out")), timeoutMs);
    const receive = (message) => {
      if (message?.requestId !== value.requestId) return;
      clearTimeout(timer);
      child.off("message", receive);
      resolveResult(message.result);
    };
    child.on("message", receive);
    child.postMessage(value);
  });
}

function directoryRequest(child, requestValue) {
  return request(child, { operation: "DIRECTORY", requestId: randomUUID(), request: requestValue });
}

function memoryRequest(child, requestValue) {
  return request(child, { operation: "MEMORY", requestId: randomUUID(), request: requestValue });
}

function syntheticRelationshipEvidence() {
  return {
    source: "SYNTHETIC_FIXTURE",
    sourceReference: randomUUID(),
    sourceTime: { precision: "UNKNOWN" },
    confidence: { extraction: null, attribution: null, predicate: 0.76 },
    association: null,
  };
}

app.whenReady().then(async () => {
  let gateExitCode = 0;
  let gateDirectory;
  let firstWorker;
  let secondWorker;
  let clearedWorker;
  let wrongKeyWorker;
  let wrongStoreWorker;
  let futureSchemaWorker;
  let corruptWorker;
  let legacyWorker;
  let versionTwoWorker;
  let versionThreeWorker;
  let versionFourWorker;
  let data03Worker;
  let relocatedWorker;
  let productionBridgeWindow;
  try {
    if (!(await safeStorage.isAsyncEncryptionAvailable())) {
      throw new Error("safeStorage async encryption unavailable");
    }
    const keyHex = randomBytes(32).toString("hex");
    const storeId = randomUUID();
    const wrapped = await safeStorage.encryptStringAsync(keyHex);
    const unwrapped = await safeStorage.decryptStringAsync(wrapped);
    if (unwrapped.result !== keyHex) throw new Error("safeStorage round trip failed");

    delete process.env.VITE_DEV_SERVER_URL;
    productionBridgeWindow = new BrowserWindow({
      show: false,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        preload: resolve(__dirname, "../dist/preload/index.cjs"),
        sandbox: true,
      },
    });
    await productionBridgeWindow.loadURL("data:text/html,<main>production bridge gate</main>");
    const productionInspectorType = await productionBridgeWindow.webContents.executeJavaScript(
      "typeof window.messageCoach?.inspectLocalMemory",
    );
    if (productionInspectorType !== "undefined") {
      throw new Error("production preload exposed the development inspector");
    }
    const productionDirectoryType = await productionBridgeWindow.webContents.executeJavaScript(
      "typeof window.messageCoach?.runContactDirectoryOperation",
    );
    if (productionDirectoryType !== "undefined") {
      throw new Error("production preload exposed contact-directory mutation APIs");
    }
    const productionMemoryType = await productionBridgeWindow.webContents.executeJavaScript(
      "typeof window.messageCoach?.runMemoryAssertionOperation",
    );
    if (productionMemoryType !== "undefined") {
      throw new Error("production preload exposed memory-assertion mutation APIs");
    }
    const uiGeneration = randomUUID();
    let uiAvailable = true;
    let uiClearCalls = 0;
    let uiResetCalls = 0;
    let uiSnapshot = {
      generation: uiGeneration,
      revision: 0,
      directoryRevision: 0,
      memoryRevision: 0,
      messageLength: null,
      updatedAt: null,
    };
    ipcMain.handle("conversation-analysis:provider-configuration", () => ({
      providerId: "openai",
      modelId: "synthetic-gate",
      configured: false,
      capabilities: { textGeneration: false, vision: false, structuredOutput: false },
    }));
    ipcMain.handle("local-memory:status", () =>
      uiAvailable
        ? { available: true, snapshot: uiSnapshot }
        : {
            available: false,
            error: { code: "KEY_UNAVAILABLE", message: "Synthetic key unavailable." },
          },
    );
    ipcMain.handle("local-memory:save", (_event, requestValue) => {
      uiSnapshot = {
        generation: uiSnapshot.generation,
        revision: uiSnapshot.revision + 1,
        directoryRevision: uiSnapshot.directoryRevision,
        memoryRevision: uiSnapshot.memoryRevision + 1,
        messageLength: requestValue.value,
        updatedAt: "2026-09-14T10:00:00.000Z",
      };
      return { ok: true, snapshot: uiSnapshot };
    });
    ipcMain.handle("local-memory:delete", () => {
      uiSnapshot = {
        generation: uiSnapshot.generation,
        revision: uiSnapshot.revision + 1,
        directoryRevision: uiSnapshot.directoryRevision,
        memoryRevision: uiSnapshot.memoryRevision + 1,
        messageLength: null,
        updatedAt: null,
      };
      return { ok: true, snapshot: uiSnapshot };
    });
    ipcMain.handle("local-memory:clear", () => {
      uiClearCalls += 1;
      uiSnapshot = {
        generation: randomUUID(),
        revision: 0,
        directoryRevision: 0,
        memoryRevision: 0,
        messageLength: null,
        updatedAt: null,
      };
      return { ok: true, snapshot: uiSnapshot };
    });
    ipcMain.handle("local-memory:reset-unavailable", () => {
      uiResetCalls += 1;
      uiAvailable = true;
      uiSnapshot = {
        generation: randomUUID(),
        revision: 0,
        directoryRevision: 0,
        memoryRevision: 0,
        messageLength: null,
        updatedAt: null,
      };
      return { ok: true, snapshot: uiSnapshot };
    });
    await productionBridgeWindow.loadFile(resolve(__dirname, "../dist/renderer/index.html"));
    const uiSmoke = await productionBridgeWindow.webContents.executeJavaScript(`
      (async () => {
        let checkpoint = "settings-start";
        const waitFor = async (predicate) => {
          for (let attempt = 0; attempt < 100; attempt += 1) {
            const value = predicate();
            if (value) return value;
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
          throw new Error("UI state did not settle at " + checkpoint + ": " + document.body.innerText.slice(-1200));
        };
        const settings = await waitFor(() => document.querySelector(".memory-settings"));
        settings.open = true;
        const select = await waitFor(() => document.querySelector("#message-length:not(:disabled)"));
        select.value = "CONCISE";
        select.dispatchEvent(new Event("change", { bubbles: true }));
        await new Promise((resolve) => setTimeout(resolve, 0));
        select.value = "BALANCED";
        select.dispatchEvent(new Event("change", { bubbles: true }));
        const button = (label) =>
          [...document.querySelectorAll(".memory-actions button")].find(
            (candidate) => candidate.textContent.trim() === label,
          );
        const save = await waitFor(() => {
          const candidate = button("Save");
          return candidate && !candidate.disabled ? candidate : null;
        });
        save.click();
        await waitFor(() => document.querySelector(".memory-status")?.textContent === "Saved locally.");
        const remove = await waitFor(() => {
          const candidate = button("Delete preference");
          return candidate && !candidate.disabled ? candidate : null;
        });
        remove.click();
        await waitFor(() => document.querySelector(".memory-status")?.textContent === "No preference saved.");
        select.value = "DETAILED";
        select.dispatchEvent(new Event("change", { bubbles: true }));
        const saveAgain = await waitFor(() => {
          const candidate = button("Save");
          return candidate && !candidate.disabled ? candidate : null;
        });
        saveAgain.click();
        await waitFor(() => document.querySelector(".memory-status")?.textContent === "Saved locally.");
        const clear = button("Clear all local memory");
        window.confirm = () => false;
        clear.click();
        await new Promise((resolve) => setTimeout(resolve, 30));
        if (document.querySelector(".memory-status")?.textContent !== "Saved locally.") {
          throw new Error("cancelled clear changed UI state");
        }
        window.confirm = () => true;
        clear.click();
        await waitFor(() => document.querySelector(".memory-status")?.textContent === "No preference saved.");
        if (document.querySelector(".contact-directory") || document.body.innerText.includes("Contacts and identities")) {
          throw new Error("production renderer exposed manual contact/identity management");
        }
        return { savedDeletedAndCleared: true, directoryUiAbsent: true };
      })()
    `);
    if (
      !uiSmoke.savedDeletedAndCleared ||
      !uiSmoke.directoryUiAbsent ||
      uiSnapshot.messageLength !== null ||
      uiSnapshot.revision !== 0 ||
      uiClearCalls !== 1
    ) {
      throw new Error("production settings UI smoke failed");
    }
    uiAvailable = false;
    await productionBridgeWindow.reload();
    const resetSmoke = await productionBridgeWindow.webContents.executeJavaScript(`
      (async () => {
        const waitFor = async (predicate) => {
          for (let attempt = 0; attempt < 100; attempt += 1) {
            const value = predicate();
            if (value) return value;
            await new Promise((resolve) => setTimeout(resolve, 20));
          }
          throw new Error("UI state did not settle: " + document.body.innerText.slice(-1200));
        };
        const settings = await waitFor(() => document.querySelector(".memory-settings"));
        settings.open = true;
        const erase = await waitFor(() =>
          [...document.querySelectorAll(".memory-actions button")].find(
            (candidate) => candidate.textContent.trim() === "Erase unavailable storage",
          ),
        );
        window.confirm = () => false;
        erase.click();
        await new Promise((resolve) => setTimeout(resolve, 30));
        window.confirm = () => true;
        erase.click();
        await waitFor(() => document.querySelector(".memory-status")?.textContent === "No preference saved.");
        return { resetRecovered: true };
      })()
    `);
    if (!resetSmoke.resetRecovered || uiResetCalls !== 1 || !uiAvailable) {
      throw new Error("unavailable-store reset UI smoke failed");
    }
    gateDirectory = await mkdtemp(
      join(tmpdir(), `ai-message-coach-native-gate-${nativeGateRunId}-`),
    );
    const relocatedRoot = join(gateDirectory, "relocated-dist");
    const relocatedUtility = join(relocatedRoot, "main", "local-memory", "storage-utility.cjs");
    await cp(resolve(__dirname, "../dist/main"), join(relocatedRoot, "main"), {
      recursive: true,
    });
    await cp(resolve(__dirname, "../dist/native"), join(relocatedRoot, "native"), {
      recursive: true,
    });
    relocatedWorker = startWorker(relocatedUtility);
    const relocatedOpened = await request(relocatedWorker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath: join(gateDirectory, "relocated-memory.db"),
      storeId: randomUUID(),
      keyHex: randomBytes(32).toString("hex"),
    });
    if (!relocatedOpened.ok) throw new Error("relocated native layout failed");
    relocatedWorker.kill();
    relocatedWorker = undefined;
    const databasePath = join(gateDirectory, "memory.db");
    firstWorker = startWorker();
    const opened = await request(firstWorker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath,
      storeId,
      keyHex,
    });
    if (!opened.ok || opened.snapshot.messageLength !== null)
      throw new Error("initial open failed");
    const saved = await request(firstWorker, {
      operation: "SAVE",
      requestId: randomUUID(),
      generation: opened.snapshot.generation,
      revision: opened.snapshot.revision,
      value: "CONCISE",
    });
    if (!saved.ok || saved.snapshot.revision !== 1) throw new Error("committed save failed");
    firstWorker.kill();
    firstWorker = undefined;

    secondWorker = startWorker();
    const reopened = await request(secondWorker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath,
      storeId,
      keyHex,
    });
    if (!reopened.ok || reopened.snapshot.messageLength !== "CONCISE") {
      throw new Error("restart persistence failed");
    }
    let directoryVersion = {
      generation: reopened.snapshot.generation,
      directoryRevision: reopened.snapshot.directoryRevision,
    };
    const firstAlex = await directoryRequest(secondWorker, {
      operation: "CREATE_CONTACT",
      ...directoryVersion,
      label: "Alex",
    });
    if (!firstAlex.ok || firstAlex.result.kind !== "MUTATION")
      throw new Error("first contact create failed");
    const firstContact = firstAlex.result.contacts[0];
    directoryVersion.directoryRevision = firstAlex.result.directoryRevision;
    const secondAlex = await directoryRequest(secondWorker, {
      operation: "CREATE_CONTACT",
      ...directoryVersion,
      label: "Alex",
    });
    if (!secondAlex.ok || secondAlex.result.kind !== "MUTATION")
      throw new Error("duplicate-label contact create failed");
    const secondContact = secondAlex.result.contacts[0];
    if (!firstContact || !secondContact || firstContact.id === secondContact.id)
      throw new Error("same-name contacts merged");
    directoryVersion.directoryRevision = secondAlex.result.directoryRevision;
    const firstIdentityResult = await directoryRequest(secondWorker, {
      operation: "CREATE_IDENTITY",
      ...directoryVersion,
      platform: "Synthetic A",
      namespace: null,
      identifierKind: "handle",
      identifierValue: "alex.synthetic",
      displayLabel: "Alex",
      candidateContactId: firstContact.id,
    });
    if (!firstIdentityResult.ok || firstIdentityResult.result.kind !== "MUTATION")
      throw new Error("identity/candidate create failed");
    const firstIdentity = firstIdentityResult.result.identities[0];
    const firstCandidate = firstIdentityResult.result.associations[0];
    if (!firstIdentity || !firstCandidate || firstCandidate.status !== "CANDIDATE")
      throw new Error("candidate was implicitly confirmed");
    directoryVersion.directoryRevision = firstIdentityResult.result.directoryRevision;
    const secondIdentityResult = await directoryRequest(secondWorker, {
      operation: "CREATE_IDENTITY",
      ...directoryVersion,
      platform: "Synthetic B",
      namespace: "workspace-two",
      identifierKind: "handle",
      identifierValue: "alex.synthetic",
      displayLabel: "Alex",
      candidateContactId: null,
    });
    if (!secondIdentityResult.ok || secondIdentityResult.result.kind !== "MUTATION")
      throw new Error("same-handle identity create failed");
    const secondIdentity = secondIdentityResult.result.identities[0];
    if (!secondIdentity || secondIdentity.id === firstIdentity.id)
      throw new Error("same-handle identities merged");
    directoryVersion.directoryRevision = secondIdentityResult.result.directoryRevision;
    const confirmed = await directoryRequest(secondWorker, {
      operation: "DECIDE_ASSOCIATION",
      ...directoryVersion,
      associationId: firstCandidate.id,
      associationRevision: firstCandidate.revision,
      decision: "CONFIRM",
    });
    if (
      !confirmed.ok ||
      confirmed.result.kind !== "MUTATION" ||
      confirmed.result.associations[0]?.status !== "CONFIRMED"
    )
      throw new Error("explicit confirmation failed");
    const confirmedAssociation = confirmed.result.associations[0];
    directoryVersion.directoryRevision = confirmed.result.directoryRevision;
    let memoryVersion = {
      generation: reopened.snapshot.generation,
      memoryRevision: reopened.snapshot.memoryRevision,
    };
    const proposedMemory = await memoryRequest(secondWorker, {
      operation: "PROPOSE",
      ...memoryVersion,
      subject: { kind: "CONTACT", contactId: firstContact.id },
      contactRevision: firstContact.revision,
      value: "DETAILED",
      applicability: "CURRENT",
      validTime: { precision: "CALENDAR_MONTH", value: "2026-09" },
      evidence: {
        source: "SYNTHETIC_FIXTURE",
        sourceReference: "native-observation-1",
        sourceTime: { precision: "CALENDAR_MONTH", value: "2026-09" },
        confidence: { extraction: 0.95, attribution: 0.9, predicate: 0.85 },
        association: {
          associationId: confirmedAssociation.id,
          associationRevision: confirmedAssociation.revision,
        },
      },
    });
    if (
      !proposedMemory.ok ||
      proposedMemory.result.kind !== "MUTATION" ||
      proposedMemory.result.assertions[0]?.acceptance !== "CANDIDATE"
    )
      throw new Error("memory proposal was not retained as a candidate");
    const memoryCandidate = proposedMemory.result.assertions[0];
    memoryVersion.memoryRevision = proposedMemory.result.memoryRevision;
    const supportedMemory = await memoryRequest(secondWorker, {
      operation: "ADD_EVIDENCE",
      ...memoryVersion,
      assertionId: memoryCandidate.id,
      assertionRevision: memoryCandidate.revision,
      evidenceValue: "DETAILED",
      role: "SUPPORTS",
      evidence: {
        source: "SYNTHETIC_FIXTURE",
        sourceReference: "native-observation-2",
        sourceTime: { precision: "UNKNOWN" },
        confidence: { extraction: 1, attribution: 1, predicate: 1 },
        association: {
          associationId: confirmedAssociation.id,
          associationRevision: confirmedAssociation.revision,
        },
      },
    });
    if (
      !supportedMemory.ok ||
      supportedMemory.result.kind !== "MUTATION" ||
      supportedMemory.result.assertions[0]?.acceptance !== "CANDIDATE"
    )
      throw new Error("evidence incorrectly confirmed a memory candidate");
    memoryVersion.memoryRevision = supportedMemory.result.memoryRevision;
    const rejectedMemory = await memoryRequest(secondWorker, {
      operation: "DECIDE",
      ...memoryVersion,
      assertionId: memoryCandidate.id,
      assertionRevision: memoryCandidate.revision,
      decision: "REJECT",
      authority: "SYNTHETIC_FIXTURE",
    });
    if (
      !rejectedMemory.ok ||
      rejectedMemory.result.kind !== "MUTATION" ||
      rejectedMemory.result.assertions[0]?.acceptance !== "REJECTED"
    )
      throw new Error("memory rejection failed");
    memoryVersion.memoryRevision = rejectedMemory.result.memoryRevision;
    const repeatedMemory = await memoryRequest(secondWorker, {
      operation: "PROPOSE",
      ...memoryVersion,
      subject: { kind: "CONTACT", contactId: firstContact.id },
      contactRevision: firstContact.revision,
      value: "DETAILED",
      applicability: "CURRENT",
      validTime: { precision: "UNKNOWN" },
      evidence: {
        source: "SYNTHETIC_FIXTURE",
        sourceReference: "native-observation-3",
        sourceTime: { precision: "UNKNOWN" },
        confidence: { extraction: 1, attribution: 1, predicate: 1 },
        association: {
          associationId: confirmedAssociation.id,
          associationRevision: confirmedAssociation.revision,
        },
      },
    });
    if (
      !repeatedMemory.ok ||
      repeatedMemory.result.kind !== "MUTATION" ||
      repeatedMemory.result.assertions[0]?.acceptance !== "REJECTED"
    )
      throw new Error("repeated evidence overrode explicit rejection");
    memoryVersion.memoryRevision = repeatedMemory.result.memoryRevision;
    const reconsideredMemory = await memoryRequest(secondWorker, {
      operation: "RECONSIDER",
      ...memoryVersion,
      assertionId: repeatedMemory.result.assertions[0].id,
      assertionRevision: repeatedMemory.result.assertions[0].revision,
      decisionId: rejectedMemory.result.decisions[0].id,
      evidence: {
        source: "SYNTHETIC_FIXTURE",
        sourceReference: "native-observation-4",
        sourceTime: { precision: "UNKNOWN" },
        confidence: { extraction: null, attribution: null, predicate: null },
        association: {
          associationId: confirmedAssociation.id,
          associationRevision: confirmedAssociation.revision,
        },
      },
    });
    if (
      !reconsideredMemory.ok ||
      reconsideredMemory.result.kind !== "MUTATION" ||
      reconsideredMemory.result.assertions[1]?.acceptance !== "CANDIDATE"
    )
      throw new Error("memory reconsideration did not create a candidate");
    const reconsideredAssertion = reconsideredMemory.result.assertions[1];
    memoryVersion.memoryRevision = reconsideredMemory.result.memoryRevision;
    const confirmedMemory = await memoryRequest(secondWorker, {
      operation: "DECIDE",
      ...memoryVersion,
      assertionId: reconsideredAssertion.id,
      assertionRevision: reconsideredAssertion.revision,
      decision: "CONFIRM",
      authority: "SYNTHETIC_FIXTURE",
    });
    if (
      !confirmedMemory.ok ||
      confirmedMemory.result.kind !== "MUTATION" ||
      confirmedMemory.result.assertions[0]?.acceptance !== "CONFIRMED"
    )
      throw new Error("reconsidered memory confirmation failed");
    memoryVersion.memoryRevision = confirmedMemory.result.memoryRevision;
    const correctedMemory = await memoryRequest(secondWorker, {
      operation: "REPLACE",
      ...memoryVersion,
      assertionId: confirmedMemory.result.assertions[0].id,
      assertionRevision: confirmedMemory.result.assertions[0].revision,
      subject: { kind: "CONTACT", contactId: firstContact.id },
      contactRevision: firstContact.revision,
      value: "CONCISE",
      applicability: "CURRENT",
      validTime: {
        precision: "CALENDAR_MONTH",
        value: "2026-09",
        endExclusive: "2026-10",
      },
      evidence: {
        source: "SYNTHETIC_FIXTURE",
        sourceReference: "native-correction-1",
        sourceTime: { precision: "UNKNOWN" },
        confidence: { extraction: null, attribution: null, predicate: null },
        association: {
          associationId: confirmedAssociation.id,
          associationRevision: confirmedAssociation.revision,
        },
      },
      authority: "SYNTHETIC_FIXTURE",
    });
    if (
      !correctedMemory.ok ||
      correctedMemory.result.kind !== "MUTATION" ||
      correctedMemory.result.assertions[0]?.lifecycle !== "SUPERSEDED" ||
      correctedMemory.result.assertions[1]?.value !== "CONCISE" ||
      correctedMemory.result.assertions[1]?.validTime.endExclusive !== "2026-10"
    )
      throw new Error("atomic memory correction failed");
    memoryVersion.memoryRevision = correctedMemory.result.memoryRevision;
    const proposedOther = await directoryRequest(secondWorker, {
      operation: "PROPOSE_ASSOCIATION",
      ...directoryVersion,
      identityId: firstIdentity.id,
      identityRevision: firstIdentity.revision,
      contactId: secondContact.id,
      contactRevision: secondContact.revision,
    });
    if (!proposedOther.ok || proposedOther.result.kind !== "MUTATION")
      throw new Error("second candidate failed");
    const secondCandidate = proposedOther.result.associations[0];
    directoryVersion.directoryRevision = proposedOther.result.directoryRevision;
    const conflictingConfirmation = await directoryRequest(secondWorker, {
      operation: "DECIDE_ASSOCIATION",
      ...directoryVersion,
      associationId: secondCandidate.id,
      associationRevision: secondCandidate.revision,
      decision: "CONFIRM",
    });
    if (conflictingConfirmation.ok || conflictingConfirmation.error.code !== "CONFLICT")
      throw new Error("multiple confirmed targets accepted");
    const rejected = await directoryRequest(secondWorker, {
      operation: "DECIDE_ASSOCIATION",
      ...directoryVersion,
      associationId: secondCandidate.id,
      associationRevision: secondCandidate.revision,
      decision: "REJECT",
    });
    if (!rejected.ok || rejected.result.kind !== "MUTATION")
      throw new Error("candidate rejection failed");
    directoryVersion.directoryRevision = rejected.result.directoryRevision;
    const revoked = await directoryRequest(secondWorker, {
      operation: "REVOKE_ASSOCIATION",
      ...directoryVersion,
      associationId: confirmedAssociation.id,
      associationRevision: confirmedAssociation.revision,
      confirmation: "REVOKE_ASSOCIATION",
    });
    if (
      !revoked.ok ||
      revoked.result.kind !== "MUTATION" ||
      revoked.result.associations[0]?.status !== "REVOKED"
    )
      throw new Error("revocation failed");
    directoryVersion.directoryRevision = revoked.result.directoryRevision;
    const afterRevocation = await request(secondWorker, {
      operation: "READ",
      requestId: randomUUID(),
    });
    if (
      !afterRevocation.ok ||
      afterRevocation.snapshot.memoryRevision <= memoryVersion.memoryRevision
    )
      throw new Error("association revocation did not invalidate dependent memory");
    memoryVersion.memoryRevision = afterRevocation.snapshot.memoryRevision;
    const contactAssertionsAfterRevocation = await memoryRequest(secondWorker, {
      operation: "LIST",
      ...memoryVersion,
      recordType: "MEMORY_ASSERTION",
      cursor: null,
      limit: 20,
    });
    if (
      !contactAssertionsAfterRevocation.ok ||
      contactAssertionsAfterRevocation.result.kind !== "PAGE" ||
      contactAssertionsAfterRevocation.result.records.some(
        (entry) => entry.recordType === "MEMORY_ASSERTION" && entry.subject.kind === "CONTACT",
      )
    )
      throw new Error("association-dependent assertion remained eligible");
    const reconsidered = await directoryRequest(secondWorker, {
      operation: "RECONSIDER_ASSOCIATION",
      ...directoryVersion,
      associationId: rejected.result.associations[0].id,
      associationRevision: rejected.result.associations[0].revision,
    });
    if (
      !reconsidered.ok ||
      reconsidered.result.kind !== "MUTATION" ||
      reconsidered.result.associations[0]?.id === secondCandidate.id
    )
      throw new Error("reconsideration did not preserve history");
    directoryVersion.directoryRevision = reconsidered.result.directoryRevision;
    const reconfirmed = await directoryRequest(secondWorker, {
      operation: "DECIDE_ASSOCIATION",
      ...directoryVersion,
      associationId: reconsidered.result.associations[0].id,
      associationRevision: reconsidered.result.associations[0].revision,
      decision: "CONFIRM",
    });
    if (!reconfirmed.ok || reconfirmed.result.kind !== "MUTATION")
      throw new Error("reconsidered confirmation failed");
    directoryVersion.directoryRevision = reconfirmed.result.directoryRevision;
    const reassigned = await directoryRequest(secondWorker, {
      operation: "REASSIGN_ASSOCIATION",
      ...directoryVersion,
      associationId: reconfirmed.result.associations[0].id,
      associationRevision: reconfirmed.result.associations[0].revision,
      newContactId: firstContact.id,
      newContactRevision: firstContact.revision,
      confirmation: "REASSIGN_ASSOCIATION",
    });
    if (
      !reassigned.ok ||
      reassigned.result.kind !== "MUTATION" ||
      reassigned.result.associations.filter((entry) => entry.status === "CONFIRMED").length !== 1
    )
      throw new Error("atomic reassignment failed");
    directoryVersion.directoryRevision = reassigned.result.directoryRevision;
    const staleAssociation = await directoryRequest(secondWorker, {
      operation: "REVOKE_ASSOCIATION",
      ...directoryVersion,
      associationId: reconfirmed.result.associations[0].id,
      associationRevision: reconfirmed.result.associations[0].revision,
      confirmation: "REVOKE_ASSOCIATION",
    });
    if (staleAssociation.ok || staleAssociation.error.code !== "CONFLICT")
      throw new Error("stale association view remained authoritative");
    const listedContacts = await directoryRequest(secondWorker, {
      operation: "LIST",
      ...directoryVersion,
      recordType: "CONTACT",
      cursor: null,
      limit: 1,
    });
    if (
      !listedContacts.ok ||
      listedContacts.result.kind !== "PAGE" ||
      listedContacts.result.records.length !== 1 ||
      !listedContacts.result.nextCursor
    )
      throw new Error("directory pagination failed");
    const staleCursor = listedContacts.result.nextCursor;
    const renamed = await directoryRequest(secondWorker, {
      operation: "RENAME_CONTACT",
      ...directoryVersion,
      contactId: firstContact.id,
      contactRevision: firstContact.revision,
      label: "Alex One",
    });
    if (!renamed.ok || renamed.result.kind !== "MUTATION") throw new Error("contact rename failed");
    directoryVersion.directoryRevision = renamed.result.directoryRevision;
    const stalePage = await directoryRequest(secondWorker, {
      operation: "LIST",
      ...directoryVersion,
      recordType: "CONTACT",
      cursor: staleCursor,
      limit: 1,
    });
    if (stalePage.ok || stalePage.error.code !== "CONFLICT")
      throw new Error("stale cursor accepted");
    const inspected = await request(secondWorker, {
      operation: "INSPECT",
      requestId: randomUUID(),
      section: "IDENTITY_ASSOCIATION",
      cursor: null,
      limit: 20,
    });
    if (
      !inspected.ok ||
      inspected.snapshot.status !== "READY" ||
      inspected.snapshot.schemaVersion !== 6 ||
      inspected.snapshot.databasePath !== databasePath ||
      inspected.snapshot.context.storeId !== storeId ||
      inspected.snapshot.context.generation !== reopened.snapshot.generation ||
      inspected.snapshot.context.settingsRevision !== reopened.snapshot.revision ||
      inspected.snapshot.context.directoryRevision !== directoryVersion.directoryRevision ||
      inspected.snapshot.context.memoryRevision !== memoryVersion.memoryRevision ||
      inspected.snapshot.explicitPreferences.length !== 1 ||
      inspected.snapshot.explicitPreferences[0].id !== "messageLength" ||
      inspected.snapshot.explicitPreferences[0].value !== "CONCISE" ||
      inspected.snapshot.explicitPreferences[0].settingsRevision !== reopened.snapshot.revision ||
      inspected.snapshot.page.recordType !== "IDENTITY_ASSOCIATION" ||
      inspected.snapshot.page.records.length < 4
    ) {
      throw new Error("development inspection failed");
    }
    const inspectedJson = JSON.stringify(inspected);
    if (inspectedJson.includes(keyHex) || inspectedJson.includes(wrapped.toString("base64"))) {
      throw new Error("development inspection exposed key material");
    }
    const debugSnapshotPath = join(gateDirectory, "memory-debug-snapshot.db");
    const debugPassphrase = randomBytes(32).toString("base64url");
    const debugExport = await request(secondWorker, {
      operation: "EXPORT_DEBUG_SNAPSHOT",
      requestId: randomUUID(),
      snapshotPath: debugSnapshotPath,
      passphrase: debugPassphrase,
    });
    if (
      !debugExport.ok ||
      debugExport.snapshot.schemaVersion !== 6 ||
      debugExport.snapshot.databasePath !== debugSnapshotPath
    ) {
      throw new Error("encrypted debug snapshot export failed");
    }
    const debugDatabase = await openPassphraseDatabase(debugSnapshotPath, debugPassphrase);
    const debugVersion = await debugDatabase.get("PRAGMA user_version;");
    const debugPreference = await debugDatabase.get(
      "SELECT preference_value FROM memory_assertion WHERE subject_kind='LOCAL_USER' AND acceptance='CONFIRMED' AND lifecycle='ACTIVE'",
    );
    const debugIntegrity = await debugDatabase.all("PRAGMA cipher_integrity_check;");
    await debugDatabase.close();
    if (
      Number(debugVersion?.user_version) !== 6 ||
      debugPreference?.preference_value !== "CONCISE" ||
      debugIntegrity.length !== 0
    ) {
      throw new Error("encrypted debug snapshot contents failed verification");
    }
    const debugWrongKey = await openRawDatabase(debugSnapshotPath, keyHex);
    let liveKeyOpenedSnapshot = false;
    try {
      await debugWrongKey.get("SELECT count(*) AS count FROM local_context");
      liveKeyOpenedSnapshot = true;
    } catch {
      // The temporary snapshot must use only its separately generated passphrase.
    } finally {
      await debugWrongKey.close();
    }
    if (liveKeyOpenedSnapshot) throw new Error("debug snapshot reused the live database key");
    secondWorker.kill();
    secondWorker = startWorker();
    const directoryRestart = await request(secondWorker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath,
      storeId,
      keyHex,
    });
    if (
      !directoryRestart.ok ||
      directoryRestart.snapshot.directoryRevision !== directoryVersion.directoryRevision
    ) {
      throw new Error("directory restart persistence failed");
    }
    const persistedAssociations = await directoryRequest(secondWorker, {
      operation: "LIST",
      ...directoryVersion,
      recordType: "IDENTITY_ASSOCIATION",
      cursor: null,
      limit: 20,
    });
    if (
      !persistedAssociations.ok ||
      persistedAssociations.result.kind !== "PAGE" ||
      persistedAssociations.result.records.length < 4
    ) {
      throw new Error("association history did not survive restart");
    }
    secondWorker.kill();
    secondWorker = undefined;
    const capDatabase = await openRawDatabase(databasePath, keyHex);
    await capDatabase.exec("PRAGMA foreign_keys=ON;");
    const capContext = await capDatabase.get(
      "SELECT context_id FROM local_context WHERE singleton=1",
    );
    const capAssociationIds = [];
    for (let index = 0; index < 100; index += 1) {
      const id = randomUUID();
      capAssociationIds.push(id);
      await capDatabase.run(
        `INSERT INTO identity_association(
          id,context_id,identity_id,contact_id,status,authority,revision,created_at,decided_at,revoked_at
        ) VALUES (?,?,?,?,'REJECTED','USER_DECISION',1,?,?,NULL)`,
        id,
        capContext.context_id,
        secondIdentity.id,
        firstContact.id,
        "2026-09-14T11:00:00.000Z",
        "2026-09-14T11:00:00.000Z",
      );
    }
    const capAssertionIds = [];
    for (let index = 0; index < 100; index += 1) {
      const id = randomUUID();
      capAssertionIds.push(id);
      await capDatabase.run(
        `INSERT INTO memory_assertion(
          id,context_id,subject_kind,subject_key,contact_id,predicate,preference_value,
          acceptance,lifecycle,applicability,valid_time_precision,valid_time_value,
          valid_time_end_exclusive,revision,replaces_assertion_id,reconsidered_decision_id,
          created_at,updated_at
        ) VALUES (?,?, 'CONTACT', ?, ?, 'REPLY_LENGTH_PREFERENCE', 'DETAILED',
          'CANDIDATE','ACTIVE','UNKNOWN','UNKNOWN',NULL,NULL,1,NULL,NULL,?,?)`,
        id,
        capContext.context_id,
        firstContact.id,
        firstContact.id,
        "2026-09-14T11:00:00.000Z",
        "2026-09-14T11:00:00.000Z",
      );
    }
    for (let index = 0; index < 100; index += 1) {
      await capDatabase.run(
        `INSERT INTO memory_decision(
          id,context_id,assertion_id,assertion_revision,operation,authority,
          replacement_assertion_id,reconsidered_decision_id,created_at
        ) VALUES (?,?,?,1,'REJECT','SYNTHETIC_FIXTURE',NULL,NULL,?)`,
        randomUUID(),
        capContext.context_id,
        capAssertionIds[0],
        "2026-09-14T12:00:00.000Z",
      );
    }
    await capDatabase.close();
    secondWorker = startWorker();
    const capReopen = await request(secondWorker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath,
      storeId,
      keyHex,
    });
    if (!capReopen.ok) throw new Error("cap fixture reopen failed");
    memoryVersion = {
      generation: capReopen.snapshot.generation,
      memoryRevision: capReopen.snapshot.memoryRevision,
    };
    const cappedVersions = await memoryRequest(secondWorker, {
      operation: "REPLACE",
      ...memoryVersion,
      assertionId: capAssertionIds[0],
      assertionRevision: 1,
      subject: { kind: "CONTACT", contactId: firstContact.id },
      contactRevision: renamed.result.contacts[0].revision,
      value: "CONCISE",
      applicability: "CURRENT",
      validTime: { precision: "UNKNOWN" },
      evidence: {
        source: "SYNTHETIC_FIXTURE",
        sourceReference: "over-version-cap",
        sourceTime: { precision: "UNKNOWN" },
        confidence: { extraction: null, attribution: null, predicate: null },
        association: null,
      },
      authority: "SYNTHETIC_FIXTURE",
    });
    if (cappedVersions.ok || cappedVersions.error.code !== "INVALID_REQUEST")
      throw new Error("memory assertion version cap was not enforced");
    const cappedDecisions = await memoryRequest(secondWorker, {
      operation: "DECIDE",
      ...memoryVersion,
      assertionId: capAssertionIds[0],
      assertionRevision: 1,
      decision: "REJECT",
      authority: "SYNTHETIC_FIXTURE",
    });
    if (cappedDecisions.ok || cappedDecisions.error.code !== "INVALID_REQUEST")
      throw new Error("memory decision cap was not enforced");
    const deletionCandidate = await memoryRequest(secondWorker, {
      operation: "PROPOSE",
      ...memoryVersion,
      subject: { kind: "CONTACT", contactId: secondContact.id },
      contactRevision: secondContact.revision,
      value: "BALANCED",
      applicability: "UNKNOWN",
      validTime: { precision: "UNKNOWN" },
      evidence: {
        source: "SYNTHETIC_FIXTURE",
        sourceReference: "contact-delete-support-1",
        sourceTime: { precision: "UNKNOWN" },
        confidence: { extraction: null, attribution: null, predicate: null },
        association: null,
      },
    });
    if (!deletionCandidate.ok || deletionCandidate.result.kind !== "MUTATION")
      throw new Error("contact deletion memory fixture failed");
    const deletionAssertion = deletionCandidate.result.assertions[0];
    memoryVersion.memoryRevision = deletionCandidate.result.memoryRevision;
    for (let index = 2; index <= 8; index += 1) {
      const support = await memoryRequest(secondWorker, {
        operation: "ADD_EVIDENCE",
        ...memoryVersion,
        assertionId: deletionAssertion.id,
        assertionRevision: deletionAssertion.revision,
        evidenceValue: "BALANCED",
        role: "SUPPORTS",
        evidence: {
          source: "SYNTHETIC_FIXTURE",
          sourceReference: `contact-delete-support-${index}`,
          sourceTime: { precision: "UNKNOWN" },
          confidence: { extraction: null, attribution: null, predicate: null },
          association: null,
        },
      });
      if (!support.ok || support.result.kind !== "MUTATION")
        throw new Error("memory evidence link cap setup failed");
      memoryVersion.memoryRevision = support.result.memoryRevision;
    }
    const overLinked = await memoryRequest(secondWorker, {
      operation: "ADD_EVIDENCE",
      ...memoryVersion,
      assertionId: deletionAssertion.id,
      assertionRevision: deletionAssertion.revision,
      evidenceValue: "BALANCED",
      role: "SUPPORTS",
      evidence: {
        source: "SYNTHETIC_FIXTURE",
        sourceReference: "contact-delete-support-9",
        sourceTime: { precision: "UNKNOWN" },
        confidence: { extraction: null, attribution: null, predicate: null },
        association: null,
      },
    });
    if (overLinked.ok || overLinked.error.code !== "INVALID_REQUEST")
      throw new Error("memory evidence link cap was not enforced");
    const capped = await directoryRequest(secondWorker, {
      operation: "RECONSIDER_ASSOCIATION",
      ...directoryVersion,
      associationId: capAssociationIds[0],
      associationRevision: 1,
    });
    if (capped.ok || capped.error.code !== "INVALID_REQUEST")
      throw new Error("association history cap was not enforced");
    const boundedPage = await directoryRequest(secondWorker, {
      operation: "LIST",
      ...directoryVersion,
      recordType: "IDENTITY_ASSOCIATION",
      cursor: null,
      limit: 20,
    });
    if (
      !boundedPage.ok ||
      boundedPage.result.kind !== "PAGE" ||
      boundedPage.result.records.length > 20 ||
      Buffer.byteLength(JSON.stringify(boundedPage), "utf8") > 16 * 1024
    ) {
      throw new Error("directory response bounds failed");
    }
    const exclusiveIdentityResult = await directoryRequest(secondWorker, {
      operation: "CREATE_IDENTITY",
      ...directoryVersion,
      platform: "Synthetic C",
      namespace: "exclusive",
      identifierKind: "handle",
      identifierValue: "exclusive.synthetic",
      displayLabel: "Exclusive",
      candidateContactId: secondContact.id,
    });
    if (!exclusiveIdentityResult.ok || exclusiveIdentityResult.result.kind !== "MUTATION")
      throw new Error("exclusive identity create failed");
    const exclusiveIdentity = exclusiveIdentityResult.result.identities[0];
    directoryVersion.directoryRevision = exclusiveIdentityResult.result.directoryRevision;
    const deletedContact = await directoryRequest(secondWorker, {
      operation: "DELETE_CONTACT",
      ...directoryVersion,
      contactId: secondContact.id,
      contactRevision: secondContact.revision,
      confirmation: "DELETE_CONTACT",
    });
    if (!deletedContact.ok || deletedContact.result.kind !== "MUTATION")
      throw new Error("contact deletion failed");
    directoryVersion.directoryRevision = deletedContact.result.directoryRevision;
    const afterContactDelete = await request(secondWorker, {
      operation: "READ",
      requestId: randomUUID(),
    });
    if (
      !afterContactDelete.ok ||
      afterContactDelete.snapshot.memoryRevision <= memoryVersion.memoryRevision
    )
      throw new Error("contact deletion did not advance memory invalidation state");
    memoryVersion.memoryRevision = afterContactDelete.snapshot.memoryRevision;
    const assertionsAfterContactDelete = await memoryRequest(secondWorker, {
      operation: "LIST",
      ...memoryVersion,
      recordType: "MEMORY_ASSERTION",
      cursor: null,
      limit: 20,
    });
    if (
      !assertionsAfterContactDelete.ok ||
      assertionsAfterContactDelete.result.kind !== "PAGE" ||
      assertionsAfterContactDelete.result.records.some(
        (entry) =>
          entry.recordType === "MEMORY_ASSERTION" &&
          entry.subject.kind === "CONTACT" &&
          entry.subject.contactId === secondContact.id,
      )
    )
      throw new Error("contact-scoped memory survived contact deletion");
    const identitiesAfterDelete = await directoryRequest(secondWorker, {
      operation: "LIST",
      ...directoryVersion,
      recordType: "PLATFORM_IDENTITY",
      cursor: null,
      limit: 20,
    });
    if (
      !identitiesAfterDelete.ok ||
      identitiesAfterDelete.result.kind !== "PAGE" ||
      identitiesAfterDelete.result.records.some((entry) => entry.id === exclusiveIdentity.id) ||
      !identitiesAfterDelete.result.records.some((entry) => entry.id === firstIdentity.id) ||
      !identitiesAfterDelete.result.records.some((entry) => entry.id === secondIdentity.id)
    ) {
      throw new Error("contact deletion did not preserve only unrelated/shared identities");
    }
    const stale = await request(secondWorker, {
      operation: "SAVE",
      requestId: randomUUID(),
      generation: reopened.snapshot.generation,
      revision: 0,
      value: "DETAILED",
    });
    if (stale.ok || stale.error.code !== "CONFLICT") throw new Error("stale write was accepted");
    const deleted = await request(secondWorker, {
      operation: "DELETE",
      requestId: randomUUID(),
      generation: reopened.snapshot.generation,
      revision: reopened.snapshot.revision,
    });
    if (!deleted.ok || deleted.snapshot.messageLength !== null || deleted.snapshot.revision !== 2) {
      throw new Error("preference delete failed");
    }
    const staleRecreate = await request(secondWorker, {
      operation: "SAVE",
      requestId: randomUUID(),
      generation: reopened.snapshot.generation,
      revision: reopened.snapshot.revision,
      value: "DETAILED",
    });
    if (staleRecreate.ok || staleRecreate.error.code !== "CONFLICT") {
      throw new Error("stale delete/recreate was accepted");
    }
    const recreated = await request(secondWorker, {
      operation: "SAVE",
      requestId: randomUUID(),
      generation: deleted.snapshot.generation,
      revision: deleted.snapshot.revision,
      value: "DETAILED",
    });
    if (!recreated.ok || recreated.snapshot.revision !== 3) {
      throw new Error("preference recreate failed");
    }
    const cleared = await request(secondWorker, {
      operation: "CLEAR",
      requestId: randomUUID(),
      generation: reopened.snapshot.generation,
      confirmation: "CLEAR_LOCAL_MEMORY",
    });
    if (
      !cleared.ok ||
      cleared.snapshot.generation === reopened.snapshot.generation ||
      cleared.snapshot.revision !== 0 ||
      cleared.snapshot.directoryRevision !== 0 ||
      cleared.snapshot.memoryRevision !== 0 ||
      cleared.snapshot.messageLength !== null
    ) {
      throw new Error("clear-all generation reset failed");
    }
    const staleAfterClear = await request(secondWorker, {
      operation: "SAVE",
      requestId: randomUUID(),
      generation: reopened.snapshot.generation,
      revision: reopened.snapshot.revision,
      value: "DETAILED",
    });
    if (staleAfterClear.ok || staleAfterClear.error.code !== "CONFLICT") {
      throw new Error("pre-clear work was accepted after generation reset");
    }
    secondWorker.kill();
    secondWorker = undefined;

    clearedWorker = startWorker();
    const reopenedAfterClear = await request(clearedWorker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath,
      storeId,
      keyHex,
    });
    if (
      !reopenedAfterClear.ok ||
      reopenedAfterClear.snapshot.generation !== cleared.snapshot.generation ||
      reopenedAfterClear.snapshot.messageLength !== null
    ) {
      throw new Error("clear-all did not survive restart");
    }
    clearedWorker.kill();
    clearedWorker = undefined;

    wrongStoreWorker = startWorker();
    const wrongStore = await request(wrongStoreWorker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath,
      storeId: randomUUID(),
      keyHex,
    });
    if (wrongStore.ok) throw new Error("wrong store binding was accepted");
    wrongStoreWorker.kill();
    wrongStoreWorker = undefined;

    wrongKeyWorker = startWorker();
    const wrongKey = await request(wrongKeyWorker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath,
      storeId,
      keyHex: randomBytes(32).toString("hex"),
    });
    if (wrongKey.ok) throw new Error("wrong key was accepted");
    wrongKeyWorker.kill();
    wrongKeyWorker = undefined;

    let noKeyRejected = false;
    const noKeyDatabase = await openRawDatabase(databasePath);
    try {
      await noKeyDatabase.get("SELECT name FROM sqlite_master LIMIT 1");
    } catch {
      noKeyRejected = true;
    } finally {
      await noKeyDatabase.close();
    }
    if (!noKeyRejected) throw new Error("database opened without a key");

    const futurePath = join(gateDirectory, "future.db");
    await copyFile(databasePath, futurePath);
    const futureDatabase = await openRawDatabase(futurePath, keyHex);
    await futureDatabase.exec("PRAGMA user_version=99;");
    await futureDatabase.close();
    const futureBefore = await readFile(futurePath);
    futureSchemaWorker = startWorker();
    const futureSchema = await request(futureSchemaWorker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath: futurePath,
      storeId,
      keyHex,
    });
    if (futureSchema.ok) throw new Error("future schema was accepted");
    futureSchemaWorker.kill();
    futureSchemaWorker = undefined;
    const futureAfter = await readFile(futurePath);
    if (!futureAfter.equals(futureBefore)) throw new Error("future schema was mutated");

    const corruptPath = join(gateDirectory, "corrupt.db");
    const corruptBytes = Buffer.from(await readFile(databasePath));
    corruptBytes[Math.floor(corruptBytes.length / 2)] ^= 0xff;
    await writeFile(corruptPath, corruptBytes);
    corruptWorker = startWorker();
    const corrupt = await request(corruptWorker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath: corruptPath,
      storeId,
      keyHex,
    });
    if (corrupt.ok) throw new Error("corrupt database was accepted");
    corruptWorker.kill();
    corruptWorker = undefined;
    if (!(await readFile(corruptPath)).equals(corruptBytes)) {
      throw new Error("corrupt database was overwritten");
    }

    const legacyPath = join(gateDirectory, "legacy-v1.db");
    const legacyKey = randomBytes(32).toString("hex");
    const legacyStoreId = randomUUID();
    const legacyGeneration = randomUUID();
    const legacyDatabase = await openRawDatabase(legacyPath, legacyKey);
    await legacyDatabase.exec(`
      PRAGMA cipher_memory_security=ON;
      PRAGMA temp_store=MEMORY;
      CREATE TABLE local_context (
        singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
        context_id TEXT NOT NULL,
        generation TEXT NOT NULL,
        settings_revision INTEGER NOT NULL CHECK (settings_revision >= 0)
      );
      CREATE TABLE explicit_preference (
        preference_key TEXT PRIMARY KEY CHECK (preference_key = 'messageLength'),
        preference_value TEXT NOT NULL CHECK (preference_value IN ('CONCISE','BALANCED','DETAILED')),
        source TEXT NOT NULL CHECK (source = 'USER_SETTING'),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    await legacyDatabase.run(
      "INSERT INTO local_context(singleton, context_id, generation, settings_revision) VALUES (1, ?, ?, 1)",
      randomUUID(),
      legacyGeneration,
    );
    await legacyDatabase.run(
      "INSERT INTO explicit_preference VALUES ('messageLength', 'BALANCED', 'USER_SETTING', ?, ?)",
      "2026-09-14T10:00:00.000Z",
      "2026-09-14T10:00:00.000Z",
    );
    await legacyDatabase.exec("PRAGMA user_version=1;");
    await legacyDatabase.close();
    legacyWorker = startWorker();
    const migrated = await request(legacyWorker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath: legacyPath,
      storeId: legacyStoreId,
      keyHex: legacyKey,
    });
    if (
      !migrated.ok ||
      migrated.snapshot.generation !== legacyGeneration ||
      migrated.snapshot.messageLength !== "BALANCED"
    ) {
      throw new Error("v1 migration failed");
    }
    const migratedInspection = await request(legacyWorker, {
      operation: "INSPECT",
      requestId: randomUUID(),
      section: "CONTACT",
      cursor: null,
      limit: 20,
    });
    if (
      !migratedInspection.ok ||
      migratedInspection.snapshot.schemaVersion !== 6 ||
      migratedInspection.snapshot.context.storeId !== legacyStoreId
    ) {
      throw new Error("v1 migration did not bind the store");
    }
    legacyWorker.kill();
    legacyWorker = undefined;
    const versionTwoPath = join(gateDirectory, "legacy-v2.db");
    const versionTwoKey = randomBytes(32).toString("hex");
    const versionTwoStoreId = randomUUID();
    const versionTwoGeneration = randomUUID();
    const versionTwoDatabase = await openRawDatabase(versionTwoPath, versionTwoKey);
    await versionTwoDatabase.exec(`
      PRAGMA cipher_memory_security=ON;
      PRAGMA temp_store=MEMORY;
      CREATE TABLE local_context (
        singleton INTEGER PRIMARY KEY CHECK (singleton = 1),
        store_id TEXT NOT NULL,
        context_id TEXT NOT NULL,
        generation TEXT NOT NULL,
        settings_revision INTEGER NOT NULL CHECK (settings_revision >= 0)
      );
      CREATE TABLE explicit_preference (
        preference_key TEXT PRIMARY KEY CHECK (preference_key = 'messageLength'),
        preference_value TEXT NOT NULL CHECK (preference_value IN ('CONCISE','BALANCED','DETAILED')),
        source TEXT NOT NULL CHECK (source = 'USER_SETTING'),
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
    `);
    await versionTwoDatabase.run(
      "INSERT INTO local_context VALUES (1, ?, ?, ?, 1)",
      versionTwoStoreId,
      randomUUID(),
      versionTwoGeneration,
    );
    await versionTwoDatabase.run(
      "INSERT INTO explicit_preference VALUES ('messageLength', 'DETAILED', 'USER_SETTING', ?, ?)",
      "2026-09-14T10:00:00.000Z",
      "2026-09-14T10:00:00.000Z",
    );
    await versionTwoDatabase.exec("PRAGMA user_version=2;");
    await versionTwoDatabase.close();
    const versionThreePath = join(gateDirectory, "legacy-v3.db");
    await copyFile(versionTwoPath, versionThreePath);
    const versionThreeDatabase = await openRawDatabase(versionThreePath, versionTwoKey);
    await versionThreeDatabase.exec(`
      ALTER TABLE local_context ADD COLUMN directory_revision INTEGER NOT NULL DEFAULT 0 CHECK (directory_revision >= 0);
      CREATE TABLE contact (
        id TEXT PRIMARY KEY, context_id TEXT NOT NULL, label TEXT NOT NULL,
        revision INTEGER NOT NULL CHECK (revision > 0), created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL, UNIQUE(context_id,id)
      );
      CREATE TABLE platform_identity (
        id TEXT PRIMARY KEY, context_id TEXT NOT NULL, platform TEXT, account_namespace TEXT,
        identifier_kind TEXT, identifier_value TEXT, display_label TEXT,
        origin TEXT NOT NULL CHECK (origin='USER_ENTERED'),
        revision INTEGER NOT NULL CHECK (revision > 0), created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL, CHECK(display_label IS NOT NULL OR identifier_value IS NOT NULL),
        UNIQUE(context_id,id)
      );
      CREATE TABLE identity_association (
        id TEXT PRIMARY KEY, context_id TEXT NOT NULL, identity_id TEXT NOT NULL,
        contact_id TEXT NOT NULL,
        status TEXT NOT NULL CHECK(status IN ('CANDIDATE','CONFIRMED','REJECTED','REVOKED')),
        authority TEXT NOT NULL CHECK(authority='USER_DECISION'),
        revision INTEGER NOT NULL CHECK(revision > 0), created_at TEXT NOT NULL,
        decided_at TEXT, revoked_at TEXT,
        CHECK((status='CANDIDATE' AND decided_at IS NULL AND revoked_at IS NULL) OR
          (status IN ('CONFIRMED','REJECTED') AND decided_at IS NOT NULL AND revoked_at IS NULL) OR
          (status='REVOKED' AND decided_at IS NOT NULL AND revoked_at IS NOT NULL)),
        FOREIGN KEY(context_id,identity_id) REFERENCES platform_identity(context_id,id) ON DELETE CASCADE,
        FOREIGN KEY(context_id,contact_id) REFERENCES contact(context_id,id) ON DELETE CASCADE
      );
      CREATE INDEX contact_directory_order ON contact(context_id,id);
      CREATE INDEX identity_directory_order ON platform_identity(context_id,id);
      CREATE INDEX association_directory_order ON identity_association(context_id,id);
      CREATE INDEX association_by_identity ON identity_association(context_id,identity_id,id);
      CREATE INDEX association_by_contact ON identity_association(context_id,contact_id,id);
      CREATE UNIQUE INDEX one_confirmed_contact_per_identity
        ON identity_association(context_id,identity_id) WHERE status='CONFIRMED';
      PRAGMA user_version=3;
    `);
    await versionThreeDatabase.close();
    const versionFourPath = join(gateDirectory, "legacy-v4.db");
    await copyFile(versionThreePath, versionFourPath);
    const versionFourDatabase = await openRawDatabase(versionFourPath, versionTwoKey);
    const v4Source = await readFile(
      resolve(__dirname, "../src/main/local-memory/assertion-store.ts"),
      "utf8",
    );
    const v4FunctionAt = v4Source.indexOf("export async function createAssertionSchema");
    const v4CallAt = v4Source.indexOf("await database.exec(`", v4FunctionAt);
    const v4SqlAt = v4CallAt + "await database.exec(`".length;
    const v4SqlEnd = v4Source.indexOf("`);", v4SqlAt);
    if (v4FunctionAt < 0 || v4CallAt < 0 || v4SqlEnd < 0)
      throw new Error("v4 source schema fixture unavailable");
    const v4SchemaSql = v4Source.slice(v4SqlAt, v4SqlEnd);
    if (v4SchemaSql.includes("${")) throw new Error("v4 source schema fixture is not static");
    await versionFourDatabase.exec(
      "PRAGMA foreign_keys=ON; ALTER TABLE local_context ADD COLUMN memory_revision INTEGER NOT NULL DEFAULT 0 CHECK(memory_revision>=0);",
    );
    await versionFourDatabase.exec(v4SchemaSql);
    const v4Context = await versionFourDatabase.get(
      "SELECT context_id FROM local_context WHERE singleton=1",
    );
    const v4AssertionId = randomUUID();
    const v4EvidenceId = randomUUID();
    const v4DecisionId = randomUUID();
    const v4ContactId = randomUUID();
    const v4At = "2026-09-14T10:00:00.000Z";
    await versionFourDatabase.run(
      "INSERT INTO contact VALUES (?,?,?,?,?,?)",
      v4ContactId,
      v4Context.context_id,
      "Synthetic v4 contact",
      1,
      v4At,
      v4At,
    );
    await versionFourDatabase.run(
      "INSERT INTO memory_assertion VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      v4AssertionId,
      v4Context.context_id,
      "LOCAL_USER",
      "LOCAL_USER",
      null,
      "REPLY_LENGTH_PREFERENCE",
      "DETAILED",
      "CONFIRMED",
      "ACTIVE",
      "CURRENT",
      "INSTANT",
      v4At,
      null,
      1,
      null,
      null,
      v4At,
      v4At,
    );
    await versionFourDatabase.run(
      "INSERT INTO memory_evidence VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)",
      v4EvidenceId,
      v4Context.context_id,
      "LOCAL_USER",
      "LOCAL_USER",
      null,
      "REPLY_LENGTH_PREFERENCE",
      "DETAILED",
      "USER_SETTING",
      randomUUID(),
      "INSTANT",
      v4At,
      null,
      null,
      null,
      null,
      null,
      null,
      v4At,
    );
    await versionFourDatabase.run(
      "INSERT INTO assertion_evidence_link VALUES (?,?,?,?,?)",
      v4Context.context_id,
      v4AssertionId,
      v4EvidenceId,
      "SUPPORTS",
      v4At,
    );
    await versionFourDatabase.run(
      "INSERT INTO memory_decision VALUES (?,?,?,?,?,?,?,?,?)",
      v4DecisionId,
      v4Context.context_id,
      v4AssertionId,
      1,
      "CONFIRM",
      "USER_SETTING",
      null,
      null,
      v4At,
    );
    await versionFourDatabase.exec("DROP TABLE explicit_preference; PRAGMA user_version=4;");
    await versionFourDatabase.close();
    versionTwoWorker = startWorker();
    const versionTwoMigrated = await request(versionTwoWorker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath: versionTwoPath,
      storeId: versionTwoStoreId,
      keyHex: versionTwoKey,
    });
    if (
      !versionTwoMigrated.ok ||
      versionTwoMigrated.snapshot.messageLength !== "DETAILED" ||
      versionTwoMigrated.snapshot.directoryRevision !== 0
    ) {
      throw new Error("v2 migration failed");
    }
    const versionTwoInspection = await request(versionTwoWorker, {
      operation: "INSPECT",
      requestId: randomUUID(),
      section: "CONTACT",
      cursor: null,
      limit: 20,
    });
    if (!versionTwoInspection.ok || versionTwoInspection.snapshot.schemaVersion !== 6) {
      throw new Error("v2 migration did not reach schema v4");
    }
    versionTwoWorker.kill();
    versionTwoWorker = undefined;
    versionThreeWorker = startWorker();
    const versionThreeMigrated = await request(versionThreeWorker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath: versionThreePath,
      storeId: versionTwoStoreId,
      keyHex: versionTwoKey,
    });
    if (
      !versionThreeMigrated.ok ||
      versionThreeMigrated.snapshot.messageLength !== "DETAILED" ||
      versionThreeMigrated.snapshot.memoryRevision !== 0
    ) {
      throw new Error("v3 migration failed");
    }
    const versionThreeInspection = await request(versionThreeWorker, {
      operation: "INSPECT",
      requestId: randomUUID(),
      section: "MEMORY_ASSERTION",
      cursor: null,
      limit: 20,
    });
    if (
      !versionThreeInspection.ok ||
      versionThreeInspection.snapshot.schemaVersion !== 6 ||
      versionThreeInspection.snapshot.page.recordType !== "MEMORY_ASSERTION" ||
      versionThreeInspection.snapshot.page.records.length !== 1
    ) {
      throw new Error("v3 preference did not migrate to one canonical assertion");
    }
    versionThreeWorker.kill();
    versionThreeWorker = undefined;
    versionFourWorker = startWorker();
    const versionFourMigrated = await request(versionFourWorker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath: versionFourPath,
      storeId: versionTwoStoreId,
      keyHex: versionTwoKey,
    });
    if (!versionFourMigrated.ok || versionFourMigrated.snapshot.messageLength !== "DETAILED")
      throw new Error("v4 encrypted preference migration failed");
    const versionFourInspection = await request(versionFourWorker, {
      operation: "INSPECT",
      requestId: randomUUID(),
      section: "MEMORY_ASSERTION",
      cursor: null,
      limit: 20,
    });
    if (
      !versionFourInspection.ok ||
      versionFourInspection.snapshot.schemaVersion !== 6 ||
      versionFourInspection.snapshot.page.records[0]?.id !== v4AssertionId ||
      versionFourInspection.snapshot.page.records[0]?.createdAt !== v4At
    )
      throw new Error("v4 assertion ID/time did not survive v5/v6 migration");
    const versionFourRaw = await openRawDatabase(versionFourPath, versionTwoKey);
    const versionFourRefs = await versionFourRaw.get(
      "SELECT COUNT(*) AS count FROM assertion_evidence_link l JOIN memory_decision d ON d.assertion_id=l.assertion_id WHERE l.assertion_id=? AND l.evidence_id=? AND d.id=?",
      v4AssertionId,
      v4EvidenceId,
      v4DecisionId,
    );
    const versionFourContact = await versionFourRaw.get(
      "SELECT id FROM contact WHERE id=?",
      v4ContactId,
    );
    const versionFourForeignKeys = await versionFourRaw.all("PRAGMA foreign_key_check;");
    await versionFourRaw.close();
    if (
      Number(versionFourRefs?.count) !== 1 ||
      !versionFourContact ||
      versionFourForeignKeys.length !== 0
    )
      throw new Error("v4 directory/evidence/decision references did not survive migration");
    versionFourWorker.kill();
    versionFourWorker = undefined;
    // Exercise the upgrade from a pre-existing v5 encrypted store as well as
    // the earlier-version chain. This synthetic fixture has no relationships.
    const versionFiveRaw = await openRawDatabase(versionFourPath, versionTwoKey);
    await versionFiveRaw.exec("DROP TABLE relationship_temporal_support; PRAGMA user_version=5;");
    await versionFiveRaw.close();
    versionFourWorker = startWorker();
    const versionFiveInspection = await request(versionFourWorker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath: versionFourPath,
      storeId: versionTwoStoreId,
      keyHex: versionTwoKey,
    });
    if (!versionFiveInspection.ok)
      throw new Error("encrypted v5-to-v6 temporal dependency migration failed");
    const versionFiveSchema = await request(versionFourWorker, {
      operation: "INSPECT",
      requestId: randomUUID(),
      section: "MEMORY_ASSERTION",
      cursor: null,
      limit: 1,
    });
    if (!versionFiveSchema.ok || versionFiveSchema.snapshot.schemaVersion !== 6)
      throw new Error("encrypted v5-to-v6 schema version was not committed");
    versionFourWorker.kill();
    versionFourWorker = undefined;
    data03Worker = startWorker();
    const data03Opened = await request(data03Worker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath,
      storeId,
      keyHex,
    });
    if (!data03Opened.ok || data03Opened.snapshot.generation !== cleared.snapshot.generation)
      throw new Error("DATA-03 encrypted store did not open");
    const data03DirectoryVersion = {
      generation: data03Opened.snapshot.generation,
      directoryRevision: data03Opened.snapshot.directoryRevision,
    };
    const data03ContactResult = await directoryRequest(data03Worker, {
      operation: "CREATE_CONTACT",
      ...data03DirectoryVersion,
      label: "Synthetic DATA-03 contact",
    });
    if (!data03ContactResult.ok || data03ContactResult.result.kind !== "MUTATION")
      throw new Error("DATA-03 contact create failed");
    const data03Contact = data03ContactResult.result.contacts[0];
    data03DirectoryVersion.directoryRevision = data03ContactResult.result.directoryRevision;
    const data03MemoryVersion = {
      generation: data03Opened.snapshot.generation,
      memoryRevision: data03Opened.snapshot.memoryRevision,
    };
    const unknownValidity = {
      start: { precision: "UNKNOWN" },
      end: { certainty: "UNKNOWN", bound: { precision: "UNKNOWN" } },
    };
    const managerClaim = await memoryRequest(data03Worker, {
      operation: "PROPOSE_RELATIONSHIP",
      ...data03MemoryVersion,
      contactId: data03Contact.id,
      contactRevision: data03Contact.revision,
      context: {
        selection: "NEW",
        context: { kind: "ORGANIZATION", organizationLabel: "Company A", projectLabel: null },
      },
      episodeId: null,
      value: { predicate: "RELATIONSHIP_ROLE", role: "MANAGER", direction: "CONTACT" },
      validity: unknownValidity,
      applicability: "CURRENT",
      evidence: syntheticRelationshipEvidence(),
    });
    if (
      !managerClaim.ok ||
      managerClaim.result.kind !== "MUTATION" ||
      managerClaim.result.assertions[0]?.acceptance !== "CANDIDATE"
    )
      throw new Error("DATA-03 manager proposal failed");
    const managerAssertion = managerClaim.result.assertions[0];
    const relationContextId = managerAssertion.relationship?.contextId;
    data03MemoryVersion.memoryRevision = managerClaim.result.memoryRevision;
    const friendClaim = await memoryRequest(data03Worker, {
      operation: "PROPOSE_RELATIONSHIP",
      ...data03MemoryVersion,
      contactId: data03Contact.id,
      contactRevision: data03Contact.revision,
      context: { selection: "EXISTING", contextId: relationContextId },
      episodeId: null,
      value: { predicate: "RELATIONSHIP_ROLE", role: "FRIEND", direction: "SYMMETRIC" },
      validity: unknownValidity,
      applicability: "CURRENT",
      evidence: syntheticRelationshipEvidence(),
    });
    if (
      !friendClaim.ok ||
      friendClaim.result.kind !== "MUTATION" ||
      friendClaim.result.assertions[0]?.acceptance !== "CANDIDATE"
    )
      throw new Error("DATA-03 compatible friend proposal failed");
    data03MemoryVersion.memoryRevision = friendClaim.result.memoryRevision;
    const reverseManager = await memoryRequest(data03Worker, {
      operation: "PROPOSE_RELATIONSHIP",
      ...data03MemoryVersion,
      contactId: data03Contact.id,
      contactRevision: data03Contact.revision,
      context: { selection: "EXISTING", contextId: relationContextId },
      episodeId: null,
      value: { predicate: "RELATIONSHIP_ROLE", role: "MANAGER", direction: "LOCAL_USER" },
      validity: unknownValidity,
      applicability: "CURRENT",
      evidence: syntheticRelationshipEvidence(),
    });
    if (
      !reverseManager.ok ||
      reverseManager.result.kind !== "MUTATION" ||
      reverseManager.result.assertions[0]?.id === managerAssertion.id
    )
      throw new Error("DATA-03 manager direction collapsed");
    data03MemoryVersion.memoryRevision = reverseManager.result.memoryRevision;
    const managerConfirmed = await memoryRequest(data03Worker, {
      operation: "DECIDE_RELATIONSHIP",
      ...data03MemoryVersion,
      assertionId: managerAssertion.id,
      assertionRevision: managerAssertion.revision,
      decision: "CONFIRM",
      reach: "CURRENT",
      authority: "SYNTHETIC_FIXTURE",
    });
    if (
      !managerConfirmed.ok ||
      managerConfirmed.result.kind !== "MUTATION" ||
      managerConfirmed.result.assertions[0]?.acceptance !== "CONFIRMED"
    )
      throw new Error("DATA-03 explicit manager confirmation failed");
    data03MemoryVersion.memoryRevision = managerConfirmed.result.memoryRevision;
    const managerHistorical = await memoryRequest(data03Worker, {
      operation: "TRANSITION_RELATIONSHIP",
      ...data03MemoryVersion,
      assertionId: managerAssertion.id,
      assertionRevision: managerConfirmed.result.assertions[0].revision,
      end: { certainty: "WITHIN", bound: { precision: "YEAR", value: "2023" } },
      evidence: syntheticRelationshipEvidence(),
      authority: "SYNTHETIC_FIXTURE",
    });
    if (
      !managerHistorical.ok ||
      managerHistorical.result.kind !== "MUTATION" ||
      managerHistorical.result.assertions[0]?.acceptance !== "CONFIRMED" ||
      managerHistorical.result.assertions[0]?.applicability !== "HISTORICAL" ||
      managerHistorical.result.assertions[0]?.relationship?.validity.end.bound.value !== "2023"
    )
      throw new Error("DATA-03 sourced historical transition failed");
    data03MemoryVersion.memoryRevision = managerHistorical.result.memoryRevision;
    const falseManager = reverseManager.result.assertions[0];
    const falseManagerRejected = await memoryRequest(data03Worker, {
      operation: "DECIDE_RELATIONSHIP",
      ...data03MemoryVersion,
      assertionId: falseManager.id,
      assertionRevision: falseManager.revision,
      decision: "REJECT",
      reach: "ALL_HISTORY",
      authority: "SYNTHETIC_FIXTURE",
    });
    if (
      !falseManagerRejected.ok ||
      falseManagerRejected.result.kind !== "MUTATION" ||
      falseManagerRejected.result.assertions[0]?.acceptance !== "REJECTED" ||
      falseManagerRejected.result.assertions[0]?.applicability !== "UNKNOWN"
    )
      throw new Error("DATA-03 factual rejection became history");
    data03MemoryVersion.memoryRevision = falseManagerRejected.result.memoryRevision;
    const bypassAttempt = await memoryRequest(data03Worker, {
      operation: "PROPOSE_RELATIONSHIP",
      ...data03MemoryVersion,
      contactId: data03Contact.id,
      contactRevision: data03Contact.revision,
      context: { selection: "EXISTING", contextId: relationContextId },
      episodeId: null,
      value: { predicate: "RELATIONSHIP_ROLE", role: "MANAGER", direction: "LOCAL_USER" },
      validity: unknownValidity,
      applicability: "CURRENT",
      evidence: syntheticRelationshipEvidence(),
    });
    if (bypassAttempt.ok || bypassAttempt.error.code !== "CONFLICT")
      throw new Error("DATA-03 scoped rejection was bypassed");
    const data03Inspection = await request(data03Worker, {
      operation: "INSPECT",
      requestId: randomUUID(),
      section: "MEMORY_ASSERTION",
      cursor: null,
      limit: 20,
    });
    if (
      !data03Inspection.ok ||
      data03Inspection.snapshot.page.records.filter(
        (record) =>
          record.recordType === "MEMORY_ASSERTION" && record.predicate === "RELATIONSHIP_ROLE",
      ).length !== 3
    )
      throw new Error("DATA-03 development inspection omitted relationships");
    if (JSON.stringify(data03Inspection).includes(keyHex))
      throw new Error("DATA-03 inspector exposed key material");
    const data03SnapshotPath = join(gateDirectory, "data03-debug-snapshot.db");
    const data03Passphrase = randomBytes(32).toString("base64url");
    const data03Snapshot = await request(data03Worker, {
      operation: "EXPORT_DEBUG_SNAPSHOT",
      requestId: randomUUID(),
      snapshotPath: data03SnapshotPath,
      passphrase: data03Passphrase,
    });
    if (!data03Snapshot.ok || data03Snapshot.snapshot.schemaVersion !== 6)
      throw new Error("DATA-03 encrypted snapshot failed");
    const data03SnapshotDatabase = await openPassphraseDatabase(
      data03SnapshotPath,
      data03Passphrase,
    );
    const data03SnapshotRoles = await data03SnapshotDatabase.get(
      "SELECT COUNT(*) AS count FROM relationship_assertion_scope WHERE contact_id=?",
      data03Contact.id,
    );
    await data03SnapshotDatabase.close();
    if (Number(data03SnapshotRoles?.count) !== 3)
      throw new Error("DATA-03 snapshot did not retain relationship history");
    data03Worker.kill();
    const populatedV5Path = join(gateDirectory, "populated-legacy-v5.db");
    await copyFile(databasePath, populatedV5Path);
    const populatedV5Raw = await openRawDatabase(populatedV5Path, keyHex);
    await populatedV5Raw.run(
      "UPDATE memory_evidence SET recorded_at=? WHERE id=?",
      "2024-01-01T00:00:00.000Z",
      managerClaim.result.evidence[0].id,
    );
    await populatedV5Raw.run(
      "UPDATE assertion_evidence_link SET role='SUPPORTS' WHERE assertion_id=? AND evidence_id=?",
      managerAssertion.id,
      managerHistorical.result.evidence[0].id,
    );
    await populatedV5Raw.exec("DROP TABLE relationship_temporal_support; PRAGMA user_version=5;");
    await populatedV5Raw.close();
    legacyWorker = startWorker();
    const populatedV5Opened = await request(legacyWorker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath: populatedV5Path,
      storeId,
      keyHex,
    });
    if (!populatedV5Opened.ok) throw new Error("populated encrypted v5 migration failed");
    const populatedV5Inspection = await request(legacyWorker, {
      operation: "INSPECT",
      requestId: randomUUID(),
      section: "MEMORY_ASSERTION",
      cursor: null,
      limit: 20,
    });
    if (!populatedV5Inspection.ok || populatedV5Inspection.snapshot.schemaVersion !== 6)
      throw new Error("populated encrypted v5 schema was not upgraded");
    const populatedV5Link = await openRawDatabase(populatedV5Path, keyHex);
    const transitionedLegacyLink = await populatedV5Link.get(
      "SELECT role FROM assertion_evidence_link WHERE assertion_id=? AND evidence_id=?",
      managerAssertion.id,
      managerHistorical.result.evidence[0].id,
    );
    await populatedV5Link.close();
    if (transitionedLegacyLink?.role !== "CONTEXTUALIZES")
      throw new Error("attributed legacy transition remained positive role support");
    const legacyRoleSupportDeleted = await memoryRequest(legacyWorker, {
      operation: "DELETE_EVIDENCE",
      ...data03MemoryVersion,
      evidenceId: managerClaim.result.evidence[0].id,
    });
    if (!legacyRoleSupportDeleted.ok) throw new Error("legacy role support deletion failed");
    const legacyAfterDeletion = await request(legacyWorker, {
      operation: "INSPECT",
      requestId: randomUUID(),
      section: "MEMORY_ASSERTION",
      cursor: null,
      limit: 20,
    });
    if (
      !legacyAfterDeletion.ok ||
      legacyAfterDeletion.snapshot.page.records.some(
        (record) => record.recordType === "MEMORY_ASSERTION" && record.id === managerAssertion.id,
      )
    )
      throw new Error("legacy transition alone retained unsupported accepted role");
    legacyWorker.kill();
    legacyWorker = undefined;
    data03Worker = startWorker();
    const data03Restart = await request(data03Worker, {
      operation: "OPEN",
      requestId: randomUUID(),
      databasePath,
      storeId,
      keyHex,
    });
    if (
      !data03Restart.ok ||
      data03Restart.snapshot.memoryRevision !== data03MemoryVersion.memoryRevision
    )
      throw new Error("DATA-03 relationship revision did not survive restart");
    const data03RestartInspection = await request(data03Worker, {
      operation: "INSPECT",
      requestId: randomUUID(),
      section: "MEMORY_ASSERTION",
      cursor: null,
      limit: 20,
    });
    if (
      !data03RestartInspection.ok ||
      data03RestartInspection.snapshot.page.records.filter(
        (record) =>
          record.recordType === "MEMORY_ASSERTION" && record.predicate === "RELATIONSHIP_ROLE",
      ).length !== 3
    )
      throw new Error("DATA-03 relationship history did not survive restart");
    const temporalDeleted = await memoryRequest(data03Worker, {
      operation: "DELETE_EVIDENCE",
      ...data03MemoryVersion,
      evidenceId: managerHistorical.result.evidence[0].id,
    });
    if (!temporalDeleted.ok || temporalDeleted.result.kind !== "MUTATION")
      throw new Error("DATA-03 transition evidence deletion failed");
    data03MemoryVersion.memoryRevision = temporalDeleted.result.memoryRevision;
    const temporalInspection = await request(data03Worker, {
      operation: "INSPECT",
      requestId: randomUUID(),
      section: "MEMORY_ASSERTION",
      cursor: null,
      limit: 20,
    });
    const managerAfterTemporalDeletion =
      temporalInspection.ok &&
      temporalInspection.snapshot.page.records.find(
        (record) => record.recordType === "MEMORY_ASSERTION" && record.id === managerAssertion.id,
      );
    if (
      !managerAfterTemporalDeletion ||
      managerAfterTemporalDeletion.acceptance !== "CONFIRMED" ||
      managerAfterTemporalDeletion.applicability !== "UNKNOWN" ||
      managerAfterTemporalDeletion.relationship?.validity.end.certainty !== "UNKNOWN"
    )
      throw new Error("DATA-03 deleted transition source left unsupported temporal truth");
    const coworkerClaim = await memoryRequest(data03Worker, {
      operation: "PROPOSE_RELATIONSHIP",
      ...data03MemoryVersion,
      contactId: data03Contact.id,
      contactRevision: data03Contact.revision,
      context: { selection: "EXISTING", contextId: relationContextId },
      episodeId: null,
      value: { predicate: "RELATIONSHIP_ROLE", role: "COWORKER", direction: "SYMMETRIC" },
      validity: unknownValidity,
      applicability: "CURRENT",
      evidence: syntheticRelationshipEvidence(),
    });
    if (!coworkerClaim.ok || coworkerClaim.result.kind !== "MUTATION")
      throw new Error("DATA-03 correction lifecycle fixture failed");
    data03MemoryVersion.memoryRevision = coworkerClaim.result.memoryRevision;
    const coworkerAssertion = coworkerClaim.result.assertions[0];
    const coworkerConfirmed = await memoryRequest(data03Worker, {
      operation: "DECIDE_RELATIONSHIP",
      ...data03MemoryVersion,
      assertionId: coworkerAssertion.id,
      assertionRevision: coworkerAssertion.revision,
      decision: "CONFIRM",
      reach: "CURRENT",
      authority: "SYNTHETIC_FIXTURE",
    });
    if (!coworkerConfirmed.ok || coworkerConfirmed.result.kind !== "MUTATION")
      throw new Error("DATA-03 correction fixture confirmation failed");
    data03MemoryVersion.memoryRevision = coworkerConfirmed.result.memoryRevision;
    const coworkerCorrection = await memoryRequest(data03Worker, {
      operation: "DECIDE_RELATIONSHIP",
      ...data03MemoryVersion,
      assertionId: coworkerAssertion.id,
      assertionRevision: coworkerConfirmed.result.assertions[0].revision,
      decision: "REJECT",
      reach: "CURRENT",
      authority: "SYNTHETIC_FIXTURE",
    });
    if (!coworkerCorrection.ok || coworkerCorrection.result.kind !== "MUTATION")
      throw new Error("DATA-03 current correction fixture failed");
    data03MemoryVersion.memoryRevision = coworkerCorrection.result.memoryRevision;
    const coworkerSupportDeleted = await memoryRequest(data03Worker, {
      operation: "DELETE_EVIDENCE",
      ...data03MemoryVersion,
      evidenceId: coworkerClaim.result.evidence[0].id,
    });
    if (!coworkerSupportDeleted.ok || coworkerSupportDeleted.result.kind !== "MUTATION")
      throw new Error("DATA-03 corrected support deletion failed");
    data03MemoryVersion.memoryRevision = coworkerSupportDeleted.result.memoryRevision;
    const coworkerBypass = await memoryRequest(data03Worker, {
      operation: "PROPOSE_RELATIONSHIP",
      ...data03MemoryVersion,
      contactId: data03Contact.id,
      contactRevision: data03Contact.revision,
      context: { selection: "EXISTING", contextId: relationContextId },
      episodeId: null,
      value: { predicate: "RELATIONSHIP_ROLE", role: "COWORKER", direction: "SYMMETRIC" },
      validity: unknownValidity,
      applicability: "CURRENT",
      evidence: syntheticRelationshipEvidence(),
    });
    if (coworkerBypass.ok || coworkerBypass.error.code !== "CONFLICT")
      throw new Error("DATA-03 support deletion erased scoped correction");
    const asOfClaim = await memoryRequest(data03Worker, {
      operation: "PROPOSE_RELATIONSHIP",
      ...data03MemoryVersion,
      contactId: data03Contact.id,
      contactRevision: data03Contact.revision,
      context: { selection: "EXISTING", contextId: relationContextId },
      episodeId: null,
      value: { predicate: "RELATIONSHIP_ROLE", role: "CLIENT", direction: "CONTACT" },
      validity: {
        start: { precision: "INSTANT", value: "2024-01-01T00:00:00Z" },
        end: { certainty: "EXACT", bound: { precision: "INSTANT", value: "2027-01-01T00:00:00Z" } },
      },
      applicability: "CURRENT",
      evidence: syntheticRelationshipEvidence(),
    });
    if (!asOfClaim.ok || asOfClaim.result.kind !== "MUTATION")
      throw new Error("DATA-03 as-of correction fixture failed");
    data03MemoryVersion.memoryRevision = asOfClaim.result.memoryRevision;
    const asOfAssertion = asOfClaim.result.assertions[0];
    const asOfConfirmed = await memoryRequest(data03Worker, {
      operation: "DECIDE_RELATIONSHIP",
      ...data03MemoryVersion,
      assertionId: asOfAssertion.id,
      assertionRevision: asOfAssertion.revision,
      decision: "CONFIRM",
      reach: "CURRENT",
      authority: "SYNTHETIC_FIXTURE",
    });
    if (!asOfConfirmed.ok || asOfConfirmed.result.kind !== "MUTATION")
      throw new Error("DATA-03 as-of correction confirmation failed");
    data03MemoryVersion.memoryRevision = asOfConfirmed.result.memoryRevision;
    const asOfRejected = await memoryRequest(data03Worker, {
      operation: "DECIDE_RELATIONSHIP",
      ...data03MemoryVersion,
      assertionId: asOfAssertion.id,
      assertionRevision: asOfConfirmed.result.assertions[0].revision,
      decision: "REJECT",
      reach: "CURRENT",
      authority: "SYNTHETIC_FIXTURE",
    });
    if (!asOfRejected.ok || asOfRejected.result.kind !== "MUTATION")
      throw new Error("DATA-03 as-of current rejection failed");
    data03MemoryVersion.memoryRevision = asOfRejected.result.memoryRevision;
    const asOfRead = async (asOf) =>
      await memoryRequest(data03Worker, {
        operation: "LIST",
        ...data03MemoryVersion,
        recordType: "MEMORY_ASSERTION",
        cursor: null,
        limit: 20,
        filter: {
          contactId: data03Contact.id,
          predicate: "RELATIONSHIP_ROLE",
          relationshipContextId: relationContextId,
          asOf,
        },
      });
    const earlierAsOfRead = await asOfRead("2025-01-01T00:00:00Z");
    const currentAsOfRead = await asOfRead(asOfRejected.result.decisions[0].createdAt);
    const earlierAsOfRole =
      earlierAsOfRead.ok &&
      earlierAsOfRead.result.records.find(
        (record) => record.recordType === "MEMORY_ASSERTION" && record.id === asOfAssertion.id,
      );
    const currentAsOfRole =
      currentAsOfRead.ok &&
      currentAsOfRead.result.records.find(
        (record) => record.recordType === "MEMORY_ASSERTION" && record.id === asOfAssertion.id,
      );
    if (
      !earlierAsOfRole ||
      !currentAsOfRole ||
      earlierAsOfRole.effectiveApplicability !== "CURRENT" ||
      currentAsOfRole.effectiveApplicability === "CURRENT"
    )
      throw new Error("DATA-03 as-of read overrode scoped current rejection");
    const data03Deleted = await directoryRequest(data03Worker, {
      operation: "DELETE_CONTACT",
      ...data03DirectoryVersion,
      contactId: data03Contact.id,
      contactRevision: data03Contact.revision,
      confirmation: "DELETE_CONTACT",
    });
    if (!data03Deleted.ok) throw new Error("DATA-03 contact deletion failed");
    data03Worker.kill();
    data03Worker = undefined;
    const data03Raw = await openRawDatabase(databasePath, keyHex);
    const data03Remaining = await data03Raw.get(
      "SELECT COUNT(*) AS count FROM relationship_context WHERE contact_id=?",
      data03Contact.id,
    );
    const data03ForeignKeys = await data03Raw.all("PRAGMA foreign_key_check;");
    await data03Raw.close();
    if (Number(data03Remaining?.count) !== 0 || data03ForeignKeys.length !== 0)
      throw new Error("DATA-03 deletion left relationship context or broken references");
    const databaseBytes = await readFile(databasePath);
    if (
      databaseBytes.subarray(0, 16).toString("utf8") === "SQLite format 3\u0000" ||
      databaseBytes.includes(Buffer.from("CONCISE"))
    ) {
      throw new Error("plaintext database content detected");
    }

    process.stdout.write(
      `${JSON.stringify({
        ok: true,
        electron: process.versions.electron,
        node: process.versions.node,
        napi: process.versions.napi,
        platform: process.platform,
        arch: process.arch,
        restartPersistence: true,
        developmentInspection: true,
        inspectionExcludesKeyMaterial: true,
        productionInspectorAbsent: true,
        productionSettingsUi: true,
        unavailableResetUi: true,
        relocatedNativeLayout: true,
        staleWriteRejected: true,
        deleteRecreateConflictRejected: true,
        clearChangedGeneration: true,
        clearSurvivedRestart: true,
        preClearWorkRejected: true,
        wrongKeyRejected: true,
        wrongStoreBindingRejected: true,
        noKeyRejected: true,
        corruptStorePreserved: true,
        futureSchemaPreserved: true,
        legacyV1Migrated: true,
        legacyV2Migrated: true,
        legacyV3Migrated: true,
        legacyV4Migrated: true,
        legacyV5Migrated: true,
        populatedLegacyV5Migrated: true,
        contactDirectory: true,
        associationTransitions: true,
        assertionLifecycle: true,
        evidenceDoesNotConfirm: true,
        rejectionWins: true,
        associationEvidenceInvalidation: true,
        contactMemoryDeletion: true,
        memoryEvidenceLinkCap: true,
        memoryAssertionVersionCap: true,
        memoryDecisionCap: true,
        associationHistoryCap: true,
        directoryResponseBound: true,
        directoryRestartPersistence: true,
        encryptedDebugSnapshot: true,
        encryptedAtRest: true,
        safeStorageAsync: true,
        relationshipHistory: true,
        relationshipSnapshot: true,
        relationshipDeletion: true,
        relationshipTemporalDependency: true,
        relationshipCorrectionDependency: true,
        legacyTransitionContextualized: true,
        correctionAwareAsOfRead: true,
      })}\n`,
    );
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    gateExitCode = 1;
  } finally {
    firstWorker?.kill();
    secondWorker?.kill();
    clearedWorker?.kill();
    wrongKeyWorker?.kill();
    wrongStoreWorker?.kill();
    futureSchemaWorker?.kill();
    corruptWorker?.kill();
    legacyWorker?.kill();
    versionTwoWorker?.kill();
    versionThreeWorker?.kill();
    versionFourWorker?.kill();
    data03Worker?.kill();
    relocatedWorker?.kill();
    productionBridgeWindow?.destroy();
    if (gateDirectory?.startsWith(join(tmpdir(), "ai-message-coach-native-gate-"))) {
      await rm(gateDirectory, { recursive: true, force: true }).catch(() => undefined);
    }
    if (nativeGateProfile.startsWith(join(tmpdir(), "ai-message-coach-native-profile-"))) {
      await rm(nativeGateProfile, { recursive: true, force: true }).catch(() => undefined);
    }
    app.exit(gateExitCode);
  }
});
