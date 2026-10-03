import { createHash } from "node:crypto";
import { readFile, readdir } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { CommunicationGuidanceSchema, SkillIntentTagSchema } from "@ai-message-coach/contracts";
import {
  contentDigest,
  loadAuthoringRegistry,
  packageRoot,
  renderRegistry,
} from "../authoring/generator.js";
import { initialSkillRegistry } from "../src/index.js";

const root = resolve(packageRoot, "../..");
const dir = resolve(packageRoot, "tests/fixtures/phase8");
const read = (path: string) => readFile(resolve(root, path), "utf8");
const json = async (name: string): Promise<unknown> =>
  JSON.parse(await readFile(resolve(dir, name), "utf8"));
const text = z.string().min(1);
const digest = z.string().regex(/^sha256:[a-f0-9]{64}$/u);
const object = z.record(z.string(), z.unknown());
const Source = z
  .object({ path: text, line: z.number().int().positive(), text, digest })
  .passthrough();
const Proposed = z
  .object({
    context: text,
    intent: text,
    expected: z.array(text),
    acceptable: z.array(text),
    forbidden: z.array(text),
    draft: text.optional(),
    improved: text.optional(),
    ledger: z
      .object({
        facts: z.array(text).min(1),
        commitments: z.array(text),
        uncertainty: z.array(text),
      })
      .optional(),
  })
  .strict();
const Example = z
  .object({
    id: z.enum(["P1", "P2", "P3", "N1", "N2", "N3", "H1", "H2", "A1", "A2"]),
    judgment: z.enum(["KEEP", "REVISE"]),
    finding: text,
    source: Source,
    proposed: Proposed,
    proposalKind: z.enum(["STRUCTURED_CANONICAL_EXPANSION", "NEW_SYNTHETIC_REVISION"]),
    proposalDigest: digest,
    evidenceUse: z.literal("EXPOSED_CANONICAL_REVIEW_ONLY"),
  })
  .strict();
const Candidate = z
  .object({
    id: z.enum(["perspective_acknowledgement", "confirmation", "give_constructive_feedback"]),
    revision: z.literal(1),
    researchState: z.literal("DRAFT"),
    decision: z.enum(["CONTINUE", "REVISE", "REJECT", "DEFER"]),
    humanExperimentPermission: z.literal("PENDING"),
    oneJob: text,
    evidencePrerequisites: z.array(text).min(3),
    constraints: z.object({
      ownership: text,
      facts: text,
      commitments: text,
      certainty: text,
      action: text,
    }),
    guidance: CommunicationGuidanceSchema,
    guidanceChanges: z.array(text).min(1),
    decisionReason: text,
    falsification: z.array(text).min(3),
    modeApplicability: z.object({ REWRITE_DRAFT: text, SUGGEST_REPLY: text, COMPLETE_DRAFT: text }),
    compositions: z.array(z.object({ ids: z.array(text), when: text, assessment: text })).min(1),
    additionalNeighbors: z.array(z.object({ id: text, reason: text })),
    modifierRisk: text,
    duplicates: text,
    examples: z.array(Example).length(10),
    sourceCard: Source,
    definitionBindings: z.record(z.string(), digest),
    phase8ABindings: z.object({
      approvalSetDigest: digest,
      originalSemanticReviewSha256: text,
      remediationSha256: text,
      rereviewSha256: text,
    }),
    neighborMatrixDigest: digest,
    revisionDigest: digest,
  })
  .strict();
const Matrix = z
  .object({
    candidate: text,
    existing: text,
    contrasts: z.object({
      candidateOnly: text,
      existingOnly: text,
      ambiguous: text,
      bothValid: text,
      neitherValid: text,
    }),
    conclusion: text,
    evidenceUse: z.literal("SCHEMATIC_BOUNDARY_ANALYSIS_NOT_SELECTION_CASES"),
  })
  .strict();
const dossiers = z
  .object({
    candidates: z.array(Candidate).length(3),
    neighborMatrix: z.array(Matrix).length(12),
    dossierSetDigest: digest,
    productionRegistryDigest: digest,
    candidateActivation: z.literal(false),
    heldOutOrSelectionEvaluation: z.literal(false),
    humanExperimentPermission: z.literal("PENDING"),
    sources: z
      .object({
        phase3: z.object({ path: text, rawSha256: text }),
        phase5: z.object({ path: text, rawSha256: text }),
      })
      .passthrough(),
    representability: z.object({ candidateIntentProposals: z.array(text) }).passthrough(),
  })
  .passthrough()
  .parse(await json("candidate-dossiers.json"));
const ApprovalRow = z
  .object({
    key: text,
    group: z.enum([
      "ORIGINAL_CLEAN_KEEP_AUDIT",
      "REVISED_EXAMPLE_AUDIT",
      "CONSERVATIVE_ORIGINAL_RESOLUTION",
    ]),
    decision: z.literal("ACCEPT"),
    reviewedRevision: z.enum(["ORIGINAL_CANONICAL", "REPLACEMENT_REVISION_1"]),
    reviewedContent: object,
    reviewedContentDigest: digest,
    definitionDigest: digest,
    originalReviewRowDigest: digest,
    remediationRowDigest: digest.nullable(),
    secondReviewRowDigest: digest.nullable(),
    originalDisposition: text,
    originalGoldApproved: z.boolean(),
    conservativeResolution: text.nullable(),
    humanApproval: z.literal(true),
    approvalDigest: digest,
  })
  .strict();
const approval = z
  .object({
    reviewerType: z.literal("HUMAN_USER"),
    rows: z.array(ApprovalRow).length(34),
    approvalSetDigest: digest,
    sourceBindings: z.record(z.string(), text),
    reviewer: z
      .object({
        identity: z.literal("User"),
        name: z.null(),
        languageQualifications: z.null(),
        independentReviewerQualifications: z.null(),
      })
      .passthrough(),
    scope: z
      .object({
        uniqueReviewedKeys: z.literal(34),
        otherOriginalKeysNotIndividuallyHumanReviewed: z.literal(176),
        all210HumanReviewed: z.literal(false),
      })
      .passthrough(),
    gate: z
      .object({
        phase8A: z.literal("FOCUSED_GATE_ACCEPTED"),
        phase8B: z.literal("AUTHORIZED"),
        phase8C: z.literal("NOT_AUTHORIZED"),
        candidateExperimentPermission: z.literal("PENDING"),
        canonicalAdoption: z.literal(false),
        runtimeApprovalChanged: z.literal(false),
      })
      .passthrough(),
  })
  .passthrough()
  .parse(await json("focused-human-approval.json"));
const historySchema = z
  .object({
    rows: z.array(
      z
        .object({
          key: text,
          originalExample: object,
          source: z.object({ definitionDigest: digest }).passthrough(),
        })
        .passthrough(),
    ),
    audit: z.object({ selectedKeys: z.array(text) }).passthrough(),
  })
  .passthrough();
const history = historySchema.parse(await json("codex-semantic-review.json"));
const remediation = z
  .object({
    rows: z.array(
      z
        .object({ key: text, replacement: object, unresolvedOriginalQuestion: text.nullable() })
        .passthrough(),
    ),
  })
  .passthrough()
  .parse(await json("weak-invalid-remediation.json"));
const rereview = z
  .object({
    rows: z.array(z.object({ key: text }).passthrough()),
    audit: z.object({ selectedKeys: z.array(text) }).passthrough(),
  })
  .passthrough()
  .parse(await json("weak-invalid-rereview.json"));
const { records, registry } = await loadAuthoringRegistry();
const rawDigest = (value: string) => createHash("sha256").update(value).digest("hex");
const without = (value: Record<string, unknown>, key: string) =>
  Object.fromEntries(Object.entries(value).filter(([name]) => name !== key));

function verifyApprovalRow(row: z.infer<typeof ApprovalRow>) {
  const original = history.rows.find((item) => item.key === row.key)!;
  const replacement = remediation.rows.find((item) => item.key === row.key);
  const second = rereview.rows.find((item) => item.key === row.key);
  expect(contentDigest(original)).toBe(row.originalReviewRowDigest);
  expect(row.definitionDigest).toBe(original.source.definitionDigest);
  expect(contentDigest(row.reviewedContent)).toBe(row.reviewedContentDigest);
  expect(row.reviewedContent).toEqual(
    row.reviewedRevision === "ORIGINAL_CANONICAL"
      ? original.originalExample
      : replacement?.replacement,
  );
  expect(row.remediationRowDigest).toBe(
    row.reviewedRevision === "ORIGINAL_CANONICAL" ? null : contentDigest(replacement),
  );
  expect(row.secondReviewRowDigest).toBe(
    row.reviewedRevision === "ORIGINAL_CANONICAL" ? null : contentDigest(second),
  );
  expect(contentDigest(without(row, "approvalDigest"))).toBe(row.approvalDigest);
}

describe("Phase 8A scoped human approval and isolated Phase 8B dossiers", () => {
  it("binds precisely the 20 + 7 + 7 human-reviewed keys without blanket approval", () => {
    const unresolved = remediation.rows
      .filter((row) => row.unresolvedOriginalQuestion)
      .map((row) => row.key);
    const expectedGroups = {
      ORIGINAL_CLEAN_KEEP_AUDIT: history.audit.selectedKeys,
      REVISED_EXAMPLE_AUDIT: rereview.audit.selectedKeys,
      CONSERVATIVE_ORIGINAL_RESOLUTION: unresolved,
    };
    for (const [group, keys] of Object.entries(expectedGroups))
      expect(
        approval.rows
          .filter((row) => row.group === group)
          .map((row) => row.key)
          .sort(),
      ).toEqual([...keys].sort());
    expect(new Set(approval.rows.map((row) => row.key)).size).toBe(34);
    expect(contentDigest(approval.rows)).toBe(approval.approvalSetDigest);
    for (const row of approval.rows) {
      verifyApprovalRow(row);
      expect(row.originalGoldApproved).toBe(row.group === "ORIGINAL_CLEAN_KEEP_AUDIT");
      if (row.group === "CONSERVATIVE_ORIGINAL_RESOLUTION")
        expect(row.conservativeResolution).not.toBeNull();
    }
    expect(
      approval.rows.filter(
        (row) =>
          row.group === "CONSERVATIVE_ORIGINAL_RESOLUTION" &&
          row.originalDisposition === "QUARANTINE",
      ),
    ).toHaveLength(6);
    const pair = approval.rows.find((row) => row.key === "expectation_setting/H2")!;
    expect(pair.reviewedContent.expected).toEqual(["boundary_setting", "expectation_setting"]);
    expect(pair.conservativeResolution).toContain("9-to-5");
  });

  it("rejects stale approved content, review bindings and definition bindings", () => {
    const row = approval.rows[0]!;
    for (const modified of [
      { ...row, reviewedContent: { ...row.reviewedContent, userIntent: "Different intent" } },
      { ...row, originalReviewRowDigest: "sha256:" + "0".repeat(64) },
      { ...row, definitionDigest: "sha256:" + "0".repeat(64) },
    ])
      expect(() => verifyApprovalRow(modified)).toThrow();
  });

  it("preserves the historical reviews and source documents byte-for-byte", async () => {
    for (const [path, hash] of Object.entries(approval.sourceBindings))
      expect(rawDigest(await read(path)), path).toBe(hash);
    for (const source of [dossiers.sources.phase3, dossiers.sources.phase5])
      expect(rawDigest(await read(source.path))).toBe(source.rawSha256);
  });

  it("binds all three candidate revisions, guidance, 30 exact source excerpts and example proposals", async () => {
    expect(dossiers.candidates.map((candidate) => candidate.id)).toEqual([
      "perspective_acknowledgement",
      "confirmation",
      "give_constructive_feedback",
    ]);
    expect(contentDigest(dossiers.candidates)).toBe(dossiers.dossierSetDigest);
    const allowed = new Set([
      ...registry.map((skill) => skill.id),
      ...dossiers.candidates.map((candidate) => candidate.id),
    ]);
    for (const candidate of dossiers.candidates) {
      expect(contentDigest(without(candidate, "revisionDigest"))).toBe(candidate.revisionDigest);
      expect(candidate.phase8ABindings.approvalSetDigest).toBe(approval.approvalSetDigest);
      expect(candidate.definitionBindings).toEqual(
        Object.fromEntries(
          records.map((record) => [record.definition.id, contentDigest(record.definition)]),
        ),
      );
      expect(new Set(candidate.examples.map((example) => example.id)).size).toBe(10);
      expect(contentDigest(candidate.sourceCard.text)).toBe(candidate.sourceCard.digest);
      expect((await read(candidate.sourceCard.path)).replace(/\r\n/gu, "\n")).toContain(
        candidate.sourceCard.text.replace(/\r\n/gu, "\n"),
      );
      for (const example of candidate.examples) {
        expect(contentDigest(example.proposed)).toBe(example.proposalDigest);
        expect(contentDigest(example.source.text)).toBe(example.source.digest);
        const sourceLines = (await read(example.source.path)).split(/\r?\n/u);
        expect(sourceLines[example.source.line - 1]).toContain(example.source.text);
        const labels = [
          ...example.proposed.expected,
          ...example.proposed.acceptable,
          ...example.proposed.forbidden,
        ];
        expect(new Set(labels).size).toBe(labels.length);
        expect(labels.every((id) => allowed.has(id))).toBe(true);
        if (example.id.startsWith("A")) {
          expect(example.proposed.draft).toBeTruthy();
          expect(example.proposed.improved).toBeTruthy();
          expect(example.proposed.ledger?.facts.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it("retains twelve explicit five-way neighbor analyses, including nested overlap", () => {
    expect(
      new Set(dossiers.neighborMatrix.map((row) => row.candidate + "/" + row.existing)).size,
    ).toBe(12);
    for (const candidate of dossiers.candidates)
      expect(
        contentDigest(dossiers.neighborMatrix.filter((row) => row.candidate === candidate.id)),
      ).toBe(candidate.neighborMatrixDigest);
    expect(
      dossiers.neighborMatrix.find(
        (row) => row.candidate === "confirmation" && row.existing === "request",
      )?.contrasts.candidateOnly,
    ).toContain("Not established");
    expect(dossiers.candidates.find((candidate) => candidate.id === "confirmation")?.decision).toBe(
      "DEFER",
    );
    expect(
      dossiers.candidates
        .find((candidate) => candidate.id === "perspective_acknowledgement")
        ?.examples.find((example) => example.id === "A2")?.proposed.improved,
    ).toContain("That wasn't what I meant.");
  });

  it("keeps the exact production21, pending canonical examples and generated bytes", async () => {
    expect(initialSkillRegistry).toEqual(registry);
    expect(contentDigest(registry)).toBe(dossiers.productionRegistryDigest);
    expect(registry).toHaveLength(21);
    expect(records.every((record) => record.review.examples.state === "PENDING_HUMAN_REVIEW")).toBe(
      true,
    );
    expect(await read("packages/skills/src/generated/approved-registry.ts")).toBe(
      await renderRegistry(),
    );
    const representedExperimentIntents = new Set(["acknowledge_perspective", "give_feedback"]);
    for (const intent of dossiers.representability.candidateIntentProposals)
      expect(SkillIntentTagSchema.safeParse(intent).success).toBe(
        representedExperimentIntents.has(intent),
      );
  });

  it("keeps research fixtures out of production sources and package/build entry points", async () => {
    for (const area of [
      "packages/skills/src",
      "packages/ai/src",
      "packages/contracts/src",
      "apps/api/src",
      "apps/desktop/src",
    ]) {
      const base = resolve(root, area);
      const files = (await readdir(base, { recursive: true })).filter(
        (path) => /\.(?:ts|tsx)$/u.test(path) && !/\.test\./u.test(path),
      );
      for (const file of files) {
        const source = await readFile(resolve(base, file), "utf8");
        expect(source, area + "/" + file).not.toMatch(
          /candidate-dossiers|focused-human-approval|phase8b-baseline|phase8b-integrity/u,
        );
      }
    }
    const pkg = JSON.parse(await read("packages/skills/package.json")) as {
      files: string[];
      exports: Record<string, unknown>;
    };
    expect(pkg.files).toEqual(["dist"]);
    expect(Object.keys(pkg.exports)).toEqual(["."]);
    const config = JSON.parse(await read("packages/skills/tsconfig.json")) as { include: string[] };
    expect(config.include).toEqual(["src"]);
  });
});
