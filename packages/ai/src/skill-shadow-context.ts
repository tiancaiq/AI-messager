import { SkillContextSchema, type SkillContext } from "@ai-message-coach/contracts";

import { CommunicationProblemSchema, type CommunicationProblem } from "./communication-problem.js";

const negatedRefusal = [
  /\b(?:do\s+not|don['’]?t|did\s+not|didn['’]?t|cannot|can['’]?t|will\s+not|won['’]?t)\s+(?:want\s+to\s+)?(?:decline|refuse|reject|say\s+no)\b/giu,
  /\b(?:cannot|can['’]?t)\s+bring\s+(?:myself|ourselves)\s+to\s+(?:decline|refuse|reject)\b/giu,
  /(?:不想|不要|不打算|不会|不會|不能|没法|沒法)(?:拒绝|拒絕|婉拒)/gu,
];
const explicitRefusal = [
  /\b(?:declin(?:e|ed|ing)|refus(?:e|ed|ing)|reject(?:ed|ing)?|say\s+no|turn\s+(?:it|this|that|the\s+(?:offer|invitation|request))\s+down)\b/iu,
  /\b(?:no|nope|nah),?\s+(?:i|we)\s+(?:won['’]?t|will\s+not|can['’]?t|cannot)\b|\b(?:i|we)\s+(?:won['’]?t|will\s+not)\s*[.!?]?$/iu,
  /\b(?:can['’]?t|cannot|can\s+not|won['’]?t|will\s+not|not\s+able\s+to|unable\s+to)\s+(?:do|take|join|go|attend|make|finish|help|accept|come|keep|continue|participate|commit|send|be\s+available)\b/iu,
  /\b(?:do\s+not|don['’]?t)\s+want\s+to(?:\s+(?:do|take|join|go|attend|participate|accept|come|commit|help|send|continue)\b|\s*[.!?]?$)/iu,
  /(?:不想|不能|没法|沒法|拒绝|拒絕|婉拒|去不了|無法參加|无法参加)/iu,
];
const tentativeExpectation =
  /\b(?:maybe|might|probably|perhaps|around\s+\d{1,2}|about\s+\d{1,2}|approximately\s+\d{1,2}|need\s+to\s+check\s+first)\b|(?:大概|可能|也许|也許|不确定|不確定|要(?:再)?确认|要(?:再)?確認)/iu;
const futureTimingOrAvailability =
  /\b(?:today|tomorrow|tonight|next\s+(?:week|month|day)|at\s+\d{1,2}|around\s+\d{1,2}|available|free|finish|complete|done|ready|arrive|come|go|send|meet)\b|(?:今天|明天|今晚|上午|下午|晚上|早上|[\d一二三四五六七八九十]+\s*[点點]|完成|有空|过去|過去|到达|到達)/iu;
const reviewEvent = /\breview\b/iu;
const explicitProgress =
  /\b(?:status|progress|updates?|finish(?:ed|ing)?|done|ready|testing|reviewed|reviewing|sent|working\s+on|blocked|on\s+track|delays?|delayed)\b|(?:进度|進度|状态|狀態|完成|测试|測試|检查|檢查|已发|已發|发了|發了|延迟|延遲)/iu;

function hasExplicitRefusal(text: string): boolean {
  const remaining = negatedRefusal.reduce((value, pattern) => value.replace(pattern, " "), text);
  return (
    explicitRefusal.some((pattern) => pattern.test(remaining)) ||
    /^(?:no|nope|nah)[.!?]?$/iu.test(remaining.trim())
  );
}

/** Agent-side, shadow-only tag refinement. Raw text never crosses into the Skill System. */
export function refineShadowSkillContext(
  rawProblem: CommunicationProblem,
  rawContext: SkillContext,
): SkillContext {
  const problem = CommunicationProblemSchema.parse(rawProblem);
  const context = SkillContextSchema.parse(rawContext);
  const meaning = problem.meaningToPreserve?.text ?? problem.goal.value ?? "";
  const other = problem.latestOtherMessage?.text ?? "";
  const falselyTaggedReviewStatus =
    context.situationTags.includes("status_request") &&
    reviewEvent.test(`${other}\n${meaning}`) &&
    !explicitProgress.test(`${other}\n${meaning}`);
  const hasTentativeExpectation =
    problem.meaningToPreserve !== null &&
    tentativeExpectation.test(meaning) &&
    futureTimingOrAvailability.test(meaning);
  const situationTags = context.situationTags.filter(
    (tag) =>
      !falselyTaggedReviewStatus || (tag !== "status_request" && tag !== "missed_commitment"),
  );
  if (
    hasTentativeExpectation &&
    !situationTags.some((tag) => ["planning", "status_request", "missed_commitment"].includes(tag))
  )
    situationTags.push("planning");
  const intentTags = context.intentTags.filter(
    (tag) =>
      (tag !== "decline" || hasExplicitRefusal(meaning)) &&
      (!falselyTaggedReviewStatus || tag !== "provide_status"),
  );
  if (hasTentativeExpectation && !intentTags.includes("set_expectation"))
    intentTags.push("set_expectation");
  return SkillContextSchema.parse({
    ...context,
    situationTags,
    intentTags,
  });
}
