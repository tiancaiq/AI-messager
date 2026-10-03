import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createHash } from "node:crypto";
import type { AgentAction, CoachingRequest } from "@ai-message-coach/contracts";
import { SemanticProfileSchema, type SemanticProfile } from "../authoring/semantic-profiles.js";
import { packageRoot } from "../authoring/generator.js";
import { loadSrs3Corpus } from "./srs3-ranking-corpus.js";
import { loadProductionSemanticCatalog } from "./srs3e-semantic-model.js";
import { TopKObservationSchema, type TopKObservation } from "./srs3f-semantic-topk.js";
import {
  buildSupervisorInput,
  SRS4_USER_FACT_GATED_CAPABILITIES,
  verifySrs4FrozenFiles,
  type SupervisorInput,
  type SupervisorOutcome,
} from "./srs4-supervisor.js";
import type { DevelopmentLabel, DevelopmentObservation } from "./srs4-development-evaluator.js";

interface BCase {
  key: string;
  action: AgentAction;
  status: TopKObservation["status"];
  hardEligibleCount: number;
  fullRanking: TopKObservation["fullEligibleRanking"];
  top10: string[];
  capabilityEligibility: TopKObservation["capabilityEligibility"];
  modifierEligibility: TopKObservation["modifierEligibility"];
  required: Array<{ skillId: string }>;
  acceptable: Array<{ skillId: string }>;
  forbidden: Array<{ skillId: string }>;
  strictNone: boolean;
}
interface ControlRaw {
  scenarios: Array<{ id: string; fixedAction: AgentAction; request: CoachingRequest }>;
}

export interface PreparedDevelopmentCase {
  key: string;
  action: AgentAction;
  request: CoachingRequest;
  topK: TopKObservation;
  input: SupervisorInput | SupervisorOutcome;
}

export async function prepareSrs4Development(): Promise<{
  cases: PreparedDevelopmentCase[];
  labels: DevelopmentLabel[];
}> {
  await verifySrs4FrozenFiles(packageRoot);
  const [bBytes, controlBytes, profileBytes, corpus, catalog] = await Promise.all([
    readFile(resolve(packageRoot, "tests/fixtures/srs3f/semantic-topk-exposed-v1.json"), "utf8"),
    readFile(
      resolve(packageRoot, "tests/fixtures/srs3e-semantic/calibration-v2/calibration-raw.json"),
      "utf8",
    ),
    readFile(resolve(packageRoot, "tests/fixtures/srs3/semantic-skill-profiles.json"), "utf8"),
    loadSrs3Corpus(),
    loadProductionSemanticCatalog(),
  ]);
  const b = JSON.parse(bBytes) as {
    cases: BCase[];
    bindings: { calibrationRawSha256: string; srs3b: { manifestSha256: string } };
  };
  if (
    createHash("sha256").update(controlBytes).digest("hex") !== b.bindings.calibrationRawSha256 ||
    corpus.bindings.manifestSha256 !== b.bindings.srs3b.manifestSha256
  )
    throw Error("SRS-4 exposed raw source binding drift");
  const controls = JSON.parse(controlBytes) as ControlRaw;
  const profileArtifact = JSON.parse(profileBytes) as {
    profiles: Array<SemanticProfile & { profileDigest: string; sourceDefinitionDigest: string }>;
  };
  const profiles = profileArtifact.profiles.map((profile) => {
    const { profileDigest, sourceDefinitionDigest, ...semantic } = profile;
    return {
      ...SemanticProfileSchema.parse(semantic),
      profileDigest,
      sourceDefinitionDigest,
    };
  });
  const rawByKey = new Map<string, CoachingRequest>([
    ...corpus.raw.map((row) => [`SRS3B:${row.id}`, row.request] as const),
    ...controls.scenarios.map((row) => [`CONTROL:${row.id}`, row.request] as const),
  ]);
  if (b.cases.length !== 53 || new Set(b.cases.map((row) => row.key)).size !== 53)
    throw Error("SRS-4 exposed development set drift");
  const cases: PreparedDevelopmentCase[] = [];
  for (const row of b.cases) {
    const request = rawByKey.get(row.key);
    if (!request) throw Error("SRS-4 B/raw case mismatch");
    const topK = TopKObservationSchema.parse({
      action: row.action,
      status: row.status,
      fullEligibleRanking: row.fullRanking,
      top3: row.fullRanking.slice(0, 3),
      top5: row.fullRanking.slice(0, 5),
      top10: row.fullRanking.slice(0, 10),
      capabilityEligibility: row.capabilityEligibility,
      modifierEligibility: row.modifierEligibility,
      hardEligibleCount: row.hardEligibleCount,
      diagnostics: [],
    });
    if (
      JSON.stringify(topK.top10.map((candidate) => candidate.skillId)) !== JSON.stringify(row.top10)
    )
      throw Error("SRS-4 frozen B Top-10 mismatch");
    cases.push({
      key: row.key,
      action: row.action,
      request,
      topK,
      input: buildSupervisorInput({
        request,
        fixedAction: row.action,
        observation: topK,
        catalog,
        profiles,
      }),
    });
  }
  // Labels are returned separately and must be joined only after raw observations.
  const labels = b.cases.map((row) => ({
    key: row.key,
    action: row.action,
    required: row.required.map((item) => item.skillId),
    acceptable: row.acceptable.map((item) => item.skillId),
    forbidden: row.forbidden.map((item) => item.skillId),
    strictNone: row.strictNone,
  }));
  return { cases, labels };
}

export function contentFreeDevelopmentObservation(
  row: PreparedDevelopmentCase,
  outcome: SupervisorOutcome,
): DevelopmentObservation {
  return {
    key: row.key,
    candidateIds: row.topK.top10.map((candidate) => candidate.skillId),
    semanticRanks: Object.fromEntries(
      row.topK.top10.map((candidate) => [candidate.skillId, candidate.semanticRank]),
    ),
    hardEligibility: Object.fromEntries(
      row.topK.capabilityEligibility.map((trace) => [trace.skillId, trace.hardEligible]),
    ),
    provenanceGrounded: Object.fromEntries(
      row.topK.top10.map((candidate) => [
        candidate.skillId,
        !SRS4_USER_FACT_GATED_CAPABILITIES.has(candidate.skillId) ||
          (!("stage" in row.input) &&
            row.input.evidence.some(
              (fragment) => fragment.source === "USER_DRAFT" || fragment.source === "USER_HISTORY",
            )),
      ]),
    ),
    selection: outcome.selection,
    stage: outcome.stage,
  };
}

export function exposedDevelopmentProvenanceGaps(
  cases: readonly PreparedDevelopmentCase[],
  labels: readonly DevelopmentLabel[],
): Array<{ key: string; requiredSkillId: string; bTop10Available: boolean }> {
  const byKey = new Map(labels.map((label) => [label.key, label]));
  return cases.flatMap((row) => {
    if ("stage" in row.input) return [];
    const userAuthored = row.input.evidence.some(
      (fragment) => fragment.source === "USER_DRAFT" || fragment.source === "USER_HISTORY",
    );
    if (userAuthored) return [];
    const label = byKey.get(row.key);
    if (!label) throw Error("SRS-4 provenance diagnostic missing label");
    return label.required
      .filter((id) => SRS4_USER_FACT_GATED_CAPABILITIES.has(id))
      .map((requiredSkillId) => ({
        key: row.key,
        requiredSkillId,
        bTop10Available: row.topK.top10.some((candidate) => candidate.skillId === requiredSkillId),
      }));
  });
}
