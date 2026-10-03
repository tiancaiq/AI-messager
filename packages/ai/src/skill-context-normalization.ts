import {
  SkillContextSchema,
  type CoachingRequest,
  type SkillContext,
  type SkillIntentTag,
  type SkillSituationTag,
} from "@ai-message-coach/contracts";

import type { CoachingPolicyDecision } from "./coaching-policy.js";
import { deriveSkillContext, type SkillContextDerivationOptions } from "./skill-context.js";

export type SkillContextSignalProfile = "CURRENT" | "SRS_2_5_PROPOSED";
export type SkillContextEvidenceSource =
  | "OTHER_MESSAGE"
  | "USER_DRAFT"
  | "SELECTED_INTENT"
  | "CONVERSATION_HISTORY"
  | "STRUCTURED_CONTEXT";

export interface SkillContextSignalEvidence {
  kind: "INTENT" | "SITUATION";
  tag: SkillIntentTag | SkillSituationTag;
  sources: SkillContextEvidenceSource[];
}

export interface SkillContextNormalizationResult {
  profile: SkillContextSignalProfile;
  context: SkillContext;
  signals: SkillContextSignalEvidence[];
}

interface EvidenceFragment {
  text: string;
  source: SkillContextEvidenceSource;
  owner: "USER" | "OTHER" | "STRUCTURED";
}

const sourceOrder: readonly SkillContextEvidenceSource[] = [
  "OTHER_MESSAGE",
  "USER_DRAFT",
  "SELECTED_INTENT",
  "CONVERSATION_HISTORY",
  "STRUCTURED_CONTEXT",
];

const intentOrder: readonly SkillIntentTag[] = [
  "apologize",
  "acknowledge_mistake",
  "validate_emotion",
  "reassure",
  "set_boundary",
  "de_escalate",
  "decline",
  "ask_for_help",
  "follow_up",
  "provide_status",
  "set_expectation",
  "plan",
  "clarify",
  "make_request",
  "acknowledge_perspective",
  "give_feedback",
];

const situationOrder: readonly SkillSituationTag[] = [
  "mistake",
  "missed_commitment",
  "status_request",
  "emotional_support",
  "pressure",
  "conflict",
  "planning",
  "invitation",
  "follow_up",
  "request",
];

const apology =
  /\b(?:sorry|apolog(?:ize|ise|ized|ised|izing|ising)|apologies)\b|(?:抱歉|对不起|對不起|道歉)/iu;
const firstPersonOwnership =
  /\b(?:i|we)\s+(?:(?:really|accidentally|mistakenly)\s+)?(?:(?:have|had)\s+)?(?:used|sent|shared|attached|gave|provided|reported|entered|copied|calculated)\b[^\n.!?]{0,80}\b(?:wrong|incorrect|old|outdated|invalid|mistaken)\b|\b(?:i|we)\s+(?:forgot|failed|missed)\b[^\n.!?]{0,80}|\b(?:i|we)\s+should\s+have\s+(?:updated|told|informed|notified|sent|shared|checked|confirmed|communicated)\b|(?:我|我们|我們)(?:不小心|确实|確實)?(?:用错|用錯|用了旧|用了舊|发错|發錯|寄错|寄錯|忘了|漏了|没发|沒發|没有发|沒有發|应该早点|應該早點|本来应该|本來應該)/iu;
const mistakeAction =
  /\b(?:wrong|incorrect|old|outdated|invalid|mistake|forgot|failed|missed|should have)\b|(?:用错|用錯|旧版|舊版|发错|發錯|忘了|漏了|应该|應該)/iu;
const negatedOwnership =
  /\b(?:not|never)\s+(?:my|our)\s+fault\b|\b(?:i|we)\s+(?:did not|didn't|never)\s+(?:make|cause|send|use|miss|forget)\b|(?:不是|并非|並非)(?:我的|我们的|我們的)(?:错|錯|责任|責任)/iu;

const repeatedLimit =
  /\b(?:i|we)\s+(?:can['’]?t|cannot|won['’]?t|will not|am not going to|are not going to)\s+(?:(?:keep|continue)\s+)?(?:stay\s+late|tak(?:e|ing)\s+on|accept|handle|cover|lend|work\s+extra|do\s+more|keep\s+doing|continue\s+doing)\b|\bplease\s+(?:do\s+not|don['’]?t|stop)\b[^\n.!?]{0,50}\b(?:ask|pressure|push|contact|call|message)\b[^\n.!?]{0,30}\b(?:again|anymore)?|(?:我|我们|我們)(?:不能|无法|無法|不会|不會)(?:再|继续|繼續)(?:加班|接更多|承担更多|承擔更多|借钱|借錢|做下去)|(?:请|請|别|別|不要)(?:再)?(?:催|要求|逼|联系|聯繫|问|問)(?:我)?/iu;
const uncertainDelivery =
  /\b(?:probably|maybe|perhaps|might|may)\b[^\n.!?]{0,60}\b(?:finish|complete|deliver|send|be ready)|\b(?:i|we)\s+(?:probably\s+)?(?:won['’]?t|will not|can['’]?t|cannot)\s+(?:finish|complete|confirm|promise|deliver|send)\b|(?:可能|大概|也许|也許|还不确定|還不確定|不能确定|不能確定|不想承诺|不想承諾|无法承诺|無法承諾).{0,40}(?:完成|交付|发|發|确认|確認|承诺|承諾)?/iu;

const clarification =
  /\b(?:do|did)\s+you\s+mean\b|\b(?:which|what)\s+(?:one|report|file|version|date|item|option)\b|\bwhat\s+do\s+you\s+mean\b|\b(?:is|was)\s+it\s+.+\s+or\s+.+[?？]?|(?:你|您)(?:是)?(?:指|说|說)\s*.{0,30}(?:还是|還是).{0,30}[?？]|(?:是指|指的是|哪一个|哪一個|哪个|哪個|哪份|哪天|什么意思|什麼意思)/iu;
const request =
  /\b(?:can|could|would|will)\s+you\b[^\n.!?]{0,100}|\bplease\s+(?:send|share|provide|give|let|stop|change|update|confirm|review|check|remove|add|wait|call|tell|ask)\b|\b(?:ask|tell|request)\s+(?:them|him|her|the\s+\w+|someone)\s+to\b|(?:请|請|麻烦|麻煩)(?:你|您|对方|對方)?(?:发|發|发送|傳|传|提供|给|給|停止|别|別|改|更新|确认|確認|检查|檢查)|(?:让|讓)(?:他|她|他们|他們|对方|對方).{0,20}(?:发|發|提供|停止|修改|确认|確認)/iu;
const activePlanning =
  /\bwhat\s+time\s+(?:should|can|could|do)\s+(?:we|i|you)\b|\b(?:can|could|should)\s+(?:we|i|you)\s+(?:meet|move|reschedule|schedule|do|start)\b|\blet['’]?s\s+(?:meet|move|reschedule|schedule|do|start)\b|\bhow\s+about\b[^\n.!?]{0,60}\b(?:am|pm|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday)|(?:我们|我們)(?:几点|幾點|什么时候|什麼時候|何时|何時|在哪|哪里|哪裡)(?:见|見|开会|開會)|(?:要不要|能不能|可以不可以|是否可以).{0,30}(?:见面|見面|开会|開會|改到|安排)|(?:改到|安排在).{0,20}(?:几点|幾點|[0-9]+\s*点|[0-9]+\s*點)[?？]/iu;
const settledPlanningNotice =
  /\b(?:meeting|appointment|schedule)\s+(?:is|was|has been|got)\s+(?:moved|set|scheduled|confirmed)\b|(?:会议|會議|时间|時間|安排)(?:已|已经|已經)?(?:改到|定在|确定|確定)/iu;
const currentState =
  /\b(?:still|currently|now|not yet|haven['’]?t|hasn['’]?t|hadn['’]?t|waiting|awaiting|pending|blocked|processing|failing|remaining|unresolved|in progress)\b|\b(?:have|has|had)\s+not\s+(?:received|finished|completed|confirmed|sent)|(?:现在|現在|目前|仍然|还在|還在|还没|還沒|尚未|未收到|没收到|沒收到|没解决|沒解決|未解决|未解決|处理中|處理中|卡住|失败|失敗)/iu;
const statusWord =
  /\b(?:status|progress|update|testing|reviewing|working on|done|ready|blocked|processing|failing)\b|(?:状态|狀態|进度|進度|更新|测试|測試|处理|處理|完成|问题|問題)/iu;
const directStatusRequest =
  /\b(?:what['’]?s|what is)\s+(?:actually\s+)?(?:happening|the\s+status|the\s+progress)|\b(?:any|share|send|give|provide)\b[^\n.!?]{0,30}\b(?:status|progress|update)|\bwhen\s+(?:will|can)\b[^\n.!?]{0,60}\b(?:finish|send|have|be ready)|(?:进度|進度|状态|狀態|怎么样|怎麼樣|情况|情況|什么时候|什麼時候|何时|何時).{0,30}(?:吗|嗎|呢|[?？])|(?:今天|明天).{0,20}(?:能|可以).{0,20}(?:完成|给|給|发|發).{0,8}[?？]/iu;
const expectation =
  /\b(?:probably|maybe|perhaps|might|may|likely|unlikely)\b[^\n.!?]{0,80}|\b(?:do\s+not|don['’]?t)\s+want\s+to\s+promise\b|\b(?:can['’]?t|cannot)\s+promise\b|\b(?:will|should)\s+(?:know|have|send|update)\b[^\n.!?]{0,60}\b(?:later|today|tomorrow|morning|afternoon)|\b(?:it|this)\s+may\s+take\b|(?:可能|大概|也许|也許|不一定|还不能确定|還不能確定|不想(?:先)?承诺|不想(?:先)?承諾|无法承诺|無法承諾|预计|預計|应该|應該).{0,60}(?:今天|明天|稍后|稍後|完成|确认|確認|更新|需要|天)?/iu;
const followUp =
  /\b(?:just\s+)?(?:following\s+up|follow\s+up|checking\s+in|circling\s+back)\b|(?:跟进|跟進|再确认|再確認|想再问|想再問|再来确认|再來確認)/iu;
const priorOpenThread =
  /\b(?:can|could|would|will)\s+you\b|\b(?:i|we)['’]?ll\s+(?:send|share|provide|update|confirm)|\b(?:send|share|provide)\b|(?:请|請|可以|能不能).{0,30}(?:发|發|提供|更新|确认|確認)|(?:我|我们|我們)(?:会|會|将|將).{0,30}(?:发|發|提供|更新|确认|確認)/iu;
const emotional =
  /\b(?:upset|sad|awful|terrible|devastated|hurt|scared|worried)\b|(?:难过|難過|伤心|傷心|糟糕|担心|擔心|害怕)/iu;
const reassure =
  /\b(?:it['’]?s okay|you['’]?ve got this|i['’]?m here|support you)\b|(?:没关系|沒關係|我在|支持你)/iu;
const pressure =
  /\b(?:already asked|again|must|need\s+(?:this|it)\s+now|keep asking|pressure|pushing)\b|(?:一直催|必须|必須|别再|別再|现在就|現在就)/iu;
const conflict =
  /\b(?:argue|blame|unfair|angry|conflict|interrupted)\b|(?:争吵|爭吵|生气|生氣|不公平|怪我|打断|打斷)/iu;
const invitation =
  /\b(?:would you like to|do you want to|can you come|are you free|join us|come tonight)\b|(?:要不要|想不想|有空嗎|有空吗|一起來|一起来)/iu;
const help = /\b(?:help|assist|support me)\b|(?:帮我|幫我|帮忙|幫忙)/iu;
const explicitDecline =
  /\b(?:decline|refuse|say no|turn (?:it|this|that) down)\b|\b(?:i|we)\s+(?:can['’]?t|cannot|won['’]?t|will not)\s+(?:join|attend|accept|take\s+this\s+on|cover)\b|(?:拒绝|拒絕|婉拒|不参加|不參加|去不了)/iu;
const perspectiveAcknowledgement =
  /\b(?:acknowledge|recognize|recognise|understand)\b[^\n]{0,80}\b(?:interpretation|reading|how (?:it|that|the [a-z]+) (?:looked|seemed)|how (?:you|they) (?:read|saw|interpreted))\b|(?:承认|承認|理解|看见|看見|回应|回應).{0,40}(?:理解|解读|解讀|看法|看起来|看起來|显得|顯得)/iu;
const statedPerspective =
  /\b(?:i (?:read|saw|interpreted)\b|it (?:looked|seemed) like\b|came across as\b)|(?:我(?:觉得|覺得)|我(?:理解|看).{0,24}(?:是|像|表示|意味着|意味著)|看起来像|看起來像|显得|顯得)/iu;
const constructiveFeedback =
  /\b(?:give|share|offer|write)\b[^\n]{0,40}\b(?:constructive )?feedback\b|\b(?:interrupt(?:ed|ions?)|chang(?:e|ed|ing)|missing labels?)\b[^\n]{0,120}\b(?:prevent(?:ed)?|caus(?:e|ed)|made|please|next time|could you|couldn['’]?t)\b|(?:给|給|提供|表达|表達|提出|写|寫).{0,32}(?:反馈|反饋|回饋|意见|意見)|(?:打断|打斷|改动|改動|更改|缺少|少了).{0,80}(?:导致|導致|影响|影響|请|請|下次)/iu;

function selectedIntent(request: CoachingRequest): string {
  return request.selection?.kind === "ACTION"
    ? request.selection.intent
    : (request.selection?.answer ?? "");
}

function evidenceFor(request: CoachingRequest, policy: CoachingPolicyDecision): EvidenceFragment[] {
  const evidence: EvidenceFragment[] = request.analysis.messages.map((message) => ({
    text: message.text,
    source: message.speaker === "OTHER" ? "OTHER_MESSAGE" : "CONVERSATION_HISTORY",
    owner: message.speaker === "OTHER" ? "OTHER" : "USER",
  }));
  if (request.analysis.draft.text?.trim())
    evidence.push({ text: request.analysis.draft.text, source: "USER_DRAFT", owner: "USER" });
  const selected = selectedIntent(request);
  if (selected.trim()) evidence.push({ text: selected, source: "SELECTED_INTENT", owner: "USER" });
  const structured = policy.userIntent.value?.trim();
  if (structured && structured !== selected.trim())
    evidence.push({ text: structured, source: "STRUCTURED_CONTEXT", owner: "STRUCTURED" });
  return evidence;
}

function matching(
  evidence: readonly EvidenceFragment[],
  predicate: (fragment: EvidenceFragment) => boolean,
): EvidenceFragment[] {
  return evidence.filter(predicate);
}

function orderedSources(fragments: readonly EvidenceFragment[]): SkillContextEvidenceSource[] {
  const sources = new Set(fragments.map(({ source }) => source));
  return sourceOrder.filter((source) => sources.has(source));
}

function hasUserOwnership(fragment: EvidenceFragment): boolean {
  return (
    fragment.owner !== "OTHER" &&
    !negatedOwnership.test(fragment.text) &&
    firstPersonOwnership.test(fragment.text) &&
    mistakeAction.test(fragment.text)
  );
}

function hasBoundary(fragment: EvidenceFragment): boolean {
  return (
    fragment.owner !== "OTHER" &&
    repeatedLimit.test(fragment.text) &&
    !uncertainDelivery.test(fragment.text)
  );
}

function hasClarification(fragment: EvidenceFragment): boolean {
  return (
    fragment.owner !== "OTHER" &&
    clarification.test(fragment.text) &&
    !activePlanning.test(fragment.text)
  );
}

function hasRequest(fragment: EvidenceFragment): boolean {
  return fragment.owner !== "OTHER" && request.test(fragment.text) && !hasClarification(fragment);
}

function hasPlanning(fragment: EvidenceFragment): boolean {
  return activePlanning.test(fragment.text) && !settledPlanningNotice.test(fragment.text);
}

function hasCurrentState(fragment: EvidenceFragment): boolean {
  return (
    fragment.owner !== "OTHER" &&
    (currentState.test(fragment.text) || statusWord.test(fragment.text))
  );
}

function hasExpectation(fragment: EvidenceFragment): boolean {
  return fragment.owner !== "OTHER" && expectation.test(fragment.text) && !hasPlanning(fragment);
}

function proposedResult(
  request: CoachingRequest,
  policy: CoachingPolicyDecision,
  options: SkillContextDerivationOptions,
): SkillContextNormalizationResult {
  const evidence = evidenceFor(request, policy);
  const userCurrent = evidence.filter(({ source }) =>
    ["USER_DRAFT", "SELECTED_INTENT", "STRUCTURED_CONTEXT"].includes(source),
  );
  const userOwned = evidence.filter(({ owner }) => owner !== "OTHER");
  const other = evidence.filter(({ owner }) => owner === "OTHER");
  const history = evidence.filter(({ source }) => source === "CONVERSATION_HISTORY");
  const all = evidence;
  const intentSignals = new Map<SkillIntentTag, EvidenceFragment[]>();
  const situationSignals = new Map<SkillSituationTag, EvidenceFragment[]>();
  const addIntent = (tag: SkillIntentTag, fragments: readonly EvidenceFragment[]) => {
    if (fragments.length > 0) intentSignals.set(tag, [...fragments]);
  };
  const addSituation = (tag: SkillSituationTag, fragments: readonly EvidenceFragment[]) => {
    if (fragments.length > 0) situationSignals.set(tag, [...fragments]);
  };

  const ownership = matching(userOwned, hasUserOwnership);
  const apologyEvidence = matching(userCurrent, (fragment) => apology.test(fragment.text));
  const boundaryEvidence = matching(userCurrent, hasBoundary);
  const clarificationEvidence = matching(userCurrent, hasClarification);
  const requestEvidence = matching(userCurrent, hasRequest);
  const userPlanning = matching(userCurrent, hasPlanning);
  const responsePlanning =
    policy.action === "SUGGEST_REPLY" ? matching(other, hasPlanning) : ([] as EvidenceFragment[]);
  const planningEvidence = [...userPlanning, ...responsePlanning];
  const statusEvidence = matching(userCurrent, hasCurrentState);
  const statusRequests = matching(other, (fragment) => directStatusRequest.test(fragment.text));
  const expectationEvidence = matching(userCurrent, hasExpectation);
  const followUpEvidence = matching(userCurrent, (fragment) => followUp.test(fragment.text));
  const openThread = matching([...history, ...other], (fragment) =>
    priorOpenThread.test(fragment.text),
  );
  const supportedFollowUp = followUpEvidence.length > 0 && openThread.length > 0;
  const emotionalEvidence = matching(all, (fragment) => emotional.test(fragment.text));
  const conflictEvidence = matching(all, (fragment) => conflict.test(fragment.text));
  const pressureEvidence = matching(other, (fragment) => pressure.test(fragment.text));
  const invitationEvidence = matching(other, (fragment) => invitation.test(fragment.text));
  const declineEvidence = matching(
    userCurrent,
    (fragment) => explicitDecline.test(fragment.text) || hasBoundary(fragment),
  ).filter((fragment) => !uncertainDelivery.test(fragment.text));

  addIntent("apologize", apologyEvidence);
  addIntent("acknowledge_mistake", ownership);
  addIntent("validate_emotion", emotionalEvidence);
  addIntent(
    "reassure",
    matching(userOwned, (fragment) => reassure.test(fragment.text)),
  );
  addIntent("set_boundary", boundaryEvidence);
  addIntent("de_escalate", conflictEvidence);
  addIntent("decline", declineEvidence);
  addIntent(
    "ask_for_help",
    matching(userCurrent, (fragment) => help.test(fragment.text)),
  );
  if (supportedFollowUp) addIntent("follow_up", [...followUpEvidence, ...openThread]);
  addIntent("provide_status", [...statusEvidence, ...statusRequests]);
  addIntent("set_expectation", expectationEvidence);
  addIntent("plan", planningEvidence);
  addIntent("clarify", clarificationEvidence);
  addIntent("make_request", requestEvidence);
  if (options.experimentalCandidateRouting) {
    const perspective = matching(userCurrent, (fragment) =>
      perspectiveAcknowledgement.test(fragment.text),
    );
    const otherPerspective = matching(other, (fragment) => statedPerspective.test(fragment.text));
    if (perspective.length > 0 && otherPerspective.length > 0)
      addIntent("acknowledge_perspective", [...perspective, ...otherPerspective]);
    addIntent(
      "give_feedback",
      matching(userCurrent, (fragment) => constructiveFeedback.test(fragment.text)),
    );
  }

  addSituation("mistake", ownership);
  if (ownership.length > 0 && (statusRequests.length > 0 || statusEvidence.length > 0))
    addSituation("missed_commitment", [...ownership, ...statusRequests, ...statusEvidence]);
  addSituation("status_request", [...statusRequests, ...statusEvidence]);
  addSituation("emotional_support", emotionalEvidence);
  addSituation("pressure", [...pressureEvidence, ...boundaryEvidence]);
  addSituation("conflict", conflictEvidence);
  addSituation("planning", planningEvidence);
  addSituation("invitation", invitationEvidence);
  if (supportedFollowUp) addSituation("follow_up", [...followUpEvidence, ...openThread]);
  const requestSituationEvidence = requestEvidence.filter(
    ({ source }) => source === "USER_DRAFT" || source === "CONVERSATION_HISTORY",
  );
  addSituation("request", [
    ...requestSituationEvidence,
    ...clarificationEvidence,
    ...(supportedFollowUp ? openThread : []),
  ]);

  const context = SkillContextSchema.parse({
    action: policy.action,
    intent: policy.userIntent.value,
    situationTags: situationOrder.filter((tag) => situationSignals.has(tag)),
    intentTags: intentOrder.filter((tag) => intentSignals.has(tag)),
    language: {
      primary: request.analysis.language.primary,
      secondary: request.analysis.language.secondary,
      codeSwitching: request.analysis.language.codeSwitching,
    },
    draftPresent: Boolean(request.analysis.draft.text?.trim()),
    ambiguityMaterial: policy.ambiguity.material,
  });
  const signals: SkillContextSignalEvidence[] = [
    ...context.situationTags.map((tag) => ({
      kind: "SITUATION" as const,
      tag,
      sources: orderedSources(situationSignals.get(tag) ?? []),
    })),
    ...context.intentTags.map((tag) => ({
      kind: "INTENT" as const,
      tag,
      sources: orderedSources(intentSignals.get(tag) ?? []),
    })),
  ];
  return { profile: "SRS_2_5_PROPOSED", context, signals };
}

const legacyPlanning =
  /\b(?:when|what time|where|meet|meeting|schedule|around \d)\b|(?:几点|幾點|哪里|哪裡|见面|見面|大概\s*\d|安排)/iu;
const legacyRequest =
  /\b(?:can you|could you|please|would you)\b|(?:可以|能不能|请|請|麻烦|麻煩)/iu;
const legacyStatus =
  /\b(?:status|progress|updates?|finish(?:ed|ing)?|done|ready|testing|review(?:ed|ing)?|sent|working on|blocked|on track|delays?|delayed)\b|(?:进度|進度|状态|狀態|完成|测试|測試|检查|檢查|已发|已發|发了|發了|延迟|延遲)/iu;

function currentSources(
  tag: SkillIntentTag | SkillSituationTag,
  evidence: readonly EvidenceFragment[],
  proposedSignals: readonly SkillContextSignalEvidence[],
): SkillContextEvidenceSource[] {
  const proposed = proposedSignals.find((signal) => signal.tag === tag);
  if (proposed) return proposed.sources;
  const pattern =
    tag === "plan" || tag === "planning"
      ? legacyPlanning
      : tag === "make_request" || tag === "clarify" || tag === "request"
        ? legacyRequest
        : tag === "provide_status" || tag === "status_request"
          ? legacyStatus
          : tag === "invitation"
            ? /\b(?:want to|would you like|come|join)\b|(?:要不要|想不想|一起來|一起来)/iu
            : tag === "decline"
              ? /\b(?:can['’]?t|cannot|won['’]?t|will not|do not want to|don['’]?t want to)\b|(?:不想|不能|没法|沒法)/iu
              : null;
  const matches = pattern ? matching(evidence, (fragment) => pattern.test(fragment.text)) : [];
  return matches.length > 0 ? orderedSources(matches) : ["STRUCTURED_CONTEXT"];
}

export function deriveSkillContextForProfile(
  request: CoachingRequest,
  policy: CoachingPolicyDecision,
  profile: SkillContextSignalProfile,
  options: SkillContextDerivationOptions = {},
): SkillContextNormalizationResult {
  if (profile === "SRS_2_5_PROPOSED") return proposedResult(request, policy, options);
  const context = SkillContextSchema.parse(deriveSkillContext(request, policy, options));
  const evidence = evidenceFor(request, policy);
  const proposedSignals = proposedResult(request, policy, options).signals;
  return {
    profile: "CURRENT",
    context,
    signals: [
      ...context.situationTags.map((tag) => ({
        kind: "SITUATION" as const,
        tag,
        sources: currentSources(tag, evidence, proposedSignals),
      })),
      ...context.intentTags.map((tag) => ({
        kind: "INTENT" as const,
        tag,
        sources: currentSources(tag, evidence, proposedSignals),
      })),
    ],
  };
}
