import type { AgentAction } from "@ai-message-coach/contracts";
import type { SemanticCandidateTrace } from "./srs3e-semantic-retrieval.js";

export type RewriteSourcePolicy =
  "DRAFT_ONLY" | "DRAFT_CONTEXT_BOOST" | "PRIMARY_FLOOR" | "SOURCE_MAX_DOMINANCE";

export const rewriteSourcePolicies: readonly RewriteSourcePolicy[] = [
  "DRAFT_ONLY",
  "DRAFT_CONTEXT_BOOST",
  "PRIMARY_FLOOR",
  "SOURCE_MAX_DOMINANCE",
];

export interface SourceScore {
  skillId: string;
  draft: number | null;
  goal: number | null;
  context: number | null;
  combined: number | null;
  rank: number | null;
  poolRank: number | null;
  admittedRank: number | null;
}

const maximum = (values: readonly number[]): number | null =>
  values.length ? Math.max(...values) : null;

export function sourceScore(
  trace: SemanticCandidateTrace,
  action: AgentAction,
  policy: RewriteSourcePolicy,
): SourceScore {
  const draft = maximum(
    trace.sourceSimilarities
      .filter((item) => item.source === "USER_DRAFT")
      .map((item) => item.score),
  );
  const goal = maximum(
    trace.sourceSimilarities
      .filter((item) => item.source === "SELECTED_GOAL")
      .map((item) => item.score),
  );
  const context = maximum(
    trace.sourceSimilarities.filter((item) => item.role === "CONTEXT").map((item) => item.score),
  );
  let combined = trace.score;
  if (action === "REWRITE_DRAFT" && trace.hardEligible && trace.score !== null) {
    if (draft === null) throw Error("Rewrite source policy requires USER_DRAFT similarity");
    const nonnegativeContext = Math.max(0, context ?? 0);
    const draftSupportsContext = draft >= 0.25;
    switch (policy) {
      case "DRAFT_ONLY":
        combined = draft;
        break;
      case "DRAFT_CONTEXT_BOOST":
        combined = draftSupportsContext ? draft + Math.min(0.05, 0.1 * nonnegativeContext) : draft;
        break;
      case "PRIMARY_FLOOR":
        combined = draftSupportsContext
          ? draft + 0.2 * Math.max(0, nonnegativeContext - draft)
          : draft;
        break;
      case "SOURCE_MAX_DOMINANCE":
        combined = draftSupportsContext
          ? Math.max(draft, goal ?? Number.NEGATIVE_INFINITY) +
            Math.min(0.05, 0.1 * nonnegativeContext)
          : draft;
        break;
    }
  }
  return {
    skillId: trace.skillId,
    draft,
    goal,
    context,
    combined,
    rank: null,
    poolRank: null,
    admittedRank: null,
  };
}

function median(values: readonly number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle]! : (sorted[middle - 1]! + sorted[middle]!) / 2;
}

export function rankAndAdmitP087(
  traces: readonly SemanticCandidateTrace[],
  action: AgentAction,
  policy: RewriteSourcePolicy,
): { scores: SourceScore[]; topK: SourceScore[]; poolCount: number } {
  const scores = traces.map((trace) => sourceScore(trace, action, policy));
  const ranked = scores
    .filter((item) => item.combined !== null)
    .sort((a, b) => b.combined! - a.combined! || a.skillId.localeCompare(b.skillId));
  ranked.forEach((item, index) => {
    item.rank = index + 1;
  });
  if (!ranked.length) return { scores, topK: [], poolCount: 0 };
  const max = ranked[0]!.combined!;
  const mid = median(ranked.map((item) => item.combined!));
  const pool = ranked.filter(
    (item) => item.combined! >= 0.4 && item.combined! >= max - 0.15 && max - mid >= 0.2,
  );
  pool.forEach((item, index) => {
    item.poolRank = index + 1;
  });
  const topK = pool.slice(0, 10);
  topK.forEach((item, index) => {
    item.admittedRank = index + 1;
  });
  return { scores, topK, poolCount: pool.length };
}
