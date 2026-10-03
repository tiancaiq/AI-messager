import {
  CoachingRequestSchema,
  type AgentAction,
  type CoachingRequest,
} from "@ai-message-coach/contracts";
import { z } from "zod";
import type { Srs2CatalogEntry } from "./srs2-shadow-retrieval.js";
import {
  sourceAwareQuery,
  type FrozenPositiveVector,
  type PositiveField,
  type QueryFragment,
  type SemanticEncoder,
  type SemanticSource,
} from "./srs3e-semantic-retrieval.js";

const SourceSchema = z.enum(["USER_DRAFT", "SELECTED_GOAL", "OTHER_MESSAGE", "USER_HISTORY"]);
const FieldSchema = z.enum(["job", "useWhen", "semanticTriggers"]);
const SourceScoreSchema = z.object({
  source: SourceSchema,
  ordinal: z.number().int().nonnegative(),
  role: z.enum(["PRIMARY", "CONTEXT"]),
  score: z.number().finite(),
  field: FieldSchema,
  profileOrdinal: z.number().int().nonnegative(),
});
const CandidateSchema = z.object({
  skillId: z.string(),
  lane: z.literal("ATOMIC"),
  version: z.number().int(),
  sourceDefinitionDigest: z.string(),
  profileDigest: z.string(),
  vectorArtifactDigest: z.string().regex(/^[a-f0-9]{64}$/u),
  semanticScore: z.number().finite(),
  semanticRank: z.number().int().positive(),
  winningSource: SourceSchema,
  winningField: FieldSchema,
  winningProfileOrdinal: z.number().int().nonnegative(),
  sourceScores: z.array(SourceScoreSchema),
  eligibilityReasons: z.array(z.string()).length(0),
});
const TraceSchema = z.object({
  skillId: z.string(),
  hardEligible: z.boolean(),
  reasons: z.array(z.string()),
});
export const TopKObservationSchema = z.object({
  action: z.string(),
  status: z.enum(["RANKED", "STRUCTURAL_EMPTY", "EMPTY_QUERY", "MODEL_UNSUPPORTED_LANGUAGE"]),
  fullEligibleRanking: z.array(CandidateSchema),
  top3: z.array(CandidateSchema).max(3),
  top5: z.array(CandidateSchema).max(5),
  top10: z.array(CandidateSchema).max(10),
  capabilityEligibility: z.array(TraceSchema),
  modifierEligibility: z.array(TraceSchema),
  hardEligibleCount: z.number().int().nonnegative(),
  diagnostics: z.array(z.string()),
});
export type TopKObservation = z.infer<typeof TopKObservationSchema>;

const nonWording = new Set<AgentAction>([
  "SUGGEST_ACTIONS",
  "ASK_CLARIFICATION",
  "NO_REPLY_NEEDED",
]);
const han = /\p{Script=Han}/u;

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
  const languages = new Set(["universal", primary]);
  if (request.analysis.language.codeSwitching && secondary) languages.add(secondary);
  if (!entry.definition.languages.some((language) => languages.has(language)))
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

interface Match {
  source: SemanticSource;
  ordinal: number;
  role: QueryFragment["role"];
  score: number;
  field: PositiveField;
  profileOrdinal: number;
}

// Shadow-only candidate production. No score threshold, admission, or operation mapping.
export async function retrieveAdmissionFreeTopK(input: {
  request: CoachingRequest;
  action: AgentAction;
  catalog: readonly Srs2CatalogEntry[];
  vectors: readonly FrozenPositiveVector[];
  vectorArtifactDigest: string;
  encoder: SemanticEncoder;
}): Promise<TopKObservation> {
  const request = CoachingRequestSchema.parse(input.request);
  const catalog = [...input.catalog].sort((a, b) => a.definition.id.localeCompare(b.definition.id));
  const fragments = sourceAwareQuery(request, input.action);
  const unsupported =
    request.analysis.language.primary?.split("-", 1)[0] !== "en" ||
    request.analysis.language.codeSwitching ||
    fragments.some(({ text }) => han.test(text));
  const status = nonWording.has(input.action)
    ? "STRUCTURAL_EMPTY"
    : unsupported
      ? "MODEL_UNSUPPORTED_LANGUAGE"
      : !fragments.some((fragment) => fragment.role === "PRIMARY")
        ? "EMPTY_QUERY"
        : "RANKED";
  const capabilityEligibility: z.infer<typeof TraceSchema>[] = [];
  const modifierEligibility: z.infer<typeof TraceSchema>[] = [];
  const eligible: Srs2CatalogEntry[] = [];
  for (const entry of catalog) {
    const reasons = structuralReasons(entry, input.action, request);
    const trace = { skillId: entry.definition.id, hardEligible: reasons.length === 0, reasons };
    if (entry.definitionType === "LANGUAGE_MODIFIER") modifierEligibility.push(trace);
    else if (entry.definitionType === "ATOMIC") {
      capabilityEligibility.push(trace);
      if (trace.hardEligible) eligible.push(entry);
    }
  }
  const diagnostics: string[] = [];
  if (status === "MODEL_UNSUPPORTED_LANGUAGE") diagnostics.push(status);
  if (status === "EMPTY_QUERY") diagnostics.push(status);
  const bySkill = new Map<string, FrozenPositiveVector[]>();
  for (const vector of input.vectors) {
    const group = bySkill.get(vector.skillId) ?? [];
    group.push(vector);
    bySkill.set(vector.skillId, group);
  }
  const embedded = new Map<QueryFragment, readonly number[]>();
  if (status === "RANKED") {
    for (const fragment of fragments) {
      if (input.encoder.tokenCount(fragment.text) > 256) diagnostics.push("QUERY_TRUNCATED");
      embedded.set(fragment, await input.encoder.encode(fragment.text));
    }
  }
  const scored: Array<Omit<z.infer<typeof CandidateSchema>, "semanticRank">> = [];
  for (const entry of eligible) {
    const vectors = bySkill.get(entry.definition.id) ?? [];
    if (vectors.length === 0)
      throw Error(`Missing approved positive vectors: ${entry.definition.id}`);
    if (vectors.some((vector) => vector.sourceDefinitionDigest !== entry.sourceDigest))
      throw Error(`Stale definition vector binding: ${entry.definition.id}`);
    if (new Set(vectors.map((vector) => vector.profileDigest)).size !== 1)
      throw Error(`Inconsistent profile digest: ${entry.definition.id}`);
    if (status !== "RANKED") continue;
    const matches: Match[] = fragments.map((fragment) => {
      const ranked = vectors.map((vector) => ({
        score: dot(embedded.get(fragment)!, vector.vector),
        vector,
      }));
      ranked.sort(
        (a, b) =>
          b.score - a.score ||
          a.vector.field.localeCompare(b.vector.field) ||
          a.vector.ordinal - b.vector.ordinal,
      );
      const best = ranked[0]!;
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
      .sort((a, b) => b.score - a.score)[0]!;
    scored.push({
      skillId: entry.definition.id,
      lane: "ATOMIC",
      version: entry.definition.version,
      sourceDefinitionDigest: entry.sourceDigest,
      profileDigest: vectors[0]!.profileDigest,
      vectorArtifactDigest: input.vectorArtifactDigest,
      semanticScore: primary.score,
      winningSource: primary.source,
      winningField: primary.field,
      winningProfileOrdinal: primary.profileOrdinal,
      sourceScores: matches,
      eligibilityReasons: [],
    });
  }
  scored.sort((a, b) => b.semanticScore - a.semanticScore || a.skillId.localeCompare(b.skillId));
  const fullEligibleRanking = scored.map((candidate, index) => ({
    ...candidate,
    semanticRank: index + 1,
  }));
  return TopKObservationSchema.parse({
    action: input.action,
    status,
    fullEligibleRanking,
    top3: fullEligibleRanking.slice(0, 3),
    top5: fullEligibleRanking.slice(0, 5),
    top10: fullEligibleRanking.slice(0, 10),
    capabilityEligibility,
    modifierEligibility,
    hardEligibleCount: eligible.length,
    diagnostics: [...new Set(diagnostics)],
  });
}
