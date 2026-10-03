import {
  CoachingRequestSchema,
  type AgentAction,
  type CoachingRequest,
} from "@ai-message-coach/contracts";
import type { Srs2CatalogEntry } from "./srs2-shadow-retrieval.js";

export type SemanticSource = "USER_DRAFT" | "SELECTED_GOAL" | "OTHER_MESSAGE" | "USER_HISTORY";
export type PositiveField = "job" | "useWhen" | "semanticTriggers";
export interface PositiveDocument {
  skillId: string;
  field: PositiveField;
  ordinal: number;
  text: string;
  profileDigest: string;
  sourceDefinitionDigest: string;
}
export interface FrozenPositiveVector extends Omit<PositiveDocument, "text"> {
  vector: readonly number[];
}
export interface SemanticEncoder {
  encode(text: string): Promise<readonly number[]>;
  tokenCount(text: string): number;
}
export interface QueryFragment {
  source: SemanticSource;
  ordinal: number;
  role: "PRIMARY" | "CONTEXT";
  text: string;
}
export interface SemanticConfig {
  alpha: 0 | 0.2 | 0.35;
  threshold: number;
  topK: number;
  configId: string;
}
export interface SemanticCandidateTrace {
  skillId: string;
  version: number;
  sourceDefinitionDigest: string;
  profileDigest: string | null;
  hardEligible: boolean;
  eligibilityReasons: string[];
  sourceSimilarities: Array<{
    source: SemanticSource;
    ordinal: number;
    role: QueryFragment["role"];
    score: number;
    field: PositiveField;
    profileOrdinal: number;
  }>;
  score: number | null;
  winningSource: SemanticSource | null;
  winningField: PositiveField | null;
  winningProfileOrdinal: number | null;
  preThresholdRank: number | null;
  admitted: boolean;
  positivePoolRank: number | null;
  topKRank: number | null;
  disappearedAt:
    | "HARD_ELIGIBILITY"
    | "EMPTY_QUERY"
    | "MODEL_UNSUPPORTED_LANGUAGE"
    | "SEMANTIC_THRESHOLD_MISS"
    | "TOP_K_CUTOFF"
    | null;
}
export interface SemanticObservation {
  action: AgentAction;
  configId: string;
  topK: Array<{ skillId: string; score: number; rank: number }>;
  capabilityTraces: SemanticCandidateTrace[];
  eligibleModifierIds: string[];
  modifierEligibilityTraces: Array<{ skillId: string; eligible: boolean; reasons: string[] }>;
  counts: { hardEligible: number; positivePool: number; topK: number };
  diagnostics: string[];
}

const normalize = (text: string) => text.normalize("NFC").replace(/\s+/gu, " ").trim();
const nonWording = new Set<AgentAction>([
  "SUGGEST_ACTIONS",
  "ASK_CLARIFICATION",
  "NO_REPLY_NEEDED",
]);
const han = /\p{Script=Han}/u;

export function sourceAwareQuery(
  requestInput: CoachingRequest,
  action: AgentAction,
): QueryFragment[] {
  const request = CoachingRequestSchema.parse(requestInput);
  if (nonWording.has(action)) return [];
  const draft = normalize(request.analysis.draft.text ?? "");
  const goal = request.selection?.kind === "ACTION" ? normalize(request.selection.intent) : "";
  const ordered = [...request.analysis.messages].sort((a, b) => a.order - b.order);
  const others = ordered
    .filter((message) => message.speaker === "OTHER" && normalize(message.text))
    .slice(-2);
  const history = ordered
    .filter((message) => message.speaker === "USER" && normalize(message.text))
    .slice(-2);
  const fragments: QueryFragment[] = [];
  if (draft && (action === "REWRITE_DRAFT" || action === "COMPLETE_DRAFT"))
    fragments.push({ source: "USER_DRAFT", ordinal: 0, role: "PRIMARY", text: draft });
  if (goal) fragments.push({ source: "SELECTED_GOAL", ordinal: 0, role: "PRIMARY", text: goal });
  const fallback = action === "SUGGEST_REPLY" && !goal ? others.at(-1) : undefined;
  others.forEach((message, ordinal) =>
    fragments.push({
      source: "OTHER_MESSAGE",
      ordinal,
      role: message === fallback ? "PRIMARY" : "CONTEXT",
      text: normalize(message.text),
    }),
  );
  history.forEach((message, ordinal) =>
    fragments.push({
      source: "USER_HISTORY",
      ordinal,
      role: "CONTEXT",
      text: normalize(message.text),
    }),
  );
  return fragments;
}

function structuralReasons(
  entry: Srs2CatalogEntry,
  action: AgentAction,
  request: CoachingRequest,
): string[] {
  const reasons: string[] = [];
  if (entry.catalog !== "PRODUCTION") reasons.push("CATALOG_ISOLATED");
  if (entry.definition.status !== "ACTIVE") reasons.push("STATUS_INACTIVE");
  if (nonWording.has(action) || !entry.definition.actions.includes(action))
    reasons.push("ACTION_INELIGIBLE");
  const primary = request.analysis.language.primary?.split("-", 1)[0];
  const secondary = request.analysis.language.secondary?.split("-", 1)[0];
  const languageSet = new Set(["universal", primary]);
  if (request.analysis.language.codeSwitching && secondary) languageSet.add(secondary);
  if (!entry.definition.languages.some((language) => languageSet.has(language)))
    reasons.push("LANGUAGE_INELIGIBLE");
  if (entry.definition.id === "zh.code_switching" && !request.analysis.language.codeSwitching)
    reasons.push("MISSING_STRUCTURED_PREREQUISITE");
  return reasons;
}

function dot(left: readonly number[], right: readonly number[]): number {
  if (left.length !== right.length || left.length === 0)
    throw Error("Semantic vector dimension mismatch");
  let sum = 0;
  for (let index = 0; index < left.length; index++) sum += left[index]! * right[index]!;
  return sum;
}

export async function retrieveSemanticCandidates(input: {
  request: CoachingRequest;
  action: AgentAction;
  catalog: readonly Srs2CatalogEntry[];
  vectors: readonly FrozenPositiveVector[];
  encoder: SemanticEncoder;
  config: SemanticConfig;
}): Promise<SemanticObservation> {
  const { action, encoder, config } = input;
  if (
    ![0, 0.2, 0.35].includes(config.alpha) ||
    !Number.isFinite(config.threshold) ||
    config.threshold < 0.3 ||
    config.threshold > 0.75 ||
    Math.abs((config.threshold - 0.3) / 0.025 - Math.round((config.threshold - 0.3) / 0.025)) >
      1e-8 ||
    !Number.isInteger(config.topK) ||
    config.topK < 1
  )
    throw Error("SRS-3E semantic configuration outside predeclared grid");
  const request = CoachingRequestSchema.parse(input.request);
  const catalog = [...input.catalog].sort((a, b) => a.definition.id.localeCompare(b.definition.id));
  const fragments = sourceAwareQuery(request, action);
  const languageUnsupported =
    request.analysis.language.primary?.split("-", 1)[0] !== "en" ||
    request.analysis.language.codeSwitching ||
    fragments.some(({ text }) => han.test(text));
  const diagnostics: string[] = [];
  if (languageUnsupported && !nonWording.has(action))
    diagnostics.push("MODEL_UNSUPPORTED_LANGUAGE");
  if (!fragments.length && !nonWording.has(action)) diagnostics.push("EMPTY_QUERY");
  const modifierEligibilityTraces: SemanticObservation["modifierEligibilityTraces"] = [];
  const capabilityTraces: SemanticCandidateTrace[] = [];
  const bySkill = new Map<string, FrozenPositiveVector[]>();
  for (const vector of input.vectors) {
    const list = bySkill.get(vector.skillId) ?? [];
    list.push(vector);
    bySkill.set(vector.skillId, list);
  }
  const embedded = new Map<QueryFragment, readonly number[]>();
  if (!languageUnsupported && fragments.length) {
    for (const fragment of fragments) {
      if (encoder.tokenCount(fragment.text) > 256) diagnostics.push("QUERY_TRUNCATED");
      embedded.set(fragment, await encoder.encode(fragment.text));
    }
  }
  for (const entry of catalog) {
    const reasons = structuralReasons(entry, action, request);
    if (entry.definitionType === "LANGUAGE_MODIFIER") {
      modifierEligibilityTraces.push({
        skillId: entry.definition.id,
        eligible: reasons.length === 0,
        reasons,
      });
      continue;
    }
    if (entry.definitionType !== "ATOMIC") continue;
    const vectors = bySkill.get(entry.definition.id) ?? [];
    if (reasons.length === 0 && vectors.length === 0)
      throw Error(`Missing approved positive vectors: ${entry.definition.id}`);
    if (vectors.some((vector) => vector.sourceDefinitionDigest !== entry.sourceDigest))
      throw Error(`Stale definition vector binding: ${entry.definition.id}`);
    const base: SemanticCandidateTrace = {
      skillId: entry.definition.id,
      version: entry.definition.version,
      sourceDefinitionDigest: entry.sourceDigest,
      profileDigest: vectors[0]?.profileDigest ?? null,
      hardEligible: reasons.length === 0,
      eligibilityReasons: reasons,
      sourceSimilarities: [],
      score: null,
      winningSource: null,
      winningField: null,
      winningProfileOrdinal: null,
      preThresholdRank: null,
      admitted: false,
      positivePoolRank: null,
      topKRank: null,
      disappearedAt: reasons.length
        ? "HARD_ELIGIBILITY"
        : languageUnsupported
          ? "MODEL_UNSUPPORTED_LANGUAGE"
          : fragments.length
            ? null
            : "EMPTY_QUERY",
    };
    if (reasons.length || languageUnsupported || !fragments.length) {
      capabilityTraces.push(base);
      continue;
    }
    const matches = fragments.map((fragment) => {
      const candidates = vectors.map((vector) => ({
        score: dot(embedded.get(fragment)!, vector.vector),
        vector,
      }));
      candidates.sort(
        (a, b) =>
          b.score - a.score ||
          a.vector.field.localeCompare(b.vector.field) ||
          a.vector.ordinal - b.vector.ordinal,
      );
      const best = candidates[0]!;
      return {
        source: fragment.source,
        ordinal: fragment.ordinal,
        role: fragment.role,
        score: best.score,
        field: best.vector.field,
        profileOrdinal: best.vector.ordinal,
      };
    });
    const primary = matches
      .filter((match) => match.role === "PRIMARY")
      .sort((a, b) => b.score - a.score)[0];
    const context = matches
      .filter((match) => match.role === "CONTEXT")
      .sort((a, b) => b.score - a.score)[0];
    if (!primary) {
      capabilityTraces.push({ ...base, disappearedAt: "EMPTY_QUERY" });
      continue;
    }
    const score = context
      ? (1 - config.alpha) * primary.score + config.alpha * context.score
      : primary.score;
    capabilityTraces.push({
      ...base,
      sourceSimilarities: matches,
      score,
      winningSource: primary.source,
      winningField: primary.field,
      winningProfileOrdinal: primary.profileOrdinal,
    });
  }
  const ranked = capabilityTraces
    .filter((trace) => trace.score !== null)
    .sort((a, b) => b.score! - a.score! || a.skillId.localeCompare(b.skillId));
  ranked.forEach((trace, index) => {
    trace.preThresholdRank = index + 1;
  });
  const admitted = ranked.filter((trace) => trace.score! >= config.threshold);
  admitted.forEach((trace, index) => {
    trace.admitted = true;
    trace.positivePoolRank = index + 1;
    if (index < config.topK) trace.topKRank = index + 1;
    else trace.disappearedAt = "TOP_K_CUTOFF";
  });
  ranked
    .filter((trace) => !trace.admitted)
    .forEach((trace) => {
      trace.disappearedAt = "SEMANTIC_THRESHOLD_MISS";
    });
  const topK = admitted
    .slice(0, config.topK)
    .map((trace, index) => ({ skillId: trace.skillId, score: trace.score!, rank: index + 1 }));
  return {
    action,
    configId: config.configId,
    topK,
    capabilityTraces,
    eligibleModifierIds: modifierEligibilityTraces
      .filter((trace) => trace.eligible)
      .map((trace) => trace.skillId),
    modifierEligibilityTraces,
    counts: {
      hardEligible: capabilityTraces.filter((trace) => trace.hardEligible).length,
      positivePool: admitted.length,
      topK: topK.length,
    },
    diagnostics: [...new Set(diagnostics)],
  };
}
