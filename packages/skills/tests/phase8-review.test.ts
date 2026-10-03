import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { CoachingSelectionSchema, SkillIntentTagSchema } from "@ai-message-coach/contracts";
import { describe, expect, it } from "vitest";
import { ManifestSchema } from "../authoring/schema.js";
import {
  contentDigest,
  loadAuthoringRegistry,
  packageRoot,
  parseYaml,
  renderRegistry,
} from "../authoring/generator.js";
import { initialSkillRegistry } from "../src/index.js";
import {
  prepareReviewInventory,
  ReviewRowSchema,
  sameReviewRevision,
  validateCurrentReviewRows,
} from "./phase8-review.js";

const root = resolve(packageRoot, "../..");
const json = async (name: string) =>
  JSON.parse(await readFile(new URL("./fixtures/phase8/" + name, import.meta.url), "utf8"));
const snapshot = await json("source-snapshot.json");
const saved = await json("example-review-ledger.json");
const modes = await json("mode-coverage-proposals.json");
const { records } = await loadAuthoringRegistry();
const manifest = ManifestSchema.parse(
  parseYaml(await readFile(resolve(packageRoot, "definitions/approved-manifest.yaml"), "utf8")),
);
const sources = Object.fromEntries(
  await Promise.all(
    manifest.entries.map(async (entry) => {
      const path = "packages/skills/definitions/" + entry.source;
      return [entry.id, { path, text: await readFile(resolve(root, path), "utf8") }];
    }),
  ),
);
const current = prepareReviewInventory(records, sources);

describe("Phase 8A review preparation, never human approval", () => {
  it("has exactly 210 original keys and deterministic revision-bound provisional findings", () => {
    expect(saved).toEqual(current);
    expect(validateCurrentReviewRows(saved.rows, current.rows)).toHaveLength(210);
    expect(new Set(current.rows.map((row) => row.key)).size).toBe(210);
    for (const [category, count] of [
      ["POSITIVE", 63],
      ["NEGATIVE", 63],
      ["NEIGHBOR", 42],
      ["APPLICATION", 42],
    ] as const)
      expect(current.rows.filter((row) => row.category === category)).toHaveLength(count);
    expect(current.rows.filter((row) => row.action === "REWRITE_DRAFT")).toHaveLength(42);
    expect(current.rows.filter((row) => row.action === "SUGGEST_REPLY")).toHaveLength(162);
    expect(current.rows.filter((row) => !row.intentSupplied)).toHaveLength(33);
  });
  it("forbids invented reviewer identities, dates, dispositions and approved states", () => {
    const row = current.rows[0]!;
    for (const patch of [
      { state: "APPROVED" },
      { reviewer: "Invented human" },
      { date: "2026-09-19" },
      { disposition: "KEEP" },
      { competence: ["English"] },
    ]) {
      expect(() =>
        ReviewRowSchema.parse({ ...row, humanReview: { ...row.humanReview, ...patch } }),
      ).toThrow();
    }
    expect(saved.humanApprovalCount).toBe(0);
    expect(current.rows.every((row) => row.assessment.authority === "AUTOMATED_PROVISIONAL")).toBe(
      true,
    );
  });
  it("rejects duplicate, missing or unknown keys", () => {
    expect(() => validateCurrentReviewRows(saved.rows.slice(1), current.rows)).toThrow();
    const duplicate = structuredClone(saved.rows);
    duplicate[1] = duplicate[0];
    expect(() => validateCurrentReviewRows(duplicate, current.rows)).toThrow();
    const unknown = structuredClone(saved.rows);
    unknown[0].key = "missing/P1";
    expect(() => validateCurrentReviewRows(unknown, current.rows)).toThrow();
  });
  it.each(["category", "action", "language", "intentSupplied"] as const)(
    "rejects copied factual field tampering: %s",
    (field) => {
      const changed = structuredClone(saved.rows);
      if (field === "category") changed[0].category = "APPLICATION";
      if (field === "action") changed[0].action = "REWRITE_DRAFT";
      if (field === "language")
        changed[0].language = { primary: "zh-Hant", secondary: "en", codeSwitching: true };
      if (field === "intentSupplied") changed[0].intentSupplied = !changed[0].intentSupplied;
      expect(() => validateCurrentReviewRows(changed, current.rows)).toThrow(/Stale/);
    },
  );
  it("rejects stale item/definition revisions while leaving provisional assessments editable", () => {
    const changed = structuredClone(saved.rows);
    changed[0].exampleDigest = contentDigest("changed case");
    expect(sameReviewRevision(changed[0], current.rows[0]!)).toBe(false);
    expect(() => validateCurrentReviewRows(changed, current.rows)).toThrow(/Stale/);
    changed[0] = structuredClone(saved.rows[0]);
    changed[0].definitionDigest = contentDigest("changed definition boundary");
    expect(sameReviewRevision(changed[0], current.rows[0]!)).toBe(false);
    expect(() => validateCurrentReviewRows(changed, current.rows)).toThrow(/Stale/);
    changed[0] = structuredClone(saved.rows[0]);
    changed[0].assessment.proposedDisposition = "REVISE_AND_REVIEW";
    expect(() => validateCurrentReviewRows(changed, current.rows)).not.toThrow();
  });
  it("distinguishes narrow item equality from record/neighbor binding and source traceability", () => {
    const changed = structuredClone(saved.rows);
    changed[0].recordDigest = contentDigest("changed neighbor or conceptual distinction");
    expect(sameReviewRevision(changed[0], current.rows[0]!)).toBe(true);
    expect(() => validateCurrentReviewRows(changed, current.rows)).toThrow(/Stale/);
    changed[0] = structuredClone(saved.rows[0]);
    changed[0].source.line += 1;
    expect(() => validateCurrentReviewRows(changed, current.rows)).toThrow(/Stale/);
  });
  it("binds every example's source and runtime record to the untouched 8A start", () => {
    for (const row of current.rows) {
      const baseline = snapshot.definitions.find(
        (record: { id: string }) => record.id === row.key.split("/")[0],
      );
      expect(row.definitionDigest).toBe(baseline.definitionDigest);
      expect(row.recordDigest).toBe(baseline.recordDigest);
      expect(row.exampleSetDigest).toBe(baseline.exampleSetDigest);
      expect(row.source.rawSha256).toBe(snapshot.files[row.source.path]);
    }
  });
  it("allocates an explicit 63-case pilot and stratified second-review audit without approving unseen rows", () => {
    expect(new Set(saved.calibrationKeys).size).toBe(63);
    for (const record of records)
      for (const caseId of ["N1", "H1", "A1"])
        expect(saved.calibrationKeys).toContain(record.definition.id + "/" + caseId);
    expect(new Set(saved.secondReview.mandatoryKeys).size).toBe(84);
    expect(saved.secondReview.poolKeys).toHaveLength(126);
    expect(saved.secondReview.auditKeys).toHaveLength(28);
    for (const key of saved.secondReview.auditKeys) {
      expect(saved.secondReview.poolKeys).toContain(key);
      expect(saved.secondReview.mandatoryKeys).not.toContain(key);
    }
    expect(saved.secondReview.state).toBe("PROPOSED_AWAITING_HUMAN_CONFIRMATION");
    expect(
      saved.rows.every(
        (row: { humanReview: { state: string } }) =>
          row.humanReview.state === "PENDING_HUMAN_REVIEW",
      ),
    ).toBe(true);
  });
  it("retains advisory duplicate and semantic flags without merging or fabricating decisions", () => {
    expect(saved.duplicates.exactContextGroups).toHaveLength(3);
    expect(saved.duplicates.nearContextPairs).toHaveLength(1);
    const flagged = current.rows.filter(
      (row) => row.assessment.evidence === "POTENTIAL_UNSUPPORTED_MEANING",
    );
    expect(flagged.map((row) => row.key).sort()).toEqual(
      [
        "boundary_setting/A2",
        "de_escalation/A2",
        "clarification/A1",
        "en.direct_but_polite/A1",
        "reassurance/A1",
      ].sort(),
    );
    const target = current.rows.find((row) => row.key === "zh.politeness_calibration/A2")!;
    expect(target.assessment.evidence).not.toBe("POTENTIAL_UNSUPPORTED_MEANING");
    expect(target.assessment.findings.some((f) => f.code === "SCRIPT_TARGET_EXPLICIT")).toBe(true);
  });
});

describe("Phase 8A mode coverage proposal boundaries", () => {
  it("covers the eight requested existing skills and three hypotheses without pretending execution", () => {
    const ids = modes.families.map((family: { capability: string }) => family.capability);
    expect(ids).toEqual([
      "apology",
      "emotional_validation",
      "boundary_setting",
      "decline",
      "request",
      "status_update",
      "expectation_setting",
      "clarification",
      "perspective_acknowledgement",
      "confirmation",
      "give_constructive_feedback",
    ]);
    expect(modes.status).toBe("PROPOSED_FOR_HUMAN_REVIEW_NOT_EXECUTED");
    expect(modes.partition).toBe("EXPOSED_DEVELOPMENT_PLANNING_NOT_HELD_OUT");
    for (const family of modes.families) {
      expect(family.rewrite.draft.trim().length).toBeGreaterThan(0);
      expect(family.rewrite.selection).toBeNull();
      expect(family.generate.draft).toBeNull();
      expect(CoachingSelectionSchema.safeParse(family.generate.selection).success).toBe(true);
      expect(family.rewrite.messages).toEqual(family.generate.messages);
      expect(family.rewrite.observedAction).toBeNull();
      expect(family.generate.observedAction).toBeNull();
      expect(family.informationLossControl.observedAction).toBeNull();
      expect(family.humanDecision).toBeNull();
    }
    expect(SkillIntentTagSchema.safeParse("acknowledge_perspective").success).toBe(true);
    expect(SkillIntentTagSchema.safeParse("give_feedback").success).toBe(true);
    expect(SkillIntentTagSchema.safeParse("confirm_understanding").success).toBe(false);
  });
  it("keeps Chinese/negative/neighbor/NONE pair expansion visibly unrun and all seven modifiers in scope", () => {
    expect(modes.languageExpansion.modifierTargets).toHaveLength(7);
    expect(modes.languageExpansion.state).toBe("NOT_AUTHORED_NOT_REVIEWED");
    expect(modes.additionalContrasts.state).toBe("PLANNED_NOT_AUTHORED");
    expect(modes.additionalContrasts.regressionActions).toContain("COMPLETE_DRAFT");
  });
  it("preserves production bytes and the two Phase 7 historical evidence files", async () => {
    expect(initialSkillRegistry).toHaveLength(21);
    expect(initialSkillRegistry.every((skill) => skill.status === "ACTIVE")).toBe(true);
    expect(contentDigest(initialSkillRegistry)).toBe(snapshot.runtimeRegistryDigest);
    for (const path of [
      "packages/skills/definitions/approved-manifest.yaml",
      "packages/skills/src/generated/approved-registry.ts",
      "packages/skills/tests/fixtures/pre-migration.json",
      "packages/skills/authoring/baseline-approvals.json",
    ]) {
      const bytes = await readFile(resolve(root, path));
      expect(createHash("sha256").update(bytes).digest("hex"), path).toBe(snapshot.files[path]);
    }
    expect(await renderRegistry()).toBe(
      await readFile(resolve(packageRoot, "src/generated/approved-registry.ts"), "utf8"),
    );
  });
});
