// Private Phase 8A review preparation. No production import and no human-approval operation.
import { createHash } from "node:crypto";
import { z } from "zod";
import { AgentActionSchema, SkillContextSchema } from "@ai-message-coach/contracts";
import { contentDigest } from "../authoring/generator.js";
import type { AuthoringRecord } from "../authoring/schema.js";

const digest = z.string().regex(/^sha256:[a-f0-9]{64}$/);
const RevisionBindingSchema = z
  .object({
    key: z.string().min(1),
    exampleDigest: digest,
    definitionDigest: digest,
  })
  .strict();
const findingSchema = z
  .object({
    code: z.string().min(1),
    detail: z.string().min(1),
  })
  .strict();
export const ReviewRowSchema = RevisionBindingSchema.extend({
  recordDigest: digest,
  exampleSetDigest: digest,
  category: z.enum(["POSITIVE", "NEGATIVE", "NEIGHBOR", "APPLICATION"]),
  source: z
    .object({
      path: z.string().min(1),
      line: z.number().int().positive(),
      rawSha256: z.string().length(64),
    })
    .strict(),
  language: SkillContextSchema.shape.language,
  action: AgentActionSchema,
  intentSupplied: z.boolean(),
  assessment: z
    .object({
      authority: z.literal("AUTOMATED_PROVISIONAL"),
      evidence: z.enum([
        "NO_AUTOMATIC_DEFECT_FOUND",
        "HUMAN_CHECK_REQUIRED",
        "POTENTIAL_UNSUPPORTED_MEANING",
      ]),
      boundary: z.enum([
        "FOCAL_POSITIVE",
        "FOCAL_NEGATIVE_NOT_GLOBAL_NONE",
        "NEIGHBOR_REQUIRES_ADJUDICATION",
        "APPLICATION_REQUIRES_LEDGER_REVIEW",
      ]),
      specification: z.literal("AUTHORING_INTENT_ONLY"),
      proposedDisposition: z.enum(["KEEP_FOR_REVIEW", "REVISE_AND_REVIEW"]),
      futureUse: z.literal("AUTHORING_ONLY_NOT_HELD_OUT"),
      findings: z.array(findingSchema),
    })
    .strict(),
  humanReview: z
    .object({
      state: z.literal("PENDING_HUMAN_REVIEW"),
      reviewer: z.null(),
      competence: z.array(z.never()),
      date: z.null(),
      disposition: z.null(),
      adjudication: z.null(),
      priorDecisionRefs: z.array(z.never()),
    })
    .strict(),
}).strict();
export type ReviewRow = z.infer<typeof ReviewRowSchema>;
type Binding = z.infer<typeof RevisionBindingSchema>;
export function sameReviewRevision(recorded: Binding, current: Binding): boolean {
  // Narrow item+definition equality only: full inventory/boundary binding additionally
  // checks recordDigest (including neighbors/conceptual notes) and source identity below.
  // Neither equality check is sufficient for human approval.
  return (
    recorded.key === current.key &&
    recorded.exampleDigest === current.exampleDigest &&
    recorded.definitionDigest === current.definitionDigest
  );
}

const semanticSeeds: Record<string, string> = {
  "boundary_setting/A2":
    "A chosen no-more-lending limit becomes inability (not able). Reviewer must decide whether inability is supported or revise only the example; runtime is unchanged.",
  "de_escalation/A2":
    "The improvement asserts understanding that this is difficult. Pressure and refusal alone may not support that appraisal; review unsupported feeling/situation inference.",
  "clarification/A1":
    "Sales/budget identities occur in improved wording and the migrated ledger, but the preceding Phase 5 scenario only says two reports. Check for circular grounding from the proposed answer; do not assume ledger authorship establishes truth.",
  "en.direct_but_polite/A1":
    "The visible choice will not / not doing becomes cannot. As with boundary_setting/A2, check whether the rewrite invents inability as a reason. Supervisor raised this provisional flag; no human disposition exists.",
  "reassurance/A1":
    "The source says committed to attending too; the improvement/commitment ledger say with you / not alone. Check that accompaniment is independently supplied, rather than inferred from co-attendance or copied from the improved answer.",
};
function normalize(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}
function shingles(value: string): Set<string> {
  const chars = [...normalize(value)];
  return new Set(chars.slice(0, -2).map((_, index) => chars.slice(index, index + 3).join("")));
}
function similarity(left: string, right: string): number {
  const a = shingles(left),
    b = shingles(right);
  const union = new Set([...a, ...b]).size;
  return union ? [...a].filter((value) => b.has(value)).length / union : 0;
}

export function prepareReviewInventory(
  records: readonly AuthoringRecord[],
  sources: Record<string, { path: string; text: string }>,
) {
  const rows: ReviewRow[] = [];
  const contexts: { key: string; text: string }[] = [];
  const duplicates = new Map<string, string[]>();
  for (const record of records) {
    const source = sources[record.definition.id];
    if (!source) throw new Error("Missing source locator for " + record.definition.id);
    const sourceLines = source.text.split(/\r?\n/u);
    for (const example of [...record.examples.selection, ...record.examples.application]) {
      const key = record.definition.id + "/" + example.id;
      const line =
        sourceLines.findIndex(
          (value) => value.trim().replace(/^-\s+/u, "") === "id: " + example.id,
        ) + 1;
      if (line === 0) throw new Error("Missing source case " + key);
      const findings: { code: string; detail: string }[] = [];
      if (example.userIntent === null)
        findings.push({
          code: "INTENT_UNSPECIFIED",
          detail:
            "Intent is null. Often intentional in a negative; the reviewer must distinguish absent evidence from a supplied choice.",
        });
      if (example.category === "NEGATIVE")
        findings.push({
          code: "FOCAL_NEGATIVE_NOT_NONE",
          detail:
            "Forbidding this skill does not forbid every neighbor/modifier; do not score this incomplete canonical label as global NONE.",
        });
      if (example.category === "NEIGHBOR")
        findings.push({
          code: example.acceptable.length ? "OPTIONAL_NEIGHBOR_LABEL" : "CONCEPTUAL_NEIGHBOR",
          detail: example.acceptable.length
            ? "Only optional neighbor IDs are listed. This permits an empty set structurally and is not a complete executable gold annotation."
            : "The distinction points to an unimplemented concept or general behavior; an empty ID list is not evidence for executable NONE.",
        });
      if (example.category === "APPLICATION") {
        findings.push({
          code: "REWRITE_ONLY_EVIDENCE",
          detail:
            "This A case is REWRITE_DRAFT. It provides no independent empty-draft generation or uplift evidence.",
        });
        const anchors = [...example.improved.matchAll(/\b\d+(?:[.:]\d+)?\b/gu)].map(
          (match) => match[0],
        );
        const supported = [
          example.draft,
          example.visibleContext,
          ...example.ledger.facts,
          ...example.ledger.commitments,
          ...example.ledger.uncertainty,
        ].join(" ");
        if (anchors.some((anchor) => !supported.includes(anchor)))
          findings.push({
            code: "ANCHOR_CHECK",
            detail:
              "An output numeral lacks a literal supporting occurrence. Human semantic review is needed; words and translations can represent the same value.",
          });
        if (
          /\b(?:will|won['’]t|can['’]t|cannot|not able|certain|probably)\b|(?:确定|確定|不能|可以)/iu.test(
            example.improved,
          )
        )
          findings.push({
            code: "CERTAINTY_COMMITMENT_CHECK",
            detail:
              "Review the draft/improvement against supplied certainty, capacity and commitments. This lexical trigger is not a defect finding.",
          });
      }
      if (key === "zh.politeness_calibration/A2")
        findings.push({
          code: "SCRIPT_TARGET_EXPLICIT",
          detail:
            "The structured visible context and fact ledger explicitly supply Traditional Chinese. Provisional check closes the missing-target question; language-competent human review is still required.",
        });
      if (key === "boundary_setting/A1")
        findings.push({
          code: "CUTOFF_PRECISION_CHECK",
          detail:
            "No calls after 8 p.m. becomes before 8 p.m.; review the exact cutoff. This is a low-priority precision question, not an automatic failure or approved revision.",
        });
      if (semanticSeeds[key])
        findings.push({ code: "SEMANTIC_REVIEW_SEED", detail: semanticSeeds[key] });
      const boundary =
        example.category === "POSITIVE"
          ? "FOCAL_POSITIVE"
          : example.category === "NEGATIVE"
            ? "FOCAL_NEGATIVE_NOT_GLOBAL_NONE"
            : example.category === "NEIGHBOR"
              ? "NEIGHBOR_REQUIRES_ADJUDICATION"
              : "APPLICATION_REQUIRES_LEDGER_REVIEW";
      rows.push(
        ReviewRowSchema.parse({
          key,
          exampleDigest: contentDigest(example),
          definitionDigest: contentDigest(record.definition),
          recordDigest: contentDigest(record),
          exampleSetDigest: contentDigest(record.examples),
          category: example.category,
          source: {
            path: source.path,
            line,
            rawSha256: createHash("sha256").update(source.text).digest("hex"),
          },
          language: example.language,
          action: example.action,
          intentSupplied: example.userIntent !== null,
          assessment: {
            authority: "AUTOMATED_PROVISIONAL",
            evidence: semanticSeeds[key]
              ? "POTENTIAL_UNSUPPORTED_MEANING"
              : findings.length
                ? "HUMAN_CHECK_REQUIRED"
                : "NO_AUTOMATIC_DEFECT_FOUND",
            boundary,
            specification: "AUTHORING_INTENT_ONLY",
            proposedDisposition: semanticSeeds[key] ? "REVISE_AND_REVIEW" : "KEEP_FOR_REVIEW",
            futureUse: "AUTHORING_ONLY_NOT_HELD_OUT",
            findings,
          },
          humanReview: {
            state: "PENDING_HUMAN_REVIEW",
            reviewer: null,
            competence: [],
            date: null,
            disposition: null,
            adjudication: null,
            priorDecisionRefs: [],
          },
        }),
      );
      contexts.push({ key, text: example.sourceText });
      const normalized = normalize(example.sourceText);
      duplicates.set(normalized, [...(duplicates.get(normalized) ?? []), key]);
    }
  }
  const exactContextGroups = [...duplicates.values()].filter((group) => group.length > 1);
  const nearContextPairs: { left: string; right: string; score: number }[] = [];
  for (let i = 0; i < contexts.length; i++)
    for (let j = i + 1; j < contexts.length; j++) {
      const a = contexts[i]!,
        b = contexts[j]!;
      if (normalize(a.text) === normalize(b.text) || Math.min(a.text.length, b.text.length) < 25)
        continue;
      const score = similarity(a.text, b.text);
      if (score >= 0.72)
        nearContextPairs.push({ left: a.key, right: b.key, score: Number(score.toFixed(4)) });
    }
  const calibrationOrder = [
    "emotional_validation",
    "clarification",
    "request",
    "boundary_setting",
    "de_escalation",
    "status_update",
    "acknowledge_mistake",
    "reassurance",
    "planning",
  ];
  const ids = records
    .map((record) => record.definition.id)
    .sort((a, b) => {
      const rank = (id: string) =>
        calibrationOrder.includes(id) ? calibrationOrder.indexOf(id) : calibrationOrder.length;
      return rank(a) - rank(b) || a.localeCompare(b);
    });
  const calibrationKeys = ids.flatMap((id) => ["N1", "H1", "A1"].map((label) => id + "/" + label));
  const secondReviewMandatoryKeys = rows
    .filter(
      (row) =>
        ["NEIGHBOR", "APPLICATION"].includes(row.category) ||
        row.assessment.evidence === "POTENTIAL_UNSUPPORTED_MEANING",
    )
    .map((row) => row.key);
  const seed = "phase8a-review-audit-2026-09-19-v1";
  const pool = rows.filter((row) => !secondReviewMandatoryKeys.includes(row.key));
  const auditKeys: string[] = [];
  // Stratify by canonical category and universal/en/zh family. This proposed seed/pool
  // is frozen for inspection, not a substitute for the human workflow decision.
  for (const category of ["POSITIVE", "NEGATIVE"])
    for (const family of ["universal", "en", "zh"]) {
      const stratum = pool.filter(
        (row) =>
          row.category === category &&
          (row.key.startsWith("en.") ? "en" : row.key.startsWith("zh.") ? "zh" : "universal") ===
            family,
      );
      stratum.sort((a, b) =>
        contentDigest(seed + a.key).localeCompare(contentDigest(seed + b.key)),
      );
      auditKeys.push(...stratum.slice(0, Math.ceil(stratum.length * 0.2)).map((row) => row.key));
    }
  return {
    ledgerVersion: 1,
    assessmentDate: "2026-09-19",
    humanApprovalCount: 0,
    rows,
    calibrationKeys,
    secondReview: {
      state: "PROPOSED_AWAITING_HUMAN_CONFIRMATION",
      seed,
      mandatoryKeys: secondReviewMandatoryKeys,
      poolKeys: pool.map((row) => row.key),
      auditKeys,
    },
    duplicates: {
      method:
        "NFKC lower-case letters/numbers with punctuation normalized; exact source-context groups and advisory character-trigram Jaccard >=0.72 for contexts >=25 characters. Not semantic equivalence or automatic merging.",
      exactContextGroups,
      nearContextPairs,
    },
  };
}

export function validateCurrentReviewRows(
  input: unknown,
  current: readonly ReviewRow[],
): ReviewRow[] {
  const rows = z.array(ReviewRowSchema).parse(input);
  const byKey = new Map(current.map((row) => [row.key, row]));
  if (rows.length !== current.length || new Set(rows.map((row) => row.key)).size !== rows.length)
    throw new Error("Review inventory must contain every original key exactly once.");
  for (const row of rows) {
    const now = byKey.get(row.key);
    if (
      !now ||
      !sameReviewRevision(row, now) ||
      row.recordDigest !== now.recordDigest ||
      row.exampleSetDigest !== now.exampleSetDigest ||
      row.source.rawSha256 !== now.source.rawSha256 ||
      row.source.path !== now.source.path ||
      row.source.line !== now.source.line ||
      row.category !== now.category ||
      row.action !== now.action ||
      row.intentSupplied !== now.intentSupplied ||
      contentDigest(row.language) !== contentDigest(now.language)
    )
      throw new Error("Stale review evidence or locator: " + row.key);
  }
  return rows;
}
