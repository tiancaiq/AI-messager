import { describe, expect, it } from "vitest";
import {
  evaluateSrs3eChallengeRecall,
  verifySrs3eChallengeFreeze,
} from "./srs3e-challenge-recall-evaluation.js";

describe("SRS-3E frozen challenge recall diagnostic", () => {
  it("verifies the immutable challenge and keeps language/lane denominators separate", async () => {
    const freeze = await verifySrs3eChallengeFreeze();
    const { report } = await evaluateSrs3eChallengeRecall();
    expect(freeze.freezeId).toBe("SRS-3E-FRESH-CHALLENGE-1");
    expect(report.denominators).toEqual({
      acceptedEnglishCapability: 48,
      acceptedEnglishModifier: 7,
      quarantinedUnscored: 13,
    });
    expect(report.capabilityRows).toHaveLength(48);
    expect(report.modifierEligibility).toHaveLength(7);
    expect(report.capabilityRows.every((row) => row.id.startsWith("C"))).toBe(true);
    expect(report.modifierEligibility.every((row) => row.id.startsWith("M"))).toBe(true);
    expect(
      report.capabilityRows.every((row) => !["C43", "C44", "C45", "C46"].includes(row.id)),
    ).toBe(true);
  });

  it("reports the fresh-set misses and strict NONE without changing retrieval", async () => {
    const { report } = await evaluateSrs3eChallengeRecall();
    expect(report.before.requiredRecallAt10).toMatchObject({ numerator: 18, denominator: 52 });
    expect(report.after.requiredRecallAt10).toMatchObject({ numerator: 19, denominator: 52 });
    expect(report.after.strictNone).toMatchObject({ numerator: 6, denominator: 6 });
    expect(report.after.forbiddenAt10).toMatchObject({ numerator: 7, denominator: 39 });
    const misses = report.capabilityRows.flatMap((row) =>
      row.required.flatMap((id) =>
        row.after.topK.some((item) => item.id === id) ? [] : [{ row, id }],
      ),
    );
    expect(misses).toHaveLength(33);
    expect(
      misses.every(
        ({ row, id }) =>
          row.after.traces.find((trace) => trace.id === id)?.disappearedAt === "RETRIEVAL_CUTOFF",
      ),
    ).toBe(true);
    expect(
      misses.every(({ row, id }) =>
        row.after.traces
          .find((trace) => trace.id === id)
          ?.reasonCodes.includes("NO_SUPPORTING_EVIDENCE"),
      ),
    ).toBe(true);
  });

  it("emits deterministic, content-free evidence", async () => {
    const first = await evaluateSrs3eChallengeRecall();
    const second = await evaluateSrs3eChallengeRecall();
    expect(first.json).toBe(second.json);
    expect(first.sha256).toBe(second.sha256);
    expect(first.json).not.toContain("could u forward the list");
    expect(first.json).not.toContain("locker should i actually go to");
    expect(first.json).not.toContain("Ask building staff to lower the entrance buzzer volume.");
  });
});
