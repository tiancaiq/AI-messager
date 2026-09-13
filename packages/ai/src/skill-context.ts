import type {
  CoachingRequest,
  CommunicationPlan,
  SkillContext,
  SkillIntentTag,
  SkillSituationTag,
} from "@ai-message-coach/contracts";

import type { CoachingPolicyDecision } from "./coaching-policy.js";

const mistake =
  /\b(?:sorry|sry|apolog(?:ize|ise|ized|ised|izing|ising)|apologies|my fault|mistakes?|miss(?:ed|ing)|forgot|late|delays?|delayed)\b|(?:抱歉|对不起|對不起|道歉|我的错|我的錯|失误|失誤|忘了|迟到|遲到|耽误|耽誤)/iu;
const apology =
  /\b(?:sorry|sry|apolog(?:ize|ise|ized|ised|izing|ising)|apologies)\b|(?:抱歉|对不起|對不起|道歉)/iu;
const negatedMistake = [
  /\b(?:no\s+need|do(?:es)?\s+not\s+need|don['’]?t\s+need|should\s+not|shouldn['’]?t|do\s+not|don['’]?t|will\s+not|won['’]?t|never)\s+(?:(?:want|have)\s+to\s+|to\s+)?(?:apolog(?:ize|ise)|say\s+sorry)\b/giu,
  /\b(?:do\s+not|don['’]?t)\s+(?:think|feel)\s+(?:i|we)\s+(?:need|have)\s+to\s+(?:apolog(?:ize|ise)|say\s+sorry)\b/giu,
  /\bwithout\s+(?:apolog(?:izing|ising)|saying\s+sorry)\b/giu,
  /\b(?:(?:it|that|this)\s+)?(?:(?:(?:is|was)\s+)?(?:not|never)|isn['’]?t|wasn['’]?t)\s+(?:my|our|your|their|his|her)\s+fault\b/giu,
  /\b(?:did\s+not|didn['’]?t|do\s+not|don['’]?t)\s+make\s+(?:a\s+)?mistake\b/giu,
  /\b(?:not|never)\s+(?:a\s+|my\s+|our\s+|your\s+|their\s+)?(?:mistake|delay)\b/giu,
  /\b(?:not|isn['’]?t|wasn['’]?t|aren['’]?t|weren['’]?t)\s+(?:actually\s+)?(?:late|delayed)\b/giu,
  /(?:不用|无需|無需|不必|不要)(?:再)?(?:道歉|说对不起|說對不起)|(?:不是|不算)(?:我的|你的|您的|我们的|我們的)?(?:错|錯|失误|失誤)|(?:没有|沒有)(?:迟到|遲到|耽误|耽誤)/gu,
];
const status =
  /\b(?:status|progress|updates?|finish(?:ed|ing)?|done|ready|testing|review(?:ed|ing)?|sent|working on|blocked|on track|delays?|delayed)\b|(?:进度|進度|状态|狀態|完成|测试|測試|检查|檢查|已发|已發|发了|發了|延迟|延遲)/iu;
const directStatusRequest =
  /\b(?:any\s+(?:status|progress|updates?)|what(?:'s|\s+is)\s+the\s+(?:status|progress|update)|(?:can|could|would)\s+you\s+(?:please\s+)?(?:share|provide|give|send)\s+(?:me\s+|us\s+)?(?:a\s+|the\s+|your\s+)?(?:status|progress|update)|when\s+(?:will|can)\b[^\n.!?]{0,60}\b(?:finish|send|be\s+(?:done|ready)))\b|(?:进度|進度|状态|狀態|情况|情況).{0,12}(?:吗|嗎|呢|[?？])|(?:能|可以|什么时候|什麼時候|何时|何時).{0,18}(?:完成|做好|发|發|更新|检查|檢查|测试|測試).{0,6}(?:吗|嗎|呢|[?？])/iu;
const emotional =
  /\b(?:upset|sad|awful|terrible|hard|devastated|hurt|scared|worried)\b|(?:难过|難過|伤心|傷心|糟糕|担心|擔心|害怕)/iu;
const pressure =
  /\b(?:already asked|again|must|need this now|keep asking|stop asking|can't keep)\b|(?:一直催|必须|必須|别再|別再|现在就|現在就)/iu;
const boundary =
  /\b(?:set\s+(?:a\s+)?(?:boundary|limit)|draw\s+the\s+line|can['’]?t\s+keep|cannot\s+keep|won['’]?t\s+keep|will\s+not\s+keep|not\s+going\s+to\s+keep|stop\s+(?:asking|pressuring|pushing)|no\s+more)\b|(?:设定|設定|明确|明確)(?:界限|边界|邊界|底线|底線)|(?:不能再|不会再|不會再|不再|别再|別再|不要再|到此为止|到此為止)/iu;
const negatedBoundary = [
  /\b(?:no\s+need|do\s+not|don['’]?t|should\s+not|shouldn['’]?t)\s+(?:(?:want|need)\s+to\s+|to\s+)?set\s+(?:a\s+)?(?:boundary|limit)\b/giu,
  /(?:不用|无需|無需|不必|不要)(?:设定|設定|明确|明確)(?:界限|边界|邊界|底线|底線)/gu,
];
const conflict = /\b(?:argue|blame|unfair|angry|conflict)\b|(?:争吵|爭吵|生气|生氣|不公平|怪我)/iu;
const planning =
  /\b(?:when|what time|where|meet|meeting|schedule|around \d)\b|(?:几点|幾點|哪里|哪裡|见面|見面|大概\s*\d|安排)/iu;
const invitation = /\b(?:want to|would you like|come|join)\b|(?:要不要|想不想|一起來|一起来)/iu;
const followUp =
  /\b(?:following up|follow up|checking in|any update)\b|(?:跟进|跟進|再确认|再確認)/iu;
const requestPattern =
  /\b(?:can you|could you|please|would you)\b|(?:可以|能不能|请|請|麻烦|麻煩)/iu;
const decline =
  /\b(?:declin(?:e|ed|ing)|refus(?:e|ed|ing)|say\s+no|turn\s+(?:it|this|that|the\s+offer|the\s+invitation)\s+down|can['’]?t|cannot|won['’]?t|will\s+not|not\s+able|unable|probably\s+can['’]?t|do\s+not\s+want\s+to|don['’]?t\s+want\s+to)\b|(?:不想|不能|没法|沒法|拒绝|拒絕|婉拒|去不了|無法參加|无法参加)/iu;
const negatedDecline = [
  /\b(?:refus(?:e|ed|ing)|declin(?:e|ed|ing))\s+to\s+(?:decline|refuse|say\s+no|turn\s+(?:it|this|that|the\s+offer|the\s+invitation)\s+down)\b/giu,
  /\b(?:cannot|can['’]?t|could\s+not|couldn['’]?t)\s+bring\s+(?:myself|ourselves)\s+to\s+(?:decline|refuse|say\s+no|turn\s+(?:it|this|that|the\s+offer|the\s+invitation)\s+down)\b/giu,
  /\b(?:do\s+not|don['’]?t|did\s+not|didn['’]?t|will\s+not|won['’]?t|would\s+not|wouldn['’]?t|cannot|can['’]?t|never)\s+(?:(?:want|intend|plan|mean|wish)\s+to\s+)?(?:decline|refuse|say\s+no|turn\s+(?:it|this|that|the\s+offer|the\s+invitation)\s+down)\b/giu,
  /\b(?:not\s+able|unable)\s+to\s+(?:decline|refuse|say\s+no)\b/giu,
  /(?:不想|不要|不打算|不会|不會|不能|没法|沒法)(?:拒绝|拒絕|婉拒)/gu,
];
const help = /\b(?:help|assist|support me)\b|(?:帮我|幫我|帮忙|幫忙)/iu;
const reassure =
  /\b(?:it's okay|you've got this|I'm here|support you)\b|(?:没关系|沒關係|我在|支持你)/iu;
const timing =
  /\b(?:today|tomorrow|probably|maybe|later|by )\b|(?:今天|明天|可能|大概|稍后|稍後)/iu;

function addIf<T>(set: Set<T>, condition: boolean, value: T): void {
  if (condition) set.add(value);
}

function withoutNegatedMatches(text: string, patterns: readonly RegExp[]): string {
  return patterns.reduce((remaining, pattern) => remaining.replace(pattern, " "), text);
}

function hasSupportedMistake(text: string): boolean {
  return mistake.test(withoutNegatedMatches(text, negatedMistake));
}

function hasApologyIntent(text: string): boolean {
  return apology.test(withoutNegatedMatches(text, negatedMistake));
}

function hasBoundaryIntent(text: string): boolean {
  return boundary.test(withoutNegatedMatches(text, negatedBoundary));
}

function hasDeclineIntent(text: string): boolean {
  const remaining = withoutNegatedMatches(text, negatedDecline).trim();
  return decline.test(remaining) || /^(?:no|nope|nah)[.!]?$/iu.test(remaining);
}

function hasStatusRequest(text: string): boolean {
  return directStatusRequest.test(text);
}

function hasUserStatus(text: string): boolean {
  return status.test(text) && !requestPattern.test(text);
}

export function deriveSkillContext(
  coachingRequest: CoachingRequest,
  policy: CoachingPolicyDecision,
): SkillContext {
  const analysis = coachingRequest.analysis;
  const selectedIntent =
    coachingRequest.selection?.kind === "ACTION"
      ? coachingRequest.selection.intent
      : (coachingRequest.selection?.answer ?? "");
  const draft = analysis.draft.text ?? "";
  const otherEvidence = analysis.messages
    .filter((message) => message.speaker === "OTHER")
    .map((message) => message.text);
  const userMessages = analysis.messages
    .filter((message) => message.speaker === "USER")
    .map((message) => message.text);
  const currentUserIntent = [draft, selectedIntent].filter((text) => text.trim().length > 0);
  const userOwnedEvidence = [...userMessages, ...currentUserIntent];
  const visible = [...analysis.messages.map((message) => message.text), draft, selectedIntent].join(
    "\n",
  );
  const explicitSelection = coachingRequest.selection !== null;
  const intentEvidence = [policy.userIntent.value ?? "", draft, selectedIntent].join("\n");
  const supportedMistake = userOwnedEvidence.some(hasSupportedMistake);
  const statusRequested = otherEvidence.some(hasStatusRequest);
  const userStatusVisible = userOwnedEvidence.some(hasUserStatus);
  const currentStatusIntent = currentUserIntent.some(hasUserStatus);
  const boundaryIntent = currentUserIntent.some(hasBoundaryIntent);
  const pressureVisible = otherEvidence.some((text) => pressure.test(text)) || boundaryIntent;
  const situations = new Set<SkillSituationTag>();
  const intents = new Set<SkillIntentTag>();
  addIf(situations, supportedMistake, "mistake");
  addIf(
    situations,
    supportedMistake && (statusRequested || userStatusVisible),
    "missed_commitment",
  );
  addIf(situations, statusRequested || userStatusVisible, "status_request");
  addIf(situations, emotional.test(visible), "emotional_support");
  addIf(situations, pressureVisible, "pressure");
  addIf(situations, conflict.test(visible), "conflict");
  addIf(situations, planning.test(visible), "planning");
  addIf(situations, invitation.test(visible), "invitation");
  addIf(situations, followUp.test(visible), "follow_up");
  addIf(situations, requestPattern.test(visible), "request");

  addIf(intents, currentUserIntent.some(hasApologyIntent), "apologize");
  addIf(intents, supportedMistake, "acknowledge_mistake");
  addIf(intents, emotional.test(visible), "validate_emotion");
  addIf(
    intents,
    userOwnedEvidence.some((text) => reassure.test(text)),
    "reassure",
  );
  addIf(intents, boundaryIntent, "set_boundary");
  addIf(intents, conflict.test(visible), "de_escalate");
  addIf(intents, hasDeclineIntent(intentEvidence), "decline");
  addIf(intents, help.test(`${intentEvidence}\n${userOwnedEvidence.join("\n")}`), "ask_for_help");
  addIf(
    intents,
    userOwnedEvidence.some((text) => followUp.test(text)),
    "follow_up",
  );
  addIf(intents, statusRequested || currentStatusIntent, "provide_status");
  addIf(
    intents,
    (statusRequested || currentStatusIntent) && currentUserIntent.some((text) => timing.test(text)),
    "set_expectation",
  );
  addIf(intents, !explicitSelection && planning.test(visible), "plan");
  addIf(intents, requestPattern.test(policy.userIntent.value ?? ""), "clarify");
  addIf(intents, requestPattern.test(analysis.draft.text ?? ""), "make_request");

  return {
    action: policy.action,
    intent: policy.userIntent.value,
    situationTags: [...situations],
    intentTags: [...intents],
    language: {
      primary: analysis.language.primary,
      secondary: analysis.language.secondary,
      codeSwitching: analysis.language.codeSwitching,
    },
    draftPresent: Boolean(analysis.draft.text?.trim()),
    ambiguityMaterial: policy.ambiguity.material,
  };
}

export interface CommunicationSkillPlanner {
  plan(context: SkillContext): CommunicationPlan;
}
