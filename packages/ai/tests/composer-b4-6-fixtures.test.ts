import { expect, it } from "vitest";

import { buildComposerTask } from "../src/composer-task.js";
import { decideCoachingAction } from "../src/coaching-policy.js";
import {
  assertComposerB46TargetBudget,
  COMPOSER_B4_6_TARGET_IDS,
  COMPOSER_B4_6_TARGET_MAX_CALLS,
  composerB46TargetFixtures,
} from "./composer-b4-6-fixtures.js";

it("locks the 13-case/13-call targeted set before any provider use", () => {
  expect(composerB46TargetFixtures.map(({ id }) => id)).toEqual(COMPOSER_B4_6_TARGET_IDS);
  expect(COMPOSER_B4_6_TARGET_MAX_CALLS).toBe(13);
  expect(() => assertComposerB46TargetBudget(12, 1)).not.toThrow();
  expect(() => assertComposerB46TargetBudget(13, 1)).toThrow("budget exhausted");
  expect(() => assertComposerB46TargetBudget(0, 2)).toThrow("budget exhausted");
});

it("keeps the supported-status control distinct from unknown-status cases", () => {
  const supported = composerB46TargetFixtures.find(({ id }) => id === "supported-status-b4-6");
  const unknown = composerB46TargetFixtures.find(({ id }) => id === "status-request");
  if (!supported || !unknown) throw new Error("Missing status comparison fixtures");
  const empty = { principles: [], avoid: [] };
  expect(
    buildComposerTask(supported.request, decideCoachingAction(supported.request), empty)
      .statusReplyMode,
  ).toBe("NONE");
  expect(
    buildComposerTask(unknown.request, decideCoachingAction(unknown.request), empty)
      .statusReplyMode,
  ).toBe("ASK_SCOPE_ONLY");
});
