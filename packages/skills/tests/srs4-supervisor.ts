// Private, offline SRS-4 shadow boundary. Never imported by production skill code.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  AgentActionSchema,
  CoachingRequestSchema,
  type AgentAction,
  type CoachingRequest,
} from "@ai-message-coach/contracts";
import { z } from "zod";
import { contentDigest } from "../authoring/generator.js";
import type { SemanticProfile } from "../authoring/semantic-profiles.js";
import type { Srs2CatalogEntry } from "./srs2-shadow-retrieval.js";
import { TopKObservationSchema, type TopKObservation } from "./srs3f-semantic-topk.js";

const sha256 = (bytes: Uint8Array | string) => createHash("sha256").update(bytes).digest("hex");
const nonWording = new Set<AgentAction>([
  "SUGGEST_ACTIONS",
  "ASK_CLARIFICATION",
  "NO_REPLY_NEEDED",
]);
export const SRS4_USER_FACT_GATED_CAPABILITIES: ReadonlySet<string> = new Set([
  "acknowledge_mistake",
  "apology",
  "boundary_setting",
  "expectation_setting",
  "follow_up",
  "planning",
  "reassurance",
  "status_update",
]);

export const SRS4_B_SHA256 = {
  config: "4f3f94e0b2089c9bb7a8e8c3a83c697b7df3d9f3c4c0c14b4c00ac0d4518327b",
  trace: "3da194a50d46c33c26b5dcaa2f59ce7d33eb03d4352e5eefc706d9241e6ed214",
  profiles: "b061bf17a04e696ad78af45016e6803a96f79f0e617fcb2800a4a591fbc33d1c",
} as const;
export const SRS4_VECTOR_SHA256 =
  "b02d4664585c29d3a0ac33e41c6827d2bd4d5d065fd7eb289182084c6dc05588";

export async function verifySrs4FrozenFiles(packageRoot: string): Promise<void> {
  const files = [
    ["config", "tests/fixtures/srs3f/semantic-topk-proposed-config-v1.json"],
    ["trace", "tests/fixtures/srs3f/semantic-topk-exposed-v1.json"],
    ["profiles", "tests/fixtures/srs3/semantic-skill-profiles.json"],
  ] as const;
  for (const [name, path] of files) {
    const actual = sha256(await readFile(resolve(packageRoot, path)));
    if (actual !== SRS4_B_SHA256[name]) throw Error(`SRS-4 frozen ${name} binding drift`);
  }
}

export const EvidenceSourceSchema = z.enum([
  "USER_DRAFT",
  "SELECTED_GOAL",
  "OTHER_MESSAGE",
  "USER_HISTORY",
  "UNKNOWN_MESSAGE",
]);
export const EvidenceUseSchema = z.enum([
  "OBJECTIVE",
  "CONTEXT",
  "USER_FACT",
  "USER_RESPONSIBILITY",
  "USER_COMMITMENT",
  "USER_LIMIT",
  "USER_PROMISE",
]);
export const EvidenceFragmentSchema = z
  .object({
    ref: z
      .string()
      .regex(/^(?:USER_DRAFT|SELECTED_GOAL|OTHER_MESSAGE|USER_HISTORY|UNKNOWN_MESSAGE):\d+$/u),
    source: EvidenceSourceSchema,
    ordinal: z.number().int().nonnegative(),
    text: z.string().min(1).max(10_000),
    speakerConfidence: z.number().min(0).max(1).nullable(),
    textConfidence: z.number().min(0).max(1).nullable(),
  })
  .strict();
export type EvidenceFragment = z.infer<typeof EvidenceFragmentSchema>;

export const CandidateProjectionSchema = z
  .object({
    skillId: z.string(),
    definitionVersion: z.number().int().positive(),
    profileRevision: z.number().int().positive(),
    sourceDefinitionDigest: z.string(),
    profileDigest: z.string(),
    job: z.string(),
    useWhen: z.array(z.string()).min(1),
    whenNotUse: z.array(z.string()).min(1),
    neighbors: z.array(
      z
        .object({
          skillId: z.string(),
          relationship: z.string(),
          distinction: z.string(),
          coexistence: z.string(),
        })
        .strict(),
    ),
    compatibleSkills: z.array(z.string()),
    conflictingSkills: z.array(z.string()),
  })
  .strict();
export type CandidateProjection = z.infer<typeof CandidateProjectionSchema>;

export const SupervisorInputSchema = z
  .object({
    fixedAction: AgentActionSchema,
    language: z
      .object({
        primary: z.string().nullable(),
        secondary: z.string().nullable(),
        script: z.string(),
        codeSwitching: z.boolean(),
      })
      .strict(),
    warnings: z.array(z.string()),
    evidence: z.array(EvidenceFragmentSchema).max(14),
    candidates: z.array(CandidateProjectionSchema).max(10),
  })
  .strict();
export type SupervisorInput = z.infer<typeof SupervisorInputSchema>;

export const SupervisorReasonSchema = z.enum([
  "DIRECTLY_SUPPORTED",
  "DISTINCT_SUPPORTED_JOB",
  "COMPLEMENTS_SELECTED",
  "PREREQUISITE_UNSUPPORTED",
  "EXPLICITLY_NEGATED",
  "OWNERSHIP_MISMATCH",
  "WRONG_TEMPORAL_ROLE",
  "REDUNDANT_WITH_SELECTED",
  "CONFLICTS_WITH_SELECTED",
  "NO_MATERIAL_JOB",
  "INSUFFICIENT_EVIDENCE",
]);
export type SupervisorReason = z.infer<typeof SupervisorReasonSchema>;
const positiveReasons = new Set<SupervisorReason>([
  "DIRECTLY_SUPPORTED",
  "DISTINCT_SUPPORTED_JOB",
  "COMPLEMENTS_SELECTED",
]);
export const WireJudgmentSchema = z
  .object({
    candidateDecisions: z
      .array(
        z
          .object({
            skillId: z.string(),
            decision: z.enum(["SELECT", "REJECT"]),
            reasonCodes: z.array(SupervisorReasonSchema).min(1).max(3),
            evidence: z
              .array(
                z
                  .object({ ref: EvidenceFragmentSchema.shape.ref, use: EvidenceUseSchema })
                  .strict(),
              )
              .max(3),
          })
          .strict(),
      )
      .max(10),
  })
  .strict();
export type WireJudgment = z.infer<typeof WireJudgmentSchema>;

export const SkillSelectionSchema = z
  .object({
    status: z.enum(["SELECTED", "NONE", "FAILED"]),
    selectedCapabilities: z
      .array(
        z
          .object({
            skillId: z.string(),
            profileRevision: z.number().int().positive(),
            selectionReasonCodes: z.array(SupervisorReasonSchema),
          })
          .strict(),
      )
      .max(4),
    candidateDecisions: WireJudgmentSchema.shape.candidateDecisions,
    failureCode: z
      .enum(["MODEL_OUTPUT_INVALID", "PROVIDER_FAILURE", "INPUT_TOO_LARGE", "BINDING_DRIFT"])
      .optional(),
  })
  .strict()
  .superRefine((value, context) => {
    const selectedIds = value.selectedCapabilities.map((item) => item.skillId);
    const decisionSelectedIds = value.candidateDecisions
      .filter((item) => item.decision === "SELECT")
      .map((item) => item.skillId);
    if (
      new Set(selectedIds).size !== selectedIds.length ||
      (value.status === "SELECTED") !== selectedIds.length > 0 ||
      (value.status === "FAILED") !== Boolean(value.failureCode) ||
      (value.status === "FAILED" && value.candidateDecisions.length > 0) ||
      (value.status !== "FAILED" &&
        JSON.stringify([...selectedIds].sort()) !== JSON.stringify(decisionSelectedIds.sort()))
    )
      context.addIssue({ code: "custom", message: "Invalid SRS-4 selection status invariant" });
  });
export type SkillSelection = z.infer<typeof SkillSelectionSchema>;
export type SupervisorOutcome =
  | { stage: "STRUCTURAL_EMPTY" | "UNSUPPORTED_LANGUAGE" | "EMPTY_QUERY"; selection: null }
  | { stage: "SUPERVISOR"; selection: SkillSelection };

function confidence(value: number | null | undefined): number | null {
  return value ?? null;
}

export function serializeSupervisorEvidence(
  requestInput: CoachingRequest,
  fixedAction: AgentAction,
): Pick<SupervisorInput, "fixedAction" | "language" | "warnings" | "evidence"> {
  const request = CoachingRequestSchema.parse(requestInput);
  AgentActionSchema.parse(fixedAction);
  if (request.analysis.messages.length > 12) throw Error("INPUT_TOO_LARGE");
  const evidence: EvidenceFragment[] = [];
  const add = (
    source: EvidenceFragment["source"],
    ordinal: number,
    text: string,
    speakerConfidence: number | null,
    textConfidence: number | null,
  ) => {
    if (text.trim())
      evidence.push({
        ref: `${source}:${ordinal}`,
        source,
        ordinal,
        text: text.normalize("NFC").trim(),
        speakerConfidence,
        textConfidence,
      });
  };
  if (fixedAction === "REWRITE_DRAFT" || fixedAction === "COMPLETE_DRAFT")
    add(
      "USER_DRAFT",
      0,
      request.analysis.draft.text ?? "",
      null,
      confidence(request.analysis.draft.confidence),
    );
  if (request.selection?.kind === "ACTION")
    add("SELECTED_GOAL", 0, request.selection.intent, null, null);
  const counts = { OTHER_MESSAGE: 0, USER_HISTORY: 0, UNKNOWN_MESSAGE: 0 };
  for (const message of request.analysis.messages) {
    const source =
      message.speaker === "USER"
        ? "USER_HISTORY"
        : message.speaker === "OTHER"
          ? "OTHER_MESSAGE"
          : "UNKNOWN_MESSAGE";
    const ordinal = counts[source]++;
    add(
      source,
      ordinal,
      message.text,
      confidence(message.speakerConfidence),
      confidence(message.textConfidence),
    );
  }
  if (evidence.reduce((size, item) => size + item.text.length, 0) > 12_000)
    throw Error("INPUT_TOO_LARGE");
  return {
    fixedAction,
    language: {
      primary: request.analysis.language.primary,
      secondary: request.analysis.language.secondary,
      script: request.analysis.language.script,
      codeSwitching: request.analysis.language.codeSwitching,
    },
    warnings: request.analysis.warnings,
    evidence: z.array(EvidenceFragmentSchema).parse(evidence),
  };
}

export function projectSupervisorCandidates(input: {
  observation: TopKObservation;
  catalog: readonly Srs2CatalogEntry[];
  profiles: readonly (SemanticProfile & {
    profileDigest: string;
    sourceDefinitionDigest: string;
  })[];
}): CandidateProjection[] {
  const observation = TopKObservationSchema.parse(input.observation);
  if (observation.status !== "RANKED") throw Error("BINDING_DRIFT");
  if (observation.top10.length === 0 || observation.top10.length > 10) throw Error("BINDING_DRIFT");
  const byId = new Map(input.catalog.map((entry) => [entry.definition.id, entry]));
  const profiles = new Map(input.profiles.map((profile) => [profile.id, profile]));
  const ids = new Set(observation.top10.map((candidate) => candidate.skillId));
  if (ids.size !== observation.top10.length) throw Error("BINDING_DRIFT");
  if (
    JSON.stringify(observation.top10) !==
      JSON.stringify(observation.fullEligibleRanking.slice(0, 10)) ||
    observation.top10.some(
      (candidate) =>
        candidate.vectorArtifactDigest !== SRS4_VECTOR_SHA256 ||
        candidate.semanticRank > 10 ||
        !observation.capabilityEligibility.some(
          (trace) => trace.skillId === candidate.skillId && trace.hardEligible,
        ),
    )
  )
    throw Error("BINDING_DRIFT");
  return observation.top10
    .map((candidate) => {
      const entry = byId.get(candidate.skillId);
      const profile = profiles.get(candidate.skillId);
      if (
        !entry ||
        !profile ||
        entry.catalog !== "PRODUCTION" ||
        entry.definition.status !== "ACTIVE" ||
        entry.definitionType !== "ATOMIC" ||
        candidate.lane !== "ATOMIC" ||
        profile.lane !== "ATOMIC" ||
        candidate.version !== entry.definition.version ||
        candidate.sourceDefinitionDigest !== entry.sourceDigest ||
        candidate.sourceDefinitionDigest !== profile.sourceDefinitionDigest ||
        candidate.profileDigest !== profile.profileDigest ||
        contentDigest({
          id: profile.id,
          lane: profile.lane,
          profileRevision: profile.profileRevision,
          job: profile.job,
          useWhen: profile.useWhen,
          whenNotUse: profile.whenNotUse,
          semanticTriggers: profile.semanticTriggers,
          neighbors: profile.neighbors,
          ...(profile.knownBoundaryIssue ? { knownBoundaryIssue: profile.knownBoundaryIssue } : {}),
          reviewState: profile.reviewState,
        }) !== profile.profileDigest
      )
        throw Error("BINDING_DRIFT");
      return CandidateProjectionSchema.parse({
        skillId: candidate.skillId,
        definitionVersion: candidate.version,
        profileRevision: profile.profileRevision,
        sourceDefinitionDigest: candidate.sourceDefinitionDigest,
        profileDigest: candidate.profileDigest,
        job: profile.job,
        useWhen: profile.useWhen,
        whenNotUse: profile.whenNotUse,
        neighbors: profile.neighbors.filter((neighbor) => ids.has(neighbor.skillId)),
        compatibleSkills: entry.definition.compatibleSkills.filter((id) => ids.has(id)),
        conflictingSkills: entry.definition.conflictingSkills.filter((id) => ids.has(id)),
      });
    })
    .sort((a, b) => a.skillId.localeCompare(b.skillId));
}

export function buildSupervisorInput(input: {
  request: CoachingRequest;
  fixedAction: AgentAction;
  observation: TopKObservation;
  catalog: readonly Srs2CatalogEntry[];
  profiles: readonly (SemanticProfile & {
    profileDigest: string;
    sourceDefinitionDigest: string;
  })[];
}): SupervisorInput | SupervisorOutcome {
  if (input.observation.action !== input.fixedAction) throw Error("BINDING_DRIFT");
  if (nonWording.has(input.fixedAction)) {
    if (input.observation.status !== "STRUCTURAL_EMPTY" || input.observation.top10.length)
      throw Error("BINDING_DRIFT");
    return { stage: "STRUCTURAL_EMPTY", selection: null };
  }
  if (input.observation.status === "MODEL_UNSUPPORTED_LANGUAGE")
    return { stage: "UNSUPPORTED_LANGUAGE", selection: null };
  if (input.observation.status === "EMPTY_QUERY") return { stage: "EMPTY_QUERY", selection: null };
  const evidence = serializeSupervisorEvidence(input.request, input.fixedAction);
  return SupervisorInputSchema.parse({
    ...evidence,
    candidates: projectSupervisorCandidates(input),
  });
}

export function validateSupervisorJudgment(input: SupervisorInput, wire: unknown): SkillSelection {
  const fail = (): SkillSelection => ({
    status: "FAILED",
    selectedCapabilities: [],
    candidateDecisions: [],
    failureCode: "MODEL_OUTPUT_INVALID",
  });
  const parsed = WireJudgmentSchema.safeParse(wire);
  if (!parsed.success) return fail();
  const candidateIds = new Set(input.candidates.map((candidate) => candidate.skillId));
  const decisions = parsed.data.candidateDecisions;
  if (
    decisions.length !== candidateIds.size ||
    new Set(decisions.map((row) => row.skillId)).size !== decisions.length ||
    decisions.some((row) => !candidateIds.has(row.skillId))
  )
    return fail();
  const evidence = new Map(input.evidence.map((fragment) => [fragment.ref, fragment]));
  const selected = decisions.filter((row) => row.decision === "SELECT");
  if (selected.length > 4) return fail();
  for (const decision of decisions) {
    const reasons = decision.reasonCodes;
    if (
      new Set(reasons).size !== reasons.length ||
      new Set(decision.evidence.map((item) => `${item.ref}/${item.use}`)).size !==
        decision.evidence.length ||
      reasons.some((code) => positiveReasons.has(code) !== (decision.decision === "SELECT")) ||
      decision.evidence.some(({ ref, use }) => {
        const fragment = evidence.get(ref);
        if (!fragment) return true;
        if (use === "CONTEXT") return false;
        if (use === "OBJECTIVE")
          return fragment.source !== "USER_DRAFT" && fragment.source !== "SELECTED_GOAL";
        return fragment.source !== "USER_DRAFT" && fragment.source !== "USER_HISTORY";
      })
    )
      return fail();
    if (
      reasons.some(
        (code) => code === "EXPLICITLY_NEGATED" || code === "PREREQUISITE_UNSUPPORTED",
      ) &&
      !decision.evidence.some(
        (item) =>
          (item.ref.startsWith("USER_DRAFT:") || item.ref.startsWith("USER_HISTORY:")) &&
          item.use.startsWith("USER_"),
      )
    )
      return fail();
    if (decision.decision === "SELECT") {
      if (
        decision.evidence.length === 0 ||
        !decision.evidence.some((item) => item.use !== "CONTEXT")
      )
        return fail();
      if (
        SRS4_USER_FACT_GATED_CAPABILITIES.has(decision.skillId) &&
        !decision.evidence.some((item) => item.use.startsWith("USER_"))
      )
        return fail();
    }
  }
  const selectedIds = new Set(selected.map((row) => row.skillId));
  for (const decision of decisions) {
    const candidate = input.candidates.find((item) => item.skillId === decision.skillId)!;
    if (
      decision.reasonCodes.includes("CONFLICTS_WITH_SELECTED") &&
      !input.candidates.some(
        (other) =>
          selectedIds.has(other.skillId) &&
          (candidate.conflictingSkills.includes(other.skillId) ||
            other.conflictingSkills.includes(candidate.skillId)),
      )
    )
      return fail();
    if (
      selectedIds.size < 2 &&
      decision.reasonCodes.some(
        (code) => code === "COMPLEMENTS_SELECTED" || code === "DISTINCT_SUPPORTED_JOB",
      )
    )
      return fail();
  }
  for (const candidate of input.candidates) {
    if (!selectedIds.has(candidate.skillId)) continue;
    if (candidate.conflictingSkills.some((id) => selectedIds.has(id))) return fail();
    if (
      input.candidates.some(
        (other) =>
          selectedIds.has(other.skillId) && other.conflictingSkills.includes(candidate.skillId),
      )
    )
      return fail();
  }
  return SkillSelectionSchema.parse({
    status: selected.length ? "SELECTED" : "NONE",
    selectedCapabilities: selected
      .map((row) => ({
        skillId: row.skillId,
        profileRevision: input.candidates.find((candidate) => candidate.skillId === row.skillId)!
          .profileRevision,
        selectionReasonCodes: row.reasonCodes,
      }))
      .sort((a, b) => a.skillId.localeCompare(b.skillId)),
    candidateDecisions: decisions,
  });
}

export interface SkillSupervisorJudge {
  judge(input: SupervisorInput): Promise<unknown>;
}

export class FakeSupervisorJudge implements SkillSupervisorJudge {
  constructor(private readonly respond: (input: SupervisorInput) => unknown) {}
  async judge(input: SupervisorInput): Promise<unknown> {
    return this.respond(input);
  }
}

export async function observeSupervisor(
  input: SupervisorInput | SupervisorOutcome,
  judge: SkillSupervisorJudge,
): Promise<SupervisorOutcome> {
  if ("stage" in input) return input;
  try {
    return {
      stage: "SUPERVISOR",
      selection: validateSupervisorJudgment(input, await judge.judge(input)),
    };
  } catch {
    return {
      stage: "SUPERVISOR",
      selection: {
        status: "FAILED",
        selectedCapabilities: [],
        candidateDecisions: [],
        failureCode: "PROVIDER_FAILURE",
      },
    };
  }
}

// A content-free fingerprint useful for proving annotation isolation; never log input text.
export function supervisorInputDigest(input: SupervisorInput): string {
  return sha256(JSON.stringify(SupervisorInputSchema.parse(input)));
}
