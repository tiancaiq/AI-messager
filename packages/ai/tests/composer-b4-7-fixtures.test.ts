import { expect, it } from "vitest";

import { decideCoachingAction } from "../src/coaching-policy.js";
import { buildComposerTask } from "../src/composer-task.js";
import {
  assertComposerB47TargetBudget,
  COMPOSER_B4_7_TARGET_IDS,
  COMPOSER_B4_7_TARGET_MAX_CALLS,
  composerB47TargetFixtures,
} from "./composer-b4-7-fixtures.js";

const emptyGuidance = { principles: [], avoid: [] };

it("locks the ten-case, ten-call targeted set before provider use", () => {
  expect(composerB47TargetFixtures.map(({ id }) => id)).toEqual(COMPOSER_B4_7_TARGET_IDS);
  expect(COMPOSER_B4_7_TARGET_MAX_CALLS).toBe(10);
  expect(() => assertComposerB47TargetBudget(9, 1)).not.toThrow();
  expect(() => assertComposerB47TargetBudget(10, 1)).toThrow("budget exhausted");
  expect(() => assertComposerB47TargetBudget(0, 2)).toThrow("budget exhausted");
  expect(
    composerB47TargetFixtures.every(({ request }) =>
      ["REWRITE_DRAFT", "COMPLETE_DRAFT", "SUGGEST_REPLY"].includes(
        decideCoachingAction(request).action,
      ),
    ),
  ).toBe(true);
});

it("separates durable, temporary, sequence and status controls before live generation", () => {
  const byId = new Map(composerB47TargetFixtures.map((fixture) => [fixture.id, fixture]));
  function scopes(id: string): string[] {
    const fixture = byId.get(id);
    if (!fixture) throw new Error(`Missing target ${id}`);
    return buildComposerTask(fixture.request, decideCoachingAction(fixture.request), emptyGuidance)
      .mustPreserve.filter(({ concept }) => concept === "BOUNDARY_SCOPE")
      .map(({ value }) => value);
  }
  expect(scopes("chinese-boundary-traditional")).toContain("STOP_PRESSURE:DURABLE_OR_UNQUALIFIED");
  expect(scopes("chinese-boundary-simplified-b4-7")).toContain(
    "STOP_PRESSURE:DURABLE_OR_UNQUALIFIED",
  );
  expect(scopes("english-boundary-asking-b4-7")).toContain("STOP_PRESSURE:DURABLE_OR_UNQUALIFIED");
  expect(scopes("chinese-temporary-boundary-b4-7")).toContain("STOP_PRESSURE:TEMPORARY");
  expect(scopes("english-temporary-boundary-b4-7")).toContain("CAPACITY_LIMIT:TEMPORARY");
  expect(scopes("pressure-empathy-durable-b4-7")).toContain(
    "CAPACITY_LIMIT:DURABLE_OR_UNQUALIFIED",
  );
  expect(scopes("refusal-pressure-durable-b4-7")).toContain("STOP_PRESSURE:DURABLE_OR_UNQUALIFIED");
  expect(scopes("unrelated-xian-sequence-b4-7")).toEqual([]);
  expect(scopes("status-request")).toEqual([]);
  expect(scopes("uncertain-availability")).toEqual([]);
});
