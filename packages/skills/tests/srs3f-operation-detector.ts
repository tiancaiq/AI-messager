import {
  CoachingRequestSchema,
  type AgentAction,
  type CoachingRequest,
} from "@ai-message-coach/contracts";
import {
  OperationCatalogSchema,
  type OperationCatalog,
  type OperationId,
} from "../authoring/operation-profiles.js";
import { contentDigest } from "../authoring/generator.js";
import {
  sourceAwareQuery,
  type QueryFragment,
  type SemanticEncoder,
  type SemanticSource,
} from "./srs3e-semantic-retrieval.js";

export type OperationPositiveField = "job" | "positiveEvidence";
export interface OperationPositiveDocument {
  operationId: OperationId;
  field: OperationPositiveField;
  ordinal: number;
  text: string;
  profileDigest: string;
}
export interface OperationPositiveVector extends Omit<OperationPositiveDocument, "text"> {
  vector: readonly number[];
}
export type OperationSourcePolicy = "PRIMARY_ONLY" | "PRIMARY_WITH_CONTEXT";
export interface OperationDetectorConfig {
  id: string;
  threshold: number;
  sourcePolicy: OperationSourcePolicy;
  modelDigest: string;
  profileArtifactSha256: string;
}
export interface OperationSignal {
  id: OperationId;
  relevanceScore: number;
  rank: number;
  sourceContributions: Array<{
    source: SemanticSource;
    ordinal: number;
    role: QueryFragment["role"];
    score: number;
    field: OperationPositiveField;
    positiveOrdinal: number;
  }>;
  winningSource: SemanticSource;
  profileDigest: string;
}
export interface OperationObservation {
  fixedAction: AgentAction;
  status: "SCORED" | "STRUCTURAL_EMPTY" | "EMPTY_QUERY" | "MODEL_UNSUPPORTED_LANGUAGE";
  signals: OperationSignal[];
  allScores: Array<{
    id: OperationId;
    score: number;
    rank: number;
    winningSource: SemanticSource;
    profileDigest: string;
    sourceContributions: OperationSignal["sourceContributions"];
  }>;
  configDigest: string;
  diagnostics: string[];
}

const nonWording = new Set<AgentAction>([
  "SUGGEST_ACTIONS",
  "ASK_CLARIFICATION",
  "NO_REPLY_NEEDED",
]);
const han = /\p{Script=Han}/u;

export function operationPositiveDocuments(catalogInput: unknown): OperationPositiveDocument[] {
  const catalog: OperationCatalog = OperationCatalogSchema.parse(catalogInput);
  return catalog.profiles.flatMap((profile) => [
    {
      operationId: profile.id,
      field: "job" as const,
      ordinal: 0,
      text: profile.job,
      profileDigest: contentDigest(profile),
    },
    ...profile.positiveEvidence.map((text, ordinal) => ({
      operationId: profile.id,
      field: "positiveEvidence" as const,
      ordinal,
      text,
      profileDigest: contentDigest(profile),
    })),
  ]);
}

export async function embedOperationDocuments(
  documents: readonly OperationPositiveDocument[],
  encoder: SemanticEncoder,
): Promise<OperationPositiveVector[]> {
  const vectors: OperationPositiveVector[] = [];
  for (const { text, ...metadata } of documents) {
    if (encoder.tokenCount(text) > 256)
      throw Error(`Operation positive document exceeds encoder limit: ${metadata.operationId}`);
    const vector = await encoder.encode(text);
    if (vector.length !== 384 || vector.some((value) => !Number.isFinite(value)))
      throw Error(`Invalid operation positive vector: ${metadata.operationId}`);
    vectors.push({ ...metadata, vector });
  }
  return vectors;
}

function cosine(left: readonly number[], right: readonly number[]): number {
  if (left.length !== right.length || !left.length) throw Error("Operation vector dimension drift");
  let sum = 0;
  for (let index = 0; index < left.length; index++) sum += left[index]! * right[index]!;
  return sum;
}

export async function detectCommunicationOperations(input: {
  request: CoachingRequest;
  action: AgentAction;
  catalog: OperationCatalog;
  vectors: readonly OperationPositiveVector[];
  encoder: SemanticEncoder;
  config: OperationDetectorConfig;
}): Promise<OperationObservation> {
  const { action, encoder, config } = input;
  if (
    !config.id ||
    !Number.isFinite(config.threshold) ||
    config.threshold < -1 ||
    config.threshold > 1 ||
    !["PRIMARY_ONLY", "PRIMARY_WITH_CONTEXT"].includes(config.sourcePolicy)
  )
    throw Error("Invalid operation detector config");
  const catalog = OperationCatalogSchema.parse(input.catalog);
  const request = CoachingRequestSchema.parse(input.request);
  const configDigest = contentDigest(config);
  const empty = (
    status: OperationObservation["status"],
    diagnostics: string[] = [],
  ): OperationObservation => ({
    fixedAction: action,
    status,
    signals: [],
    allScores: [],
    configDigest,
    diagnostics,
  });
  if (nonWording.has(action)) return empty("STRUCTURAL_EMPTY");
  const fragments = sourceAwareQuery(request, action);
  if (!fragments.length) return empty("EMPTY_QUERY", ["EMPTY_QUERY"]);
  if (
    request.analysis.language.primary?.split("-", 1)[0] !== "en" ||
    request.analysis.language.codeSwitching ||
    fragments.some(({ text }) => han.test(text))
  )
    return empty("MODEL_UNSUPPORTED_LANGUAGE", ["MODEL_UNSUPPORTED_LANGUAGE"]);
  if (
    ["REWRITE_DRAFT", "COMPLETE_DRAFT"].includes(action) &&
    !fragments.some((item) => item.source === "USER_DRAFT")
  )
    return empty("EMPTY_QUERY", ["MISSING_USER_DRAFT"]);
  const vectorsById = new Map<OperationId, OperationPositiveVector[]>();
  for (const vector of input.vectors) {
    const list = vectorsById.get(vector.operationId) ?? [];
    list.push(vector);
    vectorsById.set(vector.operationId, list);
  }
  for (const profile of catalog.profiles) {
    const vectors = vectorsById.get(profile.id) ?? [];
    if (vectors.length !== profile.positiveEvidence.length + 1)
      throw Error(`Incomplete operation vectors: ${profile.id}`);
    if (vectors.some((item) => item.profileDigest !== contentDigest(profile)))
      throw Error(`Stale operation profile vectors: ${profile.id}`);
  }
  const embedded = new Map<QueryFragment, readonly number[]>();
  const diagnostics: string[] = [];
  for (const fragment of fragments) {
    if (encoder.tokenCount(fragment.text) > 256) diagnostics.push("QUERY_TRUNCATED");
    embedded.set(fragment, await encoder.encode(fragment.text));
  }
  const allScores = catalog.profiles.map((profile) => {
    const vectors = vectorsById.get(profile.id)!;
    const sourceContributions = fragments.map((fragment) => {
      const matches = vectors
        .map((vector) => ({
          score: cosine(embedded.get(fragment)!, vector.vector),
          field: vector.field,
          positiveOrdinal: vector.ordinal,
        }))
        .sort(
          (a, b) =>
            b.score - a.score ||
            a.field.localeCompare(b.field) ||
            a.positiveOrdinal - b.positiveOrdinal,
        );
      return {
        source: fragment.source,
        ordinal: fragment.ordinal,
        role: fragment.role,
        ...matches[0]!,
      };
    });
    const primary = sourceContributions
      .filter((item) => item.role === "PRIMARY")
      .sort((a, b) => b.score - a.score)[0];
    if (!primary) throw Error("Operation detector has no primary evidence");
    const context = sourceContributions
      .filter((item) => item.role === "CONTEXT")
      .sort((a, b) => b.score - a.score)[0];
    const boost =
      config.sourcePolicy === "PRIMARY_WITH_CONTEXT" && primary.score >= 0.2 && context
        ? Math.min(0.05, 0.1 * Math.max(0, context.score))
        : 0;
    return {
      id: profile.id,
      score: primary.score + boost,
      rank: 0,
      winningSource: primary.source,
      profileDigest: contentDigest(profile),
      sourceContributions,
    };
  });
  allScores.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  allScores.forEach((item, index) => {
    item.rank = index + 1;
  });
  const signals = allScores
    .filter((item) => item.score >= config.threshold)
    .map((item) => ({
      id: item.id,
      relevanceScore: item.score,
      rank: item.rank,
      sourceContributions: item.sourceContributions,
      winningSource: item.winningSource,
      profileDigest: item.profileDigest,
    }));
  return {
    fixedAction: action,
    status: "SCORED",
    signals,
    allScores,
    configDigest,
    diagnostics: [...new Set(diagnostics)],
  };
}
