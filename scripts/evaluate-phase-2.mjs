import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { resolve } from "node:path";

import { analyzeConversationImage, OpenAiVisionAdapter } from "../packages/ai/dist/index.js";
import {
  conversationUnderstandingFixtures,
  renderConversationFixtureSvg,
} from "../packages/test-fixtures/dist/index.js";

const repositoryRoot = resolve(import.meta.dirname, "..");
const localEnvironmentPath = resolve(repositoryRoot, ".env.local");

if (existsSync(localEnvironmentPath)) {
  process.loadEnvFile(localEnvironmentPath);
}

function requestedLimit() {
  const limitArgumentIndex = process.argv.indexOf("--limit");
  const rawLimit = limitArgumentIndex === -1 ? undefined : process.argv[limitArgumentIndex + 1];
  const parsedLimit = rawLimit === undefined ? 6 : Number.parseInt(rawLimit, 10);

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
    throw new Error("--limit must be a positive integer.");
  }

  return parsedLimit;
}

function normalizeText(value) {
  return value.normalize("NFKC").replaceAll(/\s+/g, " ").trim();
}

function compareAnalysis(actual, expected) {
  const expectedMessages = expected.messages;
  const actualMessages = actual.messages;

  return {
    schema: true,
    messageCount: actualMessages.length === expectedMessages.length,
    messageOrder: actualMessages.every((message, index) => message.order === index + 1),
    messageText:
      actualMessages.length === expectedMessages.length &&
      actualMessages.every(
        (message, index) =>
          normalizeText(message.text) === normalizeText(expectedMessages[index]?.text ?? ""),
      ),
    speaker:
      actualMessages.length === expectedMessages.length &&
      actualMessages.every(
        (message, index) => message.speaker === expectedMessages[index]?.speaker,
      ),
    draft: normalizeText(actual.draft.text ?? "") === normalizeText(expected.draft.text ?? ""),
    contact:
      normalizeText(actual.visibleContact.displayName ?? "") ===
        normalizeText(expected.visibleContact.displayName ?? "") &&
      normalizeText(actual.visibleContact.username ?? "") ===
        normalizeText(expected.visibleContact.username ?? "") &&
      normalizeText(actual.visibleContact.channelOrGroupName ?? "") ===
        normalizeText(expected.visibleContact.channelOrGroupName ?? ""),
    language:
      actual.language.primary === expected.language.primary &&
      actual.language.script === expected.language.script &&
      actual.language.codeSwitching === expected.language.codeSwitching,
  };
}

function renderFixturePng(fixture, temporaryDirectory) {
  if (process.platform !== "darwin") {
    throw new Error("The current synthetic SVG rasterizer supports macOS only.");
  }

  const svg = renderConversationFixtureSvg(fixture);
  const svgPath = resolve(temporaryDirectory, `${fixture.id}.svg`);
  const pngPath = `${svgPath}.png`;
  writeFileSync(svgPath, svg, { encoding: "utf8", mode: 0o600 });
  const conversion = spawnSync(
    "/usr/bin/qlmanage",
    ["-t", "-s", "800", "-o", temporaryDirectory, svgPath],
    { stdio: "ignore" },
  );

  if (conversion.status !== 0 || !existsSync(pngPath)) {
    throw new Error(`Synthetic fixture ${fixture.id} could not be rasterized.`);
  }

  const png = new Uint8Array(readFileSync(pngPath));

  if (png.byteLength === 0) {
    throw new Error(`Synthetic fixture ${fixture.id} produced an empty PNG.`);
  }

  return { bytes: png, width: 800, height: 800 };
}

const temporaryDirectory = mkdtempSync(resolve(tmpdir(), "message-coach-phase2-eval-"));

try {
  if (
    process.env.OPENAI_API_KEY?.trim() === undefined ||
    process.env.OPENAI_API_KEY.trim() === ""
  ) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const adapter = new OpenAiVisionAdapter({
    ...(process.env.OPENAI_API_KEY === undefined ? {} : { apiKey: process.env.OPENAI_API_KEY }),
    ...(process.env.OPENAI_VISION_MODEL === undefined
      ? {}
      : { modelId: process.env.OPENAI_VISION_MODEL }),
    onDiagnostic: (diagnostic) => {
      const fields = [
        diagnostic.kind,
        diagnostic.status,
        diagnostic.providerCode,
        diagnostic.providerType,
      ].filter((value) => value !== undefined);
      process.stderr.write(`Provider diagnostic: ${fields.join(" · ")}\n`);
    },
  });
  const fixtures = conversationUnderstandingFixtures.slice(0, requestedLimit());
  const metricTotals = new Map();
  let successfulScenarios = 0;

  process.stdout.write(
    `Phase 2 live evaluation: ${fixtures.length} synthetic scenarios using ${adapter.configuration.modelId}.\n`,
  );

  for (const fixture of fixtures) {
    const png = renderFixturePng(fixture, temporaryDirectory);
    const result = await analyzeConversationImage(adapter, {
      mimeType: "image/png",
      bytes: png.bytes,
      width: png.width,
      height: png.height,
    });
    png.bytes.fill(0);

    if (!result.ok) {
      process.stdout.write(`${fixture.id}: error ${result.error.code}\n`);
      continue;
    }

    successfulScenarios += 1;
    const metrics = compareAnalysis(result.analysis, fixture.expected);

    for (const [metric, passed] of Object.entries(metrics)) {
      metricTotals.set(metric, (metricTotals.get(metric) ?? 0) + (passed ? 1 : 0));
    }

    const passedCount = Object.values(metrics).filter(Boolean).length;
    process.stdout.write(`${fixture.id}: ${passedCount}/${Object.keys(metrics).length} checks\n`);
  }

  process.stdout.write(`Valid results: ${successfulScenarios}/${fixtures.length}\n`);
  for (const [metric, passed] of metricTotals) {
    process.stdout.write(`${metric}: ${passed}/${fixtures.length}\n`);
  }

  if (successfulScenarios !== fixtures.length) {
    process.exitCode = 1;
  }
} catch (error) {
  const message = error instanceof Error ? error.message : "Unknown evaluation failure.";
  process.stderr.write(`Phase 2 evaluation stopped safely: ${message}\n`);
  process.exitCode = 1;
} finally {
  rmSync(temporaryDirectory, { recursive: true });
}
