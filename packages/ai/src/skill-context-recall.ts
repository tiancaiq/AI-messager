import {
  SkillContextSchema,
  type CoachingRequest,
  type SkillIntentTag,
  type SkillSituationTag,
} from "@ai-message-coach/contracts";

import type { CoachingPolicyDecision } from "./coaching-policy.js";
import {
  deriveSkillContextForProfile,
  type SkillContextEvidenceSource,
  type SkillContextSignalEvidence,
} from "./skill-context-normalization.js";
import type { SkillContextDerivationOptions } from "./skill-context.js";

/** Evaluation-only successor. The historical SRS_2_5_PROPOSED implementation is not edited. */
export const SRS3D_RECALL_PROFILE = "SRS_3D_RECALL_PROPOSED" as const;

interface Fragment {
  text: string;
  source: SkillContextEvidenceSource;
}

const requestOperation =
  /\b(?:pls|please)\s+(?:run|send|share|provide|bring|check|review|confirm|book|schedule|update|show|tell|let\s+me\s+know|lmk)\b|\b(?:send|share|bring|run|provide|review|check|confirm|book|schedule|lmk)\b[^.!?]{0,65}\b(?:pls|please)\b|\b(?:can\s+u|could\s+u|need\s+you\s+to)\b|\bask\s+for\s+(?:a|an|the|my|our|some)?\s*(?:copy|invoice|file|document|report|deck|link|information|help)\b|\b(?:receipt|invoice|document|file|report|link)\b[^.!?]{0,35}\bwhen\s+(?:u|you)\s+get\s+a\s+sec\b/iu;
const negatedRequest =
  /\b(?:do\s+not|don['’]?t|without|no\s+need\s+to)\s+(?:ask\s+for|request|send|share|provide|bring|run)\b/iu;
const clarificationOperation =
  /\b(?:ask|check|clarify)\s+(?:which|whether)\b[^.!?]{0,90}\b(?:means?|before|version|plan|file|report|option|shipment|quote|site)\b|\b(?:which|what)\s+(?:plan|report|file|version|option|shipment|quote|order\s+number|date|one)\b|\b(?:basic|standard|plus|premium|morning|afternoon)\s+or\s+(?:basic|standard|plus|premium|morning|afternoon)\b|\bdo\s+you\s+mean\b|\bclarify\s+whether\b|\bwhich\s+\w+\s+(?:u|you)\s+mean\b/iu;
const planningOperation =
  /\blet['’]?s\s+(?:pick|choose|compare|test|meet|book|schedule|coordinate|assign|decide|plan)\b|\b(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tues?|wed|thurs?|fri|sat|sun)\b[^.!?]{0,50}\bworks\b|\bworks\s+for\s+(?:me|us)\b[^.!?]{0,70}\b(?:calendar|book|schedule|time|day|at\s+\d)\b|\b(?:put|book|schedule)\b[^.!?]{0,45}\b(?:calendar|appointment|meeting|time\s+slot)\b|\b(?:pick|choose|settle\s+on)\s+a\s+time\b/iu;
const negatedPlanning =
  /\b(?:do\s+not|don['’]?t|without)\s+(?:book|schedule|plan|pick|choose|meet)\b/iu;
const continuingLimit =
  /\b(?:need|want|ask|please)\b[^.!?]{0,70}\b(?:kept\s+(?:free|off)|quiet|stop|not\s+to|don['’]?t)\b[^.!?]{0,65}\b(?:going\s+forward|from\s+now\s+on|every\s+day|anymore|again|while\s+i['’]?m\s+in\s+meetings)\b|\b(?:please|pls)\s+stop\s+(?:asking|calling|messaging|contacting)\b|\bdon['’]?t\s+come\s+into\b[^.!?]{0,60}\bwhile\s+i['’]?m\s+in\s+meetings\b|\bno\s+(?:calls|meetings|messages|requests)\b[^.!?]{0,35}\b(?:from\s+now\s+on|going\s+forward)\b/iu;
const repeatedPressure =
  /\b(?:again|every\s+day|each\s+day|all\s+week|this\s+week|keep\s+asking|repeatedly|another\s+meeting|four\s+times|every\s+time)\b/iu;
const explicitContinuity =
  /\b(?:going\s+forward|from\s+now\s+on|anymore|stop\s+(?:asking|calling|messaging|contacting))\b/iu;
const ownedMistake =
  /\b(?:i|we)\s+(?:(?:have|had)\s+)?(?:pasted|uploaded|attached|used|sent|shared|missed|forgot|omitted)\b[^.!?]{0,75}\b(?:wrong|outdated|old|late|incorrect|missing|deadline|by\s+noon)\b|\b(?:i|we)\s+(?:forgot|failed|missed)\s+to\b|\b(?:my|our)\s+(?:late|missed|wrong|outdated)\b[^.!?]{0,55}\b(?:upload|section|link|file|numbers?|deadline)\b|\b(?:my|our)\s+(?:upload|section|link|file|numbers?)\b[^.!?]{0,40}\b(?:late|wrong|outdated|incorrect)\b|\bown\s+(?:my|our)\s+(?:late|missed|wrong|outdated)\b|^(?:forgot|failed)\s+to\b/iu;
const ownershipDenial =
  /\b(?:not|never)\s+(?:my|our)\s+fault\b|\b(?:without|don['’]?t)\s+(?:blaming|blame)\s+(?:me|us)\b|\b(?:do\s+not|don['’]?t)\s+own\b/iu;
const expressedEmotion =
  /\b(?:i['’]?m|i\s+am|i\s+feel|this\s+has\s+been|it['’]?s\s+been|really)\s+(?:really\s+|so\s+)?(?:embarrassed|frustrated|exhausted|exhausting|disappointed|overwhelmed|stressful|stressed|sad|upset|worried|devastated)\b|\b(?:failed|lost|hurt)\b[^.!?]{0,45}\b(?:embarrassed|frustrated|exhausted|disappointed)\b/iu;
const knownProgress =
  /\b\d+\s*(?:of|\/)\s*\d+\b[^.!?]{0,55}\b(?:counted|checked|reviewed|done|finished|complete|completed|tested|fixed)\b|\b(?:qa|review|test|screen\s+reader|draft|pass|flow|refund|upload|delivery)\b[^.!?]{0,65}\b(?:done|finished|complete|completed|pending|blocked|in\s+progress|still\s+checking)\b/iu;
const futureEstimate =
  /\b(?:should|might|may|probably|likely|expect\s+to)\s+be\s+(?:free|available|ready|done)\b[^.!?]{0,55}\b(?:after|before|by|on|tomorrow|tmrw|today|this\s+week)\b|\b(?:might|may|probably|should)\s+take\b[^.!?]{0,55}\b(?:tomorrow|tmrw|today|week|day|hour|until|till)\b|\b(?:can|could)\s+(?:review|finish|send|deliver)\b[^.!?]{0,50}\b(?:this\s+week|tomorrow|today|by\s+\w+)\b|\b(?:might|may|probably|should)\s+need\b[^.!?]{0,40}\b(?:another|more|extra)\s+(?:day|hour|week)\b/iu;
const negatedExpectation =
  /\b(?:do\s+not|don['’]?t)\s+say\b[^.!?]{0,65}\b(?:can|will|might|should)\b/iu;

function fragments(request: CoachingRequest): {
  user: Fragment[];
  other: Fragment[];
} {
  const user: Fragment[] = request.analysis.messages
    .filter(({ speaker }) => speaker === "USER")
    .map(({ text }) => ({ text, source: "CONVERSATION_HISTORY" }));
  const other: Fragment[] = request.analysis.messages
    .filter(({ speaker }) => speaker === "OTHER")
    .map(({ text }) => ({ text, source: "OTHER_MESSAGE" }));
  if (request.analysis.draft.text?.trim())
    user.push({ text: request.analysis.draft.text, source: "USER_DRAFT" });
  const selected =
    request.selection?.kind === "ACTION"
      ? request.selection.intent
      : (request.selection?.answer ?? "");
  if (selected.trim()) user.push({ text: selected, source: "SELECTED_INTENT" });
  return { user, other };
}

export function deriveSkillContextForRecallProfile(
  request: CoachingRequest,
  policy: CoachingPolicyDecision,
  options: SkillContextDerivationOptions = {},
) {
  const previous = deriveSkillContextForProfile(request, policy, "SRS_2_5_PROPOSED", options);
  const { user, other } = fragments(request);
  const signals = new Map<string, SkillContextSignalEvidence>(
    previous.signals.map((signal) => [`${signal.kind}:${signal.tag}`, signal]),
  );
  const intents = new Set(previous.context.intentTags);
  const situations = new Set(previous.context.situationTags);
  const add = (
    kind: "INTENT" | "SITUATION",
    tag: SkillIntentTag | SkillSituationTag,
    evidence: readonly Fragment[],
  ) => {
    if (!evidence.length) return;
    const key = `${kind}:${tag}`;
    const existing = signals.get(key);
    const sources = new Set([
      ...(existing?.sources ?? []),
      ...evidence.map(({ source }) => source),
    ]);
    signals.set(key, { kind, tag, sources: [...sources] });
    if (kind === "INTENT") intents.add(tag as SkillIntentTag);
    else situations.add(tag as SkillSituationTag);
  };
  const match = (items: readonly Fragment[], pattern: RegExp) =>
    items.filter(({ text }) => pattern.test(text));
  const clarification = match(user, clarificationOperation);
  const asks = match(user, requestOperation).filter(
    (fragment) =>
      !clarificationOperation.test(fragment.text) && !negatedRequest.test(fragment.text),
  );
  const planning = match(user, planningOperation).filter(({ text }) => !negatedPlanning.test(text));
  const boundary = match(user, continuingLimit).filter(
    ({ text }) =>
      explicitContinuity.test(text) ||
      other.some(({ text: prior }) => repeatedPressure.test(prior)),
  );
  const ownership = match(user, ownedMistake).filter(({ text }) => !ownershipDenial.test(text));
  const emotion = match(other, expressedEmotion);
  const status = match(user, knownProgress);
  // A single draft can both coordinate a time and give a cautious availability estimate.
  const expectation = match(user, futureEstimate).filter(
    ({ text }) => !negatedExpectation.test(text),
  );

  add("INTENT", "make_request", asks);
  add("SITUATION", "request", asks);
  add("INTENT", "clarify", clarification);
  add("SITUATION", "request", clarification);
  add("INTENT", "plan", planning);
  add("SITUATION", "planning", planning);
  add("INTENT", "set_boundary", boundary);
  add("SITUATION", "pressure", boundary);
  add("INTENT", "acknowledge_mistake", ownership);
  add("SITUATION", "mistake", ownership);
  add("INTENT", "validate_emotion", emotion);
  add("SITUATION", "emotional_support", emotion);
  add("INTENT", "provide_status", status);
  add("SITUATION", "status_request", status);
  add("INTENT", "set_expectation", expectation);

  return {
    profile: SRS3D_RECALL_PROFILE,
    context: SkillContextSchema.parse({
      ...previous.context,
      intentTags: [...intents],
      situationTags: [...situations],
    }),
    signals: [...signals.values()],
  };
}
