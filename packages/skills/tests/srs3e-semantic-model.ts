import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { env, pipeline } from "@huggingface/transformers";
import { contentDigest, packageRoot } from "../authoring/generator.js";
import { renderSemanticArtifact } from "../authoring/semantic-profiles.js";
import type {
  SemanticEncoder,
  PositiveDocument,
  FrozenPositiveVector,
} from "./srs3e-semantic-retrieval.js";

export const SEMANTIC_MODEL = {
  packageVersion: "3.8.1",
  repository: "Xenova/all-MiniLM-L6-v2",
  revision: "751bff37182d3f1213fa05d7196b954e230abad9",
  dtype: "int8",
  device: "cpu",
  dimensions: 384,
  pooling: "mean",
  normalize: true,
  tokenLimit: 256,
  modelFiles: {
    "config.json": "7135149f7cffa1a573466c6e4d8423ed73b62fd2332c575bf738a0d033f70df7",
    "tokenizer_config.json": "9261e7d79b44c8195c1cada2b453e55b00aeb81e907a6664974b4d7776172ab3",
    "tokenizer.json": "da0e79933b9ed51798a3ae27893d3c5fa4a201126cef75586296df9b4d2c62a0",
    "onnx/model_int8.onnx": "afdb6f1a0e45b715d0bb9b11772f032c399babd23bfc31fed1c170afc848bdb1",
  },
} as const;
export const FROZEN_SEMANTIC_PROFILE_SHA256 =
  "b061bf17a04e696ad78af45016e6803a96f79f0e617fcb2800a4a591fbc33d1c";
const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const cacheRoot = resolve(packageRoot, "../../node_modules/.cache/srs3e-model");
const cacheModelRoot = resolve(cacheRoot, SEMANTIC_MODEL.repository, SEMANTIC_MODEL.revision);

export async function verifySemanticModelFiles(): Promise<void> {
  for (const [path, expected] of Object.entries(SEMANTIC_MODEL.modelFiles)) {
    const actual = sha256(await readFile(resolve(cacheModelRoot, path)));
    if (actual !== expected) throw Error(`Pinned semantic model file drift: ${path}`);
  }
}

export async function loadLocalSemanticEncoder(): Promise<SemanticEncoder> {
  await verifySemanticModelFiles();
  env.allowRemoteModels = false;
  env.cacheDir = cacheRoot;
  const extractor = await pipeline("feature-extraction", SEMANTIC_MODEL.repository, {
    revision: SEMANTIC_MODEL.revision,
    dtype: SEMANTIC_MODEL.dtype,
    device: SEMANTIC_MODEL.device,
    local_files_only: true,
  });
  return {
    tokenCount(text) {
      return extractor.tokenizer.tokenize(text).length + 2;
    },
    async encode(text) {
      const output = await extractor(text, { pooling: "mean", normalize: true });
      if (output.dims.length !== 2 || output.dims[0] !== 1 || output.dims[1] !== 384)
        throw Error("Pinned semantic model produced unexpected dimensions");
      const numbers = Array.from(output.data, Number);
      if (numbers.some((value) => !Number.isFinite(value)))
        throw Error("Nonfinite semantic vector");
      return numbers.map((value) => Math.round(value * 1e7) / 1e7);
    },
  };
}

export async function loadPositiveDocuments(): Promise<PositiveDocument[]> {
  const { artifact, json, sha256: actual } = await renderSemanticArtifact();
  if (actual !== FROZEN_SEMANTIC_PROFILE_SHA256) throw Error("Frozen semantic profiles drift");
  const stored = await readFile(
    resolve(packageRoot, "tests/fixtures/srs3/semantic-skill-profiles.json"),
  );
  if (sha256(stored) !== actual || stored.toString("utf8") !== json)
    throw Error("Stored semantic profile artifact drift");
  return artifact.profiles
    .filter((profile) => profile.lane === "ATOMIC")
    .flatMap((profile) => [
      {
        skillId: profile.id,
        field: "job" as const,
        ordinal: 0,
        text: profile.job,
        profileDigest: profile.profileDigest,
        sourceDefinitionDigest: profile.sourceDefinitionDigest,
      },
      ...profile.useWhen.map((text, ordinal) => ({
        skillId: profile.id,
        field: "useWhen" as const,
        ordinal,
        text,
        profileDigest: profile.profileDigest,
        sourceDefinitionDigest: profile.sourceDefinitionDigest,
      })),
      ...profile.semanticTriggers.map((text, ordinal) => ({
        skillId: profile.id,
        field: "semanticTriggers" as const,
        ordinal,
        text,
        profileDigest: profile.profileDigest,
        sourceDefinitionDigest: profile.sourceDefinitionDigest,
      })),
    ]);
}

export async function embedPositiveDocuments(
  encoder: SemanticEncoder,
): Promise<FrozenPositiveVector[]> {
  const documents = await loadPositiveDocuments();
  const vectors: FrozenPositiveVector[] = [];
  for (const { text, ...metadata } of documents) {
    if (encoder.tokenCount(text) > SEMANTIC_MODEL.tokenLimit)
      throw Error(`Positive profile document exceeds token limit: ${metadata.skillId}`);
    const vector = await encoder.encode(text);
    if (vector.length !== SEMANTIC_MODEL.dimensions) throw Error("Positive vector dimension drift");
    vectors.push({ ...metadata, vector });
  }
  return vectors;
}

export async function loadProductionSemanticCatalog() {
  const { records } = await import("../authoring/generator.js").then(({ loadAuthoringRegistry }) =>
    loadAuthoringRegistry(),
  );
  return records.map((record) => ({
    definition: record.definition,
    definitionType: record.kind,
    catalog: "PRODUCTION" as const,
    sourceDigest: contentDigest(record.definition),
  }));
}
