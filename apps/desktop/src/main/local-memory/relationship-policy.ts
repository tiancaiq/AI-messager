import { relationshipTimePeriod, type RelationshipValidity } from "@ai-message-coach/contracts";

// Date-only and calendar-period starts mean "somewhere in that period". EXACT
// ends are exclusive boundaries at the period's beginning; WITHIN ends retain
// the uncertainty through the period. Missing bounds never prove a role current.
export function classifyRelationshipAt(
  validity: RelationshipValidity,
  applicability: "CURRENT" | "HISTORICAL" | "UNKNOWN",
  asOf: string,
): "CURRENT" | "HISTORICAL" | "UNKNOWN" {
  const at = Date.parse(asOf);
  if (!Number.isFinite(at)) return "UNKNOWN";
  const start = relationshipTimePeriod(validity.start);
  const end = relationshipTimePeriod(validity.end.bound);
  if (start && at < start.first) return "UNKNOWN";
  if (end) {
    const latestEnd = validity.end.certainty === "WITHIN" ? end.after : end.first;
    if (at >= latestEnd) return "HISTORICAL";
  }
  if (applicability === "UNKNOWN") return "UNKNOWN";
  if (end && at >= end.first) return "UNKNOWN";
  if (start && at >= start.after && end) return "CURRENT";
  if (applicability === "HISTORICAL") return end ? "UNKNOWN" : "HISTORICAL";
  if (!start || at < start.after) return "UNKNOWN";
  return "CURRENT";
}

// A correction is applicable unless the two scopes are provably disjoint.
// Unknown or period-precision boundaries never become an invented exact date.
export function relationshipIntervalsMayOverlap(
  first: RelationshipValidity,
  second: RelationshipValidity,
): boolean {
  const firstStart = relationshipTimePeriod(first.start)?.first ?? Number.NEGATIVE_INFINITY;
  const secondStart = relationshipTimePeriod(second.start)?.first ?? Number.NEGATIVE_INFINITY;
  const firstEndPeriod = relationshipTimePeriod(first.end.bound);
  const secondEndPeriod = relationshipTimePeriod(second.end.bound);
  const firstEnd = firstEndPeriod
    ? first.end.certainty === "WITHIN"
      ? firstEndPeriod.after
      : firstEndPeriod.first
    : Number.POSITIVE_INFINITY;
  const secondEnd = secondEndPeriod
    ? second.end.certainty === "WITHIN"
      ? secondEndPeriod.after
      : secondEndPeriod.first
    : Number.POSITIVE_INFINITY;
  return firstEnd > secondStart && secondEnd > firstStart;
}
