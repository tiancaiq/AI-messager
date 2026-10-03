import type { SkillDefinition } from "@ai-message-coach/contracts";

import { validateSkillRegistry } from "./engine.js";

export interface ApprovedSkillCatalogSnapshot {
  readonly id: string;
  readonly registry: readonly SkillDefinition[];
}

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value !== null && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([left], [right]) => (left < right ? -1 : left > right ? 1 : 0))
        .map(([key, item]) => [key, canonicalize(item)]),
    );
  return value;
}

const MASK_64 = 0xffff_ffff_ffff_ffffn;
const FNV_PRIME = 0x100_0000_01b3n;

function utf8Bytes(value: string): number[] {
  const bytes: number[] = [];
  for (const character of value) {
    const point = character.codePointAt(0)!;
    if (point < 0x80) bytes.push(point);
    else if (point < 0x800) bytes.push(0xc0 | (point >> 6), 0x80 | (point & 0x3f));
    else if (point < 0x10000)
      bytes.push(0xe0 | (point >> 12), 0x80 | ((point >> 6) & 0x3f), 0x80 | (point & 0x3f));
    else
      bytes.push(
        0xf0 | (point >> 18),
        0x80 | ((point >> 12) & 0x3f),
        0x80 | ((point >> 6) & 0x3f),
        0x80 | (point & 0x3f),
      );
  }
  return bytes;
}

/** Non-cryptographic identity for accidental mismatch detection, not an approval signature. */
export function approvedCatalogFingerprint(registry: readonly SkillDefinition[]): string {
  const encoded = JSON.stringify(canonicalize(registry));
  let left = 0xcbf2_9ce4_8422_2325n;
  let right = 0x8422_2325_cbf2_9ce4n;
  for (const byte of utf8Bytes(encoded)) {
    left = ((left ^ BigInt(byte)) * FNV_PRIME) & MASK_64;
    right = ((right ^ BigInt(byte)) * FNV_PRIME) & MASK_64;
  }
  return `approved-fnv128:${left.toString(16).padStart(16, "0")}${right.toString(16).padStart(16, "0")}`;
}

export function createApprovedSkillCatalogSnapshot(
  rawRegistry: readonly unknown[],
): ApprovedSkillCatalogSnapshot {
  const registry = validateSkillRegistry(rawRegistry);
  return Object.freeze({ id: approvedCatalogFingerprint(registry), registry });
}

export function validateApprovedSkillCatalogSnapshot(
  snapshot: ApprovedSkillCatalogSnapshot,
): readonly SkillDefinition[] {
  const registry = validateSkillRegistry(snapshot.registry);
  if (snapshot.id !== approvedCatalogFingerprint(registry))
    throw new Error("CATALOG_SNAPSHOT_MISMATCH");
  return registry;
}
