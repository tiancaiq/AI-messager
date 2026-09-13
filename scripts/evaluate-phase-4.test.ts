import { describe, expect, it } from "vitest";

import { createSkillEngine, initialSkillRegistry } from "../packages/skills/src/index.js";
import {
  declaredConflictPairCount,
  oracleSkillLanguages,
  runSyntheticConflictProbe,
} from "./phase-4-evaluation-support.mjs";
import { loadPhase4LiveEnvironment } from "./phase-4-environment.mjs";

describe("Phase 4 evaluator", () => {
  it("uses an independent language oracle for regional and adversarial code switching", () => {
    expect(
      oracleSkillLanguages({ primary: "en-US", secondary: null, codeSwitching: false }),
    ).toEqual(new Set(["universal", "en"]));
    expect(
      oracleSkillLanguages({ primary: "zh-Hant", secondary: "en-US", codeSwitching: true }),
    ).toEqual(new Set(["universal", "zh", "en"]));
    expect(
      oracleSkillLanguages({ primary: "ko-KR", secondary: "en-US", codeSwitching: true }),
    ).toEqual(new Set(["universal"]));
  });

  it("reports absent production declarations separately from a passing conflict probe", () => {
    expect(declaredConflictPairCount(initialSkillRegistry)).toBe(0);
    expect(runSyntheticConflictProbe(createSkillEngine)).toBe(true);
  });

  it("does not load a local environment file in deterministic mode", () => {
    let environmentLoads = 0;
    const loaded = loadPhase4LiveEnvironment(false, {
      environmentPath: "/synthetic/.env.local",
      environmentExists: () => true,
      loadEnvironmentFile: () => {
        environmentLoads += 1;
      },
    });

    expect(loaded).toBe(false);
    expect(environmentLoads).toBe(0);
  });

  it("loads local provider configuration only after live mode is requested", () => {
    let loadedPath: string | undefined;
    const loaded = loadPhase4LiveEnvironment(true, {
      environmentPath: "/synthetic/.env.local",
      environmentExists: () => true,
      loadEnvironmentFile: (path: string) => {
        loadedPath = path;
      },
    });

    expect(loaded).toBe(true);
    expect(loadedPath).toBe("/synthetic/.env.local");
  });
});
