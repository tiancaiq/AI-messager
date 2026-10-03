import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { packageRoot, renderRegistry } from "./generator.js";
import {
  capabilitySemanticProfiles,
  loadSemanticProfiles,
  renderSemanticArtifact,
  semanticArtifactPath,
  SemanticProfileSchema,
  validateSemanticCatalog,
} from "./semantic-profiles.js";

describe("SRS-3D-B authoring-only semantic profiles", () => {
  it("binds exactly 14 approved universal capabilities and seven modifier profiles", async () => {
    const { catalog, records } = await loadSemanticProfiles();
    const capabilities = capabilitySemanticProfiles(catalog);
    expect(records).toHaveLength(21);
    expect(capabilities).toHaveLength(14);
    expect(catalog.profiles.filter((profile) => profile.lane === "LANGUAGE_MODIFIER")).toHaveLength(
      7,
    );
    expect(capabilities.every((profile) => !profile.id.includes("."))).toBe(true);
    expect(
      capabilities
        .flatMap((profile) => profile.neighbors)
        .every((edge) => !edge.skillId.includes(".")),
    ).toBe(true);
    expect(records.every((record) => record.review.examples.state === "PENDING_HUMAN_REVIEW")).toBe(
      true,
    );
    expect(catalog.profiles.every((profile) => profile.profileRevision === 1)).toBe(true);
    expect(catalog.profiles.some((profile) => profile.id === "confirmation")).toBe(false);
    expect(catalog.profiles.some((profile) => profile.id === "perspective_acknowledgement")).toBe(
      false,
    );
    expect(catalog.profiles.some((profile) => profile.id === "give_constructive_feedback")).toBe(
      false,
    );
  });

  it("fails closed on incomplete, duplicate, unknown, self and cross-lane profiles", async () => {
    const { catalog, records } = await loadSemanticProfiles();
    const malformed = structuredClone(catalog);
    malformed.profiles[0]!.job = "";
    expect(() => validateSemanticCatalog(malformed, records)).toThrow();

    const missing = structuredClone(catalog);
    missing.profiles.pop();
    expect(() => validateSemanticCatalog(missing, records)).toThrow();

    const duplicate = structuredClone(catalog);
    duplicate.profiles[1]!.id = duplicate.profiles[0]!.id;
    expect(() => validateSemanticCatalog(duplicate, records)).toThrow();

    const unknown = structuredClone(catalog);
    unknown.profiles[0]!.neighbors[0]!.skillId = "confirmation";
    expect(() => validateSemanticCatalog(unknown, records)).toThrow(/Unknown semantic neighbor/u);

    const self = structuredClone(catalog);
    self.profiles[0]!.neighbors[0]!.skillId = self.profiles[0]!.id;
    expect(() => validateSemanticCatalog(self, records)).toThrow();

    const repeated = structuredClone(catalog);
    repeated.profiles[0]!.neighbors.push({ ...repeated.profiles[0]!.neighbors[0]! });
    expect(() => validateSemanticCatalog(repeated, records)).toThrow();

    const crossLane = structuredClone(catalog);
    crossLane.profiles[0]!.neighbors[0]!.skillId = "en.direct_but_polite";
    expect(() => validateSemanticCatalog(crossLane, records)).toThrow(/Modifier in capability/u);

    const wrongLane = structuredClone(catalog);
    wrongLane.profiles[0]!.lane = "LANGUAGE_MODIFIER";
    expect(() => validateSemanticCatalog(wrongLane, records)).toThrow(/lane mismatch/u);
  });

  it("uses closed relation/review vocabularies and rejects lexical trigger recipes", async () => {
    const { catalog } = await loadSemanticProfiles();
    const example = catalog.profiles[0]!;
    expect(SemanticProfileSchema.safeParse({ ...example, useWhen: [] }).success).toBe(false);
    expect(SemanticProfileSchema.safeParse({ ...example, whenNotUse: [] }).success).toBe(false);
    expect(SemanticProfileSchema.safeParse({ ...example, semanticTriggers: [] }).success).toBe(
      false,
    );
    expect(
      SemanticProfileSchema.safeParse({ ...example, semanticTriggers: ["contains sorry"] }).success,
    ).toBe(false);
    expect(
      SemanticProfileSchema.safeParse({
        ...example,
        neighbors: [{ ...example.neighbors[0], relationship: "HARD_CONFLICT" }],
      }).success,
    ).toBe(false);
    expect(
      SemanticProfileSchema.safeParse({
        ...example,
        neighbors: [{ ...example.neighbors[0], coexistence: "NEVER" }],
      }).success,
    ).toBe(false);
  });

  it("preserves reviewed capability distinctions without imposing blanket conflicts", async () => {
    const { catalog } = await loadSemanticProfiles();
    const byId = new Map(catalog.profiles.map((profile) => [profile.id, profile]));
    const requiredPairs = [
      ["request", "clarification"],
      ["request", "ask_for_help"],
      ["follow_up", "request"],
      ["boundary_setting", "decline"],
      ["boundary_setting", "de_escalation"],
      ["status_update", "expectation_setting"],
      ["planning", "request"],
      ["planning", "status_update"],
      ["apology", "acknowledge_mistake"],
      ["emotional_validation", "reassurance"],
    ] as const;
    for (const [source, target] of requiredPairs) {
      const edge = byId.get(source)?.neighbors.find((neighbor) => neighbor.skillId === target);
      expect(edge, `${source} → ${target}`).toBeDefined();
      expect(edge?.coexistence).not.toBe("USUALLY_ALTERNATIVE");
    }
    expect(byId.get("boundary_setting")?.reviewState).toBe("BOUNDARY_REVIEW_REQUIRED");
    expect(byId.get("boundary_setting")?.useWhen.join(" ")).toMatch(/repeated|ongoing/iu);
    expect(byId.get("expectation_setting")?.whenNotUse.join(" ")).toMatch(/coordinates|current/iu);
    expect(byId.get("expectation_setting")?.knownBoundaryIssue).toMatch(
      /planning and status_request/u,
    );
  });

  it("renders stable definition-plus-profile digests without changing production bytes", async () => {
    const first = await renderSemanticArtifact();
    const second = await renderSemanticArtifact();
    expect(first.json).toBe(second.json);
    expect(first.sha256).toBe(second.sha256);
    expect(await readFile(semanticArtifactPath, "utf8")).toBe(first.json);
    expect(first.artifact.profiles).toHaveLength(21);
    expect(
      first.artifact.profiles.every(
        (profile) =>
          /^sha256:[a-f0-9]{64}$/u.test(profile.profileDigest) &&
          /^sha256:[a-f0-9]{64}$/u.test(profile.sourceDefinitionDigest),
      ),
    ).toBe(true);

    const registryPath = resolve(packageRoot, "src/generated/approved-registry.ts");
    const registry = await readFile(registryPath, "utf8");
    expect(registry).toBe(await renderRegistry());
    expect(createHash("sha256").update(registry).digest("hex")).toBe(
      "69308570286570725609e80bcd961932da1092db2d68bad157e815616cef275d",
    );
    expect(registry).not.toContain("semanticTriggers");
    expect(registry).not.toContain("knownBoundaryIssue");
    expect(registry).not.toContain("profileRevision");
    expect(first.json).not.toMatch(/sourceText|visibleContext|userIntent|draft|improved/u);
  });

  it("keeps semantic authoring out of runtime selection, contracts and provider prompt sources", async () => {
    const runtimeFiles = [
      "packages/skills/src/index.ts",
      "packages/skills/src/registry.ts",
      "packages/skills/src/engine.ts",
      "packages/ai/src/skill-context.ts",
      "packages/ai/src/coaching-prompt.ts",
      "packages/contracts/src/skills.ts",
    ];
    const root = resolve(packageRoot, "../..");
    for (const path of runtimeFiles) {
      const source = await readFile(resolve(root, path), "utf8");
      expect(source, path).not.toMatch(/semantic-profiles|semanticProfiles|semanticTriggers/u);
    }
  });
});
