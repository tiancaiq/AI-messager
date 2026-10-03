import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import {
  AgentActionSchema,
  CoachingRequestSchema,
  SkillContextSchema,
} from "@ai-message-coach/contracts";
import { deriveSkillContextForProfile } from "../../ai/src/skill-context-normalization.js";
import type { CoachingPolicyDecision } from "../../ai/src/coaching-policy.js";
import {
  srs3RawScenarios,
  type Srs3RawScenario,
} from "../../test-fixtures/src/srs3-ranking-development.js";
import { z } from "zod";
import { packageRoot } from "../authoring/generator.js";
import { SrsScenarioAnnotationSchema } from "./srs1-foundation.js";
import {
  buildSrs2Catalog,
  runSrs2ShadowRetrieval,
  type Srs2CatalogEntry,
} from "./srs2-shadow-retrieval.js";

const root = resolve(packageRoot, "../..");
const manifestPath = "packages/skills/tests/fixtures/srs3/phase8a-evidence-manifest.json";
const triagePath = "packages/skills/tests/fixtures/srs3/source-triage.json";
const annotationPath = "packages/skills/tests/fixtures/srs3/development-annotations.json";
const authoringPath = "packages/skills/tests/fixtures/srs3/authoring-metadata.json";
const rawPath = "packages/test-fixtures/src/srs3-ranking-development.ts";
const catalogPath = "packages/skills/definitions/approved-manifest.yaml";
const priorityPairs = [
  ["request", "clarification"],
  ["request", "ask_for_help"],
  ["follow_up", "request"],
  ["boundary_setting", "decline"],
  ["boundary_setting", "de_escalation"],
  ["planning", "expectation_setting"],
  ["planning", "status_update"],
  ["apology", "acknowledge_mistake"],
  ["emotional_validation", "reassurance"],
  ["status_update", "expectation_setting"],
] as const;
export const FROZEN_SRS3A_MANIFEST_SHA256 =
  "0700162fd5b7c656c1d6134cdd3d69baa9a824eb4a01a598b7ea6d4b4c666362";

const sha256 = (bytes: Uint8Array | string): string =>
  createHash("sha256").update(bytes).digest("hex");
const unique = (values: readonly string[]): boolean => new Set(values).size === values.length;
const id = z.string().regex(/^R(?:0[1-9]|[1-9][0-9]*)$/u);
const digest = z.string().regex(/^(?:sha256:)?[a-f0-9]{64}$/iu);
const skillId = z.string().regex(/^[a-z][a-z0-9]*(?:_[a-z0-9]+)*$/u);
const SettingSchema = z.enum(["WORK", "PERSONAL", "SERVICE", "UNSPECIFIED"]);
const LanguageGroupSchema = z.enum([
  "ENGLISH",
  "SIMPLIFIED_CHINESE",
  "TRADITIONAL_CHINESE",
  "CODE_SWITCHING",
]);
const AuthoringMetadataSchema = z
  .object({
    schemaVersion: z.literal(1),
    phase: z.literal("SRS-3B"),
    split: z.literal("EXPOSED_DEVELOPMENT"),
    rawSetSha256: digest,
    cases: z.array(
      z
        .object({
          id,
          revision: z.string().regex(/^R[1-9][0-9]*$/u),
          boundaryExplicitness: z.enum(["EXPLICIT", "IMPLICIT"]),
          draftRealism: z.enum(["ROUGH", "NORMAL", "ALREADY_DECENT", "OVER_POLISHED"]).optional(),
        })
        .strict(),
    ),
  })
  .strict();
const IssueCodeSchema = z.enum([
  "BAD_RANKING_LABEL",
  "SKILL_BOUNDARY_AMBIGUITY",
  "DUPLICATE_SCENARIO",
  "INSUFFICIENT_EVIDENCE",
]);

export const Srs3RawScenarioSchema = z
  .object({
    id,
    revision: z.string().regex(/^R[1-9][0-9]*$/u),
    scenarioFamily: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
    split: z.literal("EXPOSED_DEVELOPMENT"),
    request: CoachingRequestSchema,
    fixedAction: AgentActionSchema,
    catalogScope: z.literal("PRODUCTION"),
    setting: SettingSchema,
    languageGroup: LanguageGroupSchema,
  })
  .strict()
  .superRefine((scenario, context) => {
    const language = scenario.request.analysis.language;
    const draftPresent = Boolean(scenario.request.analysis.draft.text?.trim());
    if (scenario.fixedAction === "REWRITE_DRAFT" && !draftPresent)
      context.addIssue({ code: "custom", message: "Rewrite needs a visible draft." });
    if (scenario.fixedAction === "SUGGEST_REPLY" && draftPresent)
      context.addIssue({ code: "custom", message: "Empty-draft suggestion cannot carry a draft." });
    if (scenario.fixedAction === "NO_REPLY_NEEDED" && draftPresent)
      context.addIssue({ code: "custom", message: "No-reply case cannot carry a draft." });
    const expected =
      language.primary === "en" && !language.codeSwitching
        ? "ENGLISH"
        : language.primary === "zh" && language.codeSwitching && language.secondary === "en"
          ? "CODE_SWITCHING"
          : language.primary === "zh" && language.script === "SIMPLIFIED"
            ? "SIMPLIFIED_CHINESE"
            : language.primary === "zh" && language.script === "TRADITIONAL"
              ? "TRADITIONAL_CHINESE"
              : null;
    if (expected !== scenario.languageGroup)
      context.addIssue({ code: "custom", message: "Language group disagrees with the request." });
    if (scenario.fixedAction === "SUGGEST_REPLY" && scenario.request.selection?.kind !== "ACTION")
      context.addIssue({
        code: "custom",
        message: "Empty-draft suggestion needs a fixed user goal.",
      });
  });

const ProvenanceSchema = z
  .object({
    sourceKind: z.enum(["PHASE8A_ADAPTED", "NEW_INDEPENDENT_SRS3"]),
    sourceLineage: z.string().nullable(),
    sourceRevision: z.string().nullable(),
    sourceItemDigest: digest.nullable(),
    sourceArtifactDigest: digest.nullable().optional(),
    evidenceRole: z.enum(["EVALUATION_LABEL_SOURCE", "NEW_INDEPENDENT_SOURCE"]),
  })
  .strict();

export const Srs3AnnotationSchema = z
  .object({
    id,
    scenarioFamily: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/u),
    required: z.array(skillId),
    acceptable: z.array(skillId),
    forbidden: z.array(skillId),
    strictNone: z.boolean(),
    primary: z.array(skillId),
    shouldRankAbove: z.array(z.tuple([skillId, skillId])),
    source: ProvenanceSchema.optional(),
    reviewState: z.enum(["PENDING_REVIEW", "ACCEPTED", "QUARANTINE"]),
    reviewerType: z.enum(["CODEX_SEMANTIC_REVIEW", "QUALIFIED_NATIVE_LANGUAGE_HUMAN", "NONE"]),
    reviewedRevision: z
      .string()
      .regex(/^R[1-9][0-9]*$/u)
      .nullable(),
    reviewIssueCodes: z.array(IssueCodeSchema),
    reviewerJustification: z.string().min(15).nullable(),
    preservation: z
      .object({
        intent: z.literal(true),
        facts: z.literal(true),
        commitments: z.literal(true),
        certainty: z.literal(true),
        responsibility: z.literal(true),
      })
      .strict()
      .nullable(),
  })
  .strict()
  .superRefine((annotation, context) => {
    const sets = [...annotation.required, ...annotation.acceptable, ...annotation.forbidden];
    if (!unique(sets) || !unique(annotation.primary))
      context.addIssue({
        code: "custom",
        message: "Capability sets and primary IDs must be disjoint and unique.",
      });
    const permissible = new Set([...annotation.required, ...annotation.acceptable]);
    if (annotation.primary.some((value) => !permissible.has(value)))
      context.addIssue({ code: "custom", message: "Primary must be required or acceptable." });
    if (
      annotation.strictNone &&
      (permissible.size || annotation.primary.length || annotation.shouldRankAbove.length)
    )
      context.addIssue({ code: "custom", message: "Strict NONE cannot carry positive labels." });
    if (annotation.primary.length > 1 && annotation.shouldRankAbove.length)
      context.addIssue({ code: "custom", message: "Co-primary cases cannot carry pair order." });
    const pairs = annotation.shouldRankAbove.map(([higher, lower]) => `${higher}>${lower}`);
    if (!unique(pairs)) context.addIssue({ code: "custom", message: "Duplicate pair order." });
    const edges = new Map<string, string[]>();
    for (const [higher, lower] of annotation.shouldRankAbove) {
      if (higher === lower || !permissible.has(higher) || !permissible.has(lower))
        context.addIssue({
          code: "custom",
          message: "Pair endpoints must be distinct permissible capabilities.",
        });
      edges.set(higher, [...(edges.get(higher) ?? []), lower]);
    }
    const visit = (node: string, path: Set<string>): boolean => {
      if (path.has(node)) return true;
      const next = new Set(path).add(node);
      return (edges.get(node) ?? []).some((other) => visit(other, next));
    };
    if ([...edges.keys()].some((node) => visit(node, new Set())))
      context.addIssue({ code: "custom", message: "Pair order contains a cycle." });
    if (
      annotation.reviewState === "ACCEPTED" &&
      (annotation.reviewerType === "NONE" ||
        annotation.reviewerJustification === null ||
        annotation.reviewedRevision === null ||
        annotation.preservation === null ||
        annotation.reviewIssueCodes.length)
    )
      context.addIssue({
        code: "custom",
        message: "Accepted labels need clean semantic review and rationale.",
      });
    if (annotation.reviewState !== "ACCEPTED" && annotation.reviewIssueCodes.length === 0)
      context.addIssue({ code: "custom", message: "Unaccepted labels need a closed issue code." });
  });

const AnnotationFileSchema = z
  .object({
    schemaVersion: z.literal(1),
    phase: z.literal("SRS-3B"),
    split: z.literal("EXPOSED_DEVELOPMENT"),
    manifestSha256: digest,
    rawSourceSha256: digest,
    rawSetSha256: digest,
    catalogManifestSha256: digest,
    triageSha256: digest,
    provenance: ProvenanceSchema,
    annotations: z.array(Srs3AnnotationSchema).min(1),
  })
  .strict();

const TriageEntrySchema = z
  .object({
    sourceKey: z.string().min(1),
    lineageId: z.string().min(1),
    sourceRevision: z.string().min(1),
    sourceArtifact: z.string().min(1),
    sourceArtifactDigest: digest,
    itemDigest: digest,
    reviewedContentDigest: digest.nullable(),
    manifestSha256: digest,
    disposition: z.enum([
      "ADAPT_TO_RANKING_CASE",
      "REGRESSION_ONLY",
      "DUPLICATIVE",
      "INSUFFICIENT_FOR_RANKING",
    ]),
    utilityFlags: z.array(
      z.enum([
        "MULTI_REQUIRED_NO_ORDER",
        "USEFUL_FOR_NONE",
        "USEFUL_FOR_PRIMARY",
        "USEFUL_FOR_PAIRWISE",
      ]),
    ),
    duplicateFamilyId: z.string().min(1),
    proposedScenarioId: id.nullable(),
    runnableEvidenceSufficient: z.boolean(),
    reason: z.string().min(25),
  })
  .strict();

const TriageFileSchema = z
  .object({
    schemaVersion: z.literal(1),
    phase: z.literal("SRS-3B"),
    split: z.literal("EXPOSED_DEVELOPMENT"),
    manifestSha256: digest,
    sourceCount: z.literal(69),
    dispositions: z.record(z.string(), z.number().int().nonnegative()),
    entries: z.array(TriageEntrySchema).length(69),
  })
  .strict();

interface ManifestEvidence {
  sourceKey: string;
  lineageId: string;
  sourceRevision: string;
  sourceArtifact: string;
  sourceArtifactDigest: string;
  itemDigest: string;
  reviewedContentDigest: string | null;
  conversionOutcome: string;
  lane: string;
  exclusionReasonCodes: string[];
}

export interface Srs3Corpus {
  raw: readonly Srs3RawScenario[];
  annotations: z.infer<typeof Srs3AnnotationSchema>[];
  authoring: z.infer<typeof AuthoringMetadataSchema>;
  triage: z.infer<typeof TriageFileSchema>;
  bindings: {
    manifestSha256: string;
    rawSourceSha256: string;
    rawSetSha256: string;
    annotationFileSha256: string;
    authoringMetadataSha256: string;
    catalogManifestSha256: string;
    triageSha256: string;
  };
}

export function validateSrs3AuthoringMetadata(input: unknown, raw: readonly Srs3RawScenario[]) {
  const metadata = AuthoringMetadataSchema.parse(input);
  if (metadata.rawSetSha256.toLowerCase() !== sha256(JSON.stringify(raw)))
    throw Error("Authoring metadata raw-set drift.");
  if (metadata.cases.length !== raw.length || !unique(metadata.cases.map((item) => item.id)))
    throw Error("Authoring metadata case coverage drift.");
  const byId = new Map(raw.map((item) => [item.id, item]));
  for (const item of metadata.cases) {
    const scenario = byId.get(item.id);
    if (!scenario || scenario.revision !== item.revision)
      throw Error(`Authoring metadata revision drift: ${item.id}`);
    if ((scenario.fixedAction === "REWRITE_DRAFT") !== (item.draftRealism !== undefined))
      throw Error(`Authoring metadata draft classification drift: ${item.id}`);
  }
  return metadata;
}

export function validateSourceTriage(
  input: unknown,
  eligible: readonly ManifestEvidence[],
  manifestSha256: string,
) {
  const triage = TriageFileSchema.parse(input);
  if (triage.manifestSha256.toLowerCase() !== manifestSha256) throw Error("Triage manifest drift.");
  const expected = new Map(eligible.map((item) => [item.lineageId, item]));
  if (!unique(triage.entries.map((item) => item.lineageId)))
    throw Error("Repeated triage lineage.");
  for (const entry of triage.entries) {
    const source = expected.get(entry.lineageId);
    if (!source) throw Error(`Ineligible triage lineage: ${entry.lineageId}`);
    for (const key of [
      "sourceKey",
      "sourceRevision",
      "sourceArtifact",
      "sourceArtifactDigest",
      "itemDigest",
      "reviewedContentDigest",
    ] as const)
      if (entry[key] !== source[key]) throw Error(`Stale triage ${key}: ${entry.lineageId}`);
    if (entry.manifestSha256.toLowerCase() !== manifestSha256)
      throw Error("Per-row manifest drift.");
    if (
      entry.disposition === "ADAPT_TO_RANKING_CASE" &&
      (!entry.runnableEvidenceSufficient || !entry.proposedScenarioId)
    )
      throw Error("Adaptation needs runnable evidence and a scenario binding.");
  }
  if (expected.size !== triage.entries.length) throw Error("Triage misses eligible source.");
  for (const [disposition, count] of Object.entries(triage.dispositions))
    if (triage.entries.filter((entry) => entry.disposition === disposition).length !== count)
      throw Error(`Triage disposition count drift: ${disposition}`);
  return triage;
}

export function validateRankingCorpus(
  rawInput: readonly unknown[],
  annotationInput: unknown,
  manifestRecords: readonly ManifestEvidence[],
  productionCatalog: readonly Srs2CatalogEntry[],
) {
  const raw = rawInput.map((item) => Srs3RawScenarioSchema.parse(item)) as Srs3RawScenario[];
  const file = AnnotationFileSchema.parse(annotationInput);
  if (!unique(raw.map((item) => item.id)) || !unique(file.annotations.map((item) => item.id)))
    throw Error("Duplicate scenario or annotation ID.");
  if (raw.length !== file.annotations.length) throw Error("Raw and annotation counts differ.");
  const byId = new Map(raw.map((item) => [item.id, item]));
  const catalog = new Map(productionCatalog.map((entry) => [entry.definition.id, entry]));
  if (productionCatalog.length !== 21) throw Error("Production catalog count drift.");
  const byLineage = new Map(manifestRecords.map((record) => [record.lineageId, record]));
  for (const annotation of file.annotations) {
    const scenario = byId.get(annotation.id);
    if (!scenario) throw Error(`Annotation lacks raw case: ${annotation.id}`);
    if (annotation.scenarioFamily !== scenario.scenarioFamily)
      throw Error(`Duplicate-family binding drift: ${annotation.id}`);
    if (annotation.reviewedRevision !== null && annotation.reviewedRevision !== scenario.revision)
      throw Error(`Reviewed revision drift: ${annotation.id}`);
    const source = annotation.source ?? file.provenance;
    if (source.sourceKind === "PHASE8A_ADAPTED") {
      const match = byLineage.get(source.sourceLineage ?? "");
      if (
        !match ||
        match.conversionOutcome !== "EVALUATION_LABEL_SOURCE" ||
        match.lane !== "CAPABILITY" ||
        match.exclusionReasonCodes.length ||
        match.sourceRevision !== source.sourceRevision ||
        match.itemDigest !== source.sourceItemDigest ||
        match.sourceArtifactDigest !== source.sourceArtifactDigest ||
        source.evidenceRole !== "EVALUATION_LABEL_SOURCE"
      )
        throw Error(`Invalid Phase 8A adaptation: ${annotation.id}`);
    } else if (
      source.sourceLineage !== null ||
      source.sourceRevision !== null ||
      source.sourceItemDigest !== null ||
      source.sourceArtifactDigest != null ||
      source.evidenceRole !== "NEW_INDEPENDENT_SOURCE"
    )
      throw Error(`New source carries Phase 8A scoring lineage: ${annotation.id}`);
    const permissible = [...annotation.required, ...annotation.acceptable, ...annotation.forbidden];
    for (const capabilityId of permissible) {
      const entry = catalog.get(capabilityId);
      if (
        !entry ||
        entry.catalog !== "PRODUCTION" ||
        entry.definitionType !== "ATOMIC" ||
        entry.definition.status !== "ACTIVE" ||
        !entry.definition.actions.includes(scenario.fixedAction)
      )
        throw Error(`Invalid capability label ${capabilityId} in ${annotation.id}`);
    }
    if (
      scenario.languageGroup !== "ENGLISH" &&
      annotation.reviewState === "ACCEPTED" &&
      annotation.reviewerType !== "QUALIFIED_NATIVE_LANGUAGE_HUMAN"
    )
      throw Error(`Qualified native-language review required: ${annotation.id}`);
    if (
      annotation.reviewState === "ACCEPTED" &&
      scenario.languageGroup === "ENGLISH" &&
      annotation.reviewerType !== "CODEX_SEMANTIC_REVIEW"
    )
      throw Error(`Unexpected English reviewer claim: ${annotation.id}`);
    const checked = SrsScenarioAnnotationSchema.parse({
      id: annotation.id.toLowerCase(),
      scenarioFamily: scenario.scenarioFamily,
      split: "DEVELOPMENT",
      source: { path: rawPath, fixtureId: scenario.id },
      catalog: "PRODUCTION",
      action: scenario.fixedAction,
      assistanceMode: ["REWRITE_DRAFT", "SUGGEST_REPLY", "COMPLETE_DRAFT"].includes(
        scenario.fixedAction,
      )
        ? scenario.fixedAction
        : "NON_WORDING_ACTION",
      language: {
        primary: scenario.request.analysis.language.primary,
        secondary: scenario.request.analysis.language.secondary,
        codeSwitching: scenario.request.analysis.language.codeSwitching,
      },
      capabilities: {
        required: annotation.required,
        acceptable: annotation.acceptable,
        forbidden: annotation.forbidden,
      },
      modifiers: { required: [], acceptable: [], forbidden: [] },
      strictNone: annotation.strictNone,
      preservation: {
        intent: annotation.preservation?.intent ?? true,
        facts: annotation.preservation?.facts ?? true,
        commitments: annotation.preservation?.commitments ?? true,
        uncertainty: annotation.preservation?.certainty ?? true,
      },
      reviewerState:
        annotation.reviewState === "ACCEPTED"
          ? "EXPOSED_DEVELOPMENT_EVIDENCE"
          : "PENDING_HUMAN_REVIEW",
    });
    if (checked.strictNone && annotation.primary.length)
      throw Error("Strict NONE has primary target.");
    if (scenario.fixedAction === "NO_REPLY_NEEDED" && !annotation.strictNone)
      throw Error("Non-wording action cannot carry a capability label.");
  }
  return { raw, annotations: file.annotations };
}

export async function loadSrs3Corpus(): Promise<Srs3Corpus> {
  const [manifestBytes, triageBytes, annotationBytes, authoringBytes, rawBytes, catalogBytes] =
    await Promise.all([
      readFile(resolve(root, manifestPath)),
      readFile(resolve(root, triagePath)),
      readFile(resolve(root, annotationPath)),
      readFile(resolve(root, authoringPath)),
      readFile(resolve(root, rawPath)),
      readFile(resolve(root, catalogPath)),
    ]);
  const manifestSha256 = sha256(manifestBytes);
  if (manifestSha256 !== FROZEN_SRS3A_MANIFEST_SHA256) throw Error("SRS-3A manifest drift.");
  const manifest = JSON.parse(manifestBytes.toString("utf8")) as {
    evidenceRecords: ManifestEvidence[];
  };
  const eligible = manifest.evidenceRecords.filter(
    (record) => record.conversionOutcome === "EVALUATION_LABEL_SOURCE",
  );
  if (
    eligible.length !== 69 ||
    eligible.some((record) => record.lane !== "CAPABILITY" || record.exclusionReasonCodes.length)
  )
    throw Error("SRS-3A eligibility drift.");
  const triage = validateSourceTriage(
    JSON.parse(triageBytes.toString("utf8")),
    eligible,
    manifestSha256,
  );
  const annotationFile = AnnotationFileSchema.parse(JSON.parse(annotationBytes.toString("utf8")));
  if (
    annotationFile.manifestSha256.toLowerCase() !== manifestSha256 ||
    annotationFile.rawSourceSha256.toLowerCase() !== sha256(rawBytes) ||
    annotationFile.rawSetSha256.toLowerCase() !== sha256(JSON.stringify(srs3RawScenarios)) ||
    annotationFile.catalogManifestSha256.toLowerCase() !== sha256(catalogBytes) ||
    annotationFile.triageSha256.toLowerCase() !== sha256(triageBytes)
  )
    throw Error("Corpus source digest drift.");
  const productionCatalog = await buildSrs2Catalog("PRODUCTION");
  const { raw, annotations } = validateRankingCorpus(
    srs3RawScenarios,
    annotationFile,
    manifest.evidenceRecords,
    productionCatalog,
  );
  const authoring = validateSrs3AuthoringMetadata(JSON.parse(authoringBytes.toString("utf8")), raw);
  for (const annotation of annotations) {
    const source = annotation.source ?? annotationFile.provenance;
    if (source.sourceKind !== "PHASE8A_ADAPTED") continue;
    const decision = triage.entries.find((entry) => entry.lineageId === source.sourceLineage);
    if (
      decision?.disposition !== "ADAPT_TO_RANKING_CASE" ||
      decision.proposedScenarioId !== annotation.id
    )
      throw Error(`Adapted case lacks a bound triage decision: ${annotation.id}`);
  }
  return {
    raw,
    annotations,
    authoring,
    triage,
    bindings: {
      manifestSha256,
      rawSourceSha256: sha256(rawBytes),
      rawSetSha256: sha256(JSON.stringify(raw)),
      annotationFileSha256: sha256(annotationBytes),
      authoringMetadataSha256: sha256(authoringBytes),
      catalogManifestSha256: sha256(catalogBytes),
      triageSha256: sha256(triageBytes),
    },
  };
}

export function observeSrs3RawOnly(
  scenario: Srs3RawScenario,
  catalog: readonly Srs2CatalogEntry[],
) {
  const raw = Srs3RawScenarioSchema.parse(scenario);
  const selected = raw.request.selection?.kind === "ACTION" ? raw.request.selection.intent : null;
  const policy: CoachingPolicyDecision = {
    action: raw.fixedAction,
    userIntent: {
      value:
        selected ??
        (raw.request.analysis.draft.text
          ? "Preserve the visible draft's meaning."
          : "Respond to the visible conversation."),
      confidence: 1,
    },
    actionConfidence: 1,
    ambiguity: { material: false, reason: null },
  };
  const normalized = deriveSkillContextForProfile(raw.request, policy, "SRS_2_5_PROPOSED", {
    experimentalCandidateRouting: false,
  });
  const context = SkillContextSchema.parse(normalized.context);
  const result = runSrs2ShadowRetrieval(
    context,
    {
      mode: "SIGNAL_ONLY",
      topK: 10,
      catalogScope: "PRODUCTION",
    },
    catalog,
  );
  return { context, signals: normalized.signals, result };
}

export function summarizeSrs3Coverage(corpus: Srs3Corpus) {
  const byId = new Map(corpus.raw.map((item) => [item.id, item]));
  const accepted = corpus.annotations.filter((item) => item.reviewState === "ACCEPTED");
  const quarantined = corpus.annotations.filter((item) => item.reviewState === "QUARANTINE");
  const authoringById = new Map(corpus.authoring.cases.map((item) => [item.id, item]));
  const count = (
    group: readonly (typeof corpus.annotations)[number][],
    predicate: (raw: Srs3RawScenario) => boolean,
  ) => group.filter((item) => predicate(byId.get(item.id)!)).length;
  return {
    schemaVersion: 1,
    phase: "SRS-3B",
    evidenceUse: "EXPOSED_DEVELOPMENT_ONLY",
    bindings: corpus.bindings,
    sourceTriage: corpus.triage.dispositions,
    rawScenarios: corpus.raw.length,
    distinctFamilies: new Set(corpus.raw.map((item) => item.scenarioFamily)).size,
    accepted: accepted.length,
    acceptedFamilies: new Set(accepted.map((item) => item.scenarioFamily)).size,
    quarantined: quarantined.length,
    acceptedRewrite: count(accepted, (raw) => raw.fixedAction === "REWRITE_DRAFT"),
    acceptedEmptyDraftSuggest: count(accepted, (raw) => raw.fixedAction === "SUGGEST_REPLY"),
    acceptedNonWording: count(accepted, (raw) => raw.fixedAction === "NO_REPLY_NEEDED"),
    acceptedStrictNone: accepted.filter((item) => item.strictNone).length,
    acceptedMultiRequired: accepted.filter((item) => item.required.length > 1).length,
    acceptedMultiRequiredNoOrder: accepted.filter(
      (item) => item.required.length > 1 && !item.primary.length && !item.shouldRankAbove.length,
    ).length,
    acceptedPrimaryLabels: accepted.reduce((sum, item) => sum + item.primary.length, 0),
    acceptedPairOrders: accepted.reduce((sum, item) => sum + item.shouldRankAbove.length, 0),
    acceptedBoundaryExplicitness: Object.fromEntries(
      ["REWRITE_DRAFT", "SUGGEST_REPLY", "NO_REPLY_NEEDED"].map((action) => [
        action,
        {
          EXPLICIT: accepted.filter(
            (item) =>
              byId.get(item.id)?.fixedAction === action &&
              authoringById.get(item.id)?.boundaryExplicitness === "EXPLICIT",
          ).length,
          IMPLICIT: accepted.filter(
            (item) =>
              byId.get(item.id)?.fixedAction === action &&
              authoringById.get(item.id)?.boundaryExplicitness === "IMPLICIT",
          ).length,
        },
      ]),
    ),
    draftRealism: Object.fromEntries(
      ["ROUGH", "NORMAL", "ALREADY_DECENT", "OVER_POLISHED"].map((quality) => [
        quality,
        corpus.authoring.cases.filter((item) => item.draftRealism === quality).length,
      ]),
    ),
    priorityPairCoverage: priorityPairs.map(([a, b]) => ({
      a,
      b,
      aPrimary: accepted.filter(
        (item) => item.primary.includes(a) && [...item.required, ...item.acceptable].includes(b),
      ).length,
      bPrimary: accepted.filter(
        (item) => item.primary.includes(b) && [...item.required, ...item.acceptable].includes(a),
      ).length,
      aHardNegative: accepted.filter(
        (item) => item.primary.includes(a) && item.forbidden.includes(b),
      ).length,
      bHardNegative: accepted.filter(
        (item) => item.primary.includes(b) && item.forbidden.includes(a),
      ).length,
      aAboveB: accepted.filter((item) =>
        item.shouldRankAbove.some(([higher, lower]) => higher === a && lower === b),
      ).length,
      bAboveA: accepted.filter((item) =>
        item.shouldRankAbove.some(([higher, lower]) => higher === b && lower === a),
      ).length,
      bothValidNoOrder: accepted.filter(
        (item) =>
          item.primary.length === 0 &&
          item.shouldRankAbove.length === 0 &&
          item.required.includes(a) &&
          item.required.includes(b),
      ).length,
    })),
    language: Object.fromEntries(
      LanguageGroupSchema.options.map((group) => [
        group,
        {
          raw: count(corpus.annotations, (raw) => raw.languageGroup === group),
          accepted: count(accepted, (raw) => raw.languageGroup === group),
        },
      ]),
    ),
    setting: Object.fromEntries(
      SettingSchema.options.map((setting) => [
        setting,
        {
          raw: count(corpus.annotations, (raw) => raw.setting === setting),
          accepted: count(accepted, (raw) => raw.setting === setting),
        },
      ]),
    ),
    heldOut: { status: "NOT_AUTHORED", read: false, scored: false },
    baselineCalculated: false,
  };
}
