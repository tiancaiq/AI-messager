import {
  AgentActionSchema,
  CoachingRequestSchema,
  CommunicationGuidanceSchema,
  type CoachingRequest,
  type CommunicationGuidance,
} from "@ai-message-coach/contracts";
import { z } from "zod";

import {
  normalizeCommunicationProblem,
  type UserSuppliedCommunicationContext,
} from "./communication-problem.js";
import type { CoachingPolicyDecision } from "./coaching-policy.js";

const AnchorSchema = z
  .object({
    concept: z.enum([
      "REFUSAL",
      "ACCEPTANCE",
      "UNCERTAINTY",
      "TIMING",
      "STATUS",
      "COMMITMENT",
      "REQUEST",
      "BOUNDARY_SCOPE",
      "LANGUAGE_SCRIPT",
    ]),
    value: z.string().trim().min(1).max(80),
    certainty: z.enum(["DEFINITE", "TENTATIVE", "APPROXIMATE"]),
    owner: z.enum(["USER", "CONTEXT"]),
    sourceRef: z.string().trim().min(1).max(72),
  })
  .strict();

export const MustNotInventCategorySchema = z.enum([
  "NO_UPDATE_OR_PROGRESS",
  "ONGOING_CHECKING",
  "FOLLOW_UP_PROMISE",
  "SEND_COMMITMENT",
  "REVIEW_COMMITMENT",
  "AVAILABILITY",
  "USER_INFORMATION_STATE",
  "DEADLINE",
  "IDENTITY",
  "RELATIONSHIP",
  "EMOTIONAL_STATE",
  "FAULT_ADMISSION",
  "PRIOR_ACTION",
  "REASON_OR_EXCUSE",
]);

export const ComposerTaskSchema = z
  .object({
    fixedAction: AgentActionSchema,
    mustPreserve: z.array(AnchorSchema).max(16),
    mustNotInvent: z.array(MustNotInventCategorySchema).max(14),
    coreCommunicationGuidance: CommunicationGuidanceSchema,
    optionalStyle: z
      .object({
        agentInstruction: z
          .object({
            value: z.string().trim().min(1).max(500),
            provenance: z.literal("USER_SUPPLIED"),
          })
          .strict()
          .nullable(),
        priorities: z.array(z.string().trim().min(1).max(120)).max(6),
      })
      .strict(),
    statusReplyMode: z.enum(["NONE", "ASK_SCOPE_ONLY"]),
  })
  .strict()
  .superRefine((task, context) => {
    if (
      task.statusReplyMode === "ASK_SCOPE_ONLY" &&
      (task.fixedAction !== "SUGGEST_REPLY" ||
        !task.mustNotInvent.includes("NO_UPDATE_OR_PROGRESS") ||
        !task.mustNotInvent.includes("USER_INFORMATION_STATE"))
    )
      context.addIssue({ code: "custom", message: "Contradictory status reply task." });
    const conflicting = [
      ["COMMITMENT", "SEND_COMMITMENT"],
      ["COMMITMENT", "REVIEW_COMMITMENT"],
    ] as const;
    for (const [concept, category] of conflicting) {
      if (
        task.mustPreserve.some(
          ({ concept: item, value }) => item === concept && value === category,
        ) &&
        task.mustNotInvent.includes(category)
      )
        context.addIssue({ code: "custom", message: "Contradictory commitment task." });
    }
    const refs = task.mustPreserve.map(({ concept, value, sourceRef }) =>
      JSON.stringify([concept, value, sourceRef]),
    );
    if (new Set(refs).size !== refs.length)
      context.addIssue({ code: "custom", message: "Duplicate meaning anchor." });
    if (new Set(task.mustNotInvent).size !== task.mustNotInvent.length)
      context.addIssue({ code: "custom", message: "Duplicate non-invention category." });
    if (
      task.mustPreserve.some(
        ({ concept, value, owner }) =>
          concept === "BOUNDARY_SCOPE" && (owner !== "USER" || !boundaryAnchorValue.test(value)),
      )
    )
      context.addIssue({ code: "custom", message: "Invalid boundary-scope anchor." });
  });

export type ComposerTask = z.infer<typeof ComposerTaskSchema>;
export type MustNotInventCategory = z.infer<typeof MustNotInventCategorySchema>;

const timing =
  /\b(?:today|tomorrow|tonight|monday|tuesday|wednesday|thursday|friday|saturday|sunday|\d{1,2}(?::\d{2})?\s?(?:a\.?m\.?|p\.?m\.?))\b|(?:今天|明天|今晚|下午三[点點時时]|上午|下午|晚上|\d{1,2}[点點時时])/giu;
const uncertainty =
  /\b(?:maybe|might|may|probably|possibly|around|approximately|not sure|need to check|could(?!\s+you\b))\b|(?:可能|也许|也許|大概|差不多|不确定|不確定|需要确认|需要確認)/iu;
const approximate = /\b(?:around|approximately|about)\b|(?:大概|差不多|左右)/iu;
const refusal =
  /\b(?:cannot|can['’]t|won['’]t|will not|decline|refuse|don['’]t want|do not want|not willing|i(?:['’]ll| will) pass)\b|(?:不能|不参加|不參加|拒绝|拒絕|不想)/iu;
const directRequest = /\b(?:please|could you|can you|would you)\b|(?:请|請|麻烦|麻煩)/iu;
const statusRequest = /\b(?:status|progress|update)\b|(?:進度|进度|更新|진행 상황|업데이트)/iu;
const statusFact =
  /\b(?:testing|finished|completed|blocked|in progress|on track|delayed)\b|(?:完成|延遲|延迟|進行中|进行中)/iu;
const noUpdateFact =
  /\b(?:no (?:new |concrete )?(?:update|progress)|nothing (?:new )?to report|don['’]t have (?:an? |any )?update)\b|(?:沒有|没有|還沒有|还没有).{0,8}(?:進度|进度|更新)|(?:업데이트|진행 상황).{0,8}(?:없습니다|없어요)/iu;
const checkingFact =
  /\b(?:(?:i(?:['’]m| am)|we(?:['’]re| are)) (?:still )?(?:checking|verifying|confirming))\b|(?:正在|還在|还在).{0,5}(?:確認|确认|核實|核实)|확인 중/iu;
const followUpFact =
  /\b(?:i(?:['’]ll| will)|we(?:['’]ll| will))\s+(?:update|follow up|let you know|send (?:an? |the )?update|share (?:an? |the )?update)\b|(?:我|我们|我們)(?:会|會).{0,5}(?:更新|回覆|回复)|업데이트드리겠습니다/iu;
const sendCommitment =
  /\b(?:i(?:['’]ll| will)|we(?:['’]ll| will))\s+(?:send|share|deliver)\b|(?:我|我们|我們)(?:会|會)(?:发|發|发送|發送)|(?:보내|전달)(?:드리겠습니다|겠습니다)/iu;
const reviewCommitment =
  /\b(?:i(?:['’]ll| will)|we(?:['’]ll| will))\s+(?:review|check|look over)\b|(?:我|我们|我們)(?:会|會)(?:看|檢查|检查|審閱|审阅)/iu;
const sendAssertion = /\b(?:i|we) can (?:send|share|deliver)\b/iu;
const reviewAssertion = /\b(?:i|we) can (?:review|check|look over)\b/iu;
const availabilityFact =
  /\b(?:i(?:['’]m| am) (?:free|available)|i can make it|i might be (?:free|available)|i may be (?:free|available))\b|(?:我|我们|我們)(?:有空|沒空|没空|可以参加|可以參加)/iu;
const informationFact =
  /\b(?:i (?:don['’]t|do not) have (?:enough )?(?:information|context|details)|i need (?:more )?(?:information|context|details)|i(?:['’]m| am) not sure|i (?:haven['’]t|have not) decided|i need to check|i (?:might|may)\b)\b|(?:我|我们|我們).{0,5}(?:沒有|没有|需要).{0,6}(?:資訊|信息|資料|资料)|(?:可能|也许|也許|不確定|不确定)/iu;
const explicitEmotion =
  /\b(?:i(?:['’]m| am) (?:upset|frustrated|sad|angry)|i feel (?:upset|frustrated|sad|angry))\b|(?:我很|我感到)(?:難過|难过|沮喪|沮丧|生氣|生气)/iu;
const thanksExpression = /\b(?:thanks|thank you)\b|(?:謝謝|谢谢|感謝|感谢)/iu;
const affirmativeAnswer = /^(?:yes[, ]+)?i can[.!。]?\s*$|^(?:yes|sure)[.!。]?\s*$/iu;
const otherSendRequest =
  /\b(?:can|could|would) you (?:please )?(?:send|share|deliver)\b|(?:發|发|发送|發送|보내)/iu;
const otherReviewRequest =
  /\b(?:can|could|would) you (?:please )?(?:review|check|look over)\b|(?:審閱|审阅|檢查|检查|검토)/iu;
const unsupportedInformationClaim =
  /\b(?:i (?:don['’]t|do not|haven['’]t|have not) have (?:enough |sufficient |the )?(?:information|context|details)|i need (?:more )?(?:information|context|details)|i(?:['’]m| am) not able to (?:provide|give|share) (?:an? )?(?:accurate |reliable )?(?:progress |status )?update (?:based on|without)|i(?:['’]m| am) not sure|i (?:haven['’]t|have not) decided|i need to check)\b|(?:我|我們|我们)(?:目前|這邊|这边)?(?:沒有|没有).{0,9}(?:資訊|信息|資料|资料|掌握)|(?:현재 대화|이 대화).{0,30}(?:정보|진행 상황).{0,12}(?:없어|없습니다)/iu;
const assertedEmotion =
  /\b(?:you (?:are|feel)|you(?:['’]re| are) (?:clearly )?|i (?:know|understand) (?:that )?you(?:['’]re| are)) (?:upset|frustrated|sad|angry)\b|(?:你|您)(?:很|感到)(?:難過|难过|沮喪|沮丧|生氣|生气)/iu;

type BoundaryKind = "STOP_PRESSURE" | "CAPACITY_LIMIT";
type BoundaryScope = "DURABLE_OR_UNQUALIFIED" | "TEMPORARY" | "UNKNOWN";
const boundaryAnchorValue =
  /^(?:STOP_PRESSURE|CAPACITY_LIMIT):(?:DURABLE_OR_UNQUALIFIED|TEMPORARY|UNKNOWN)$/u;
const boundaryPatterns: readonly { kind: BoundaryKind; pattern: RegExp; language: "en" | "zh" }[] =
  [
    {
      kind: "STOP_PRESSURE",
      language: "en",
      pattern:
        /\b(?:please\s+)?(?:don['’]t|do not|stop|quit)\s+(?:(?:keep|continue)\s+)?(?:asking|pressuring|pushing|nagging|pestering)(?:\s+(?:me|us))?(?:\s+about\s+(?:this|that|it))?/giu,
    },
    {
      kind: "STOP_PRESSURE",
      language: "zh",
      pattern:
        /(?:請|请)?(?:先|暫時|暂时)?(?:不要|別|别|停止|停)(?:再|一直|繼續|继续)?(?:催|問|问|逼|施壓|施压)(?:我|我們|我们)?/gu,
    },
    {
      kind: "CAPACITY_LIMIT",
      language: "en",
      pattern:
        /\b(?:i|we)\s+(?:can['’]t|cannot|can not|won['’]t|will not|am not able to|are not able to)\s+(?:(?:keep|continue)\s+)?(?:(?:taking|take)\s+on\s+(?:more|extra)\s+work|(?:doing|do)\s+this)\b/giu,
    },
    {
      kind: "CAPACITY_LIMIT",
      language: "zh",
      pattern:
        /(?:我|我們|我们)(?:先|暫時|暂时)?(?:不能|沒辦法|没办法|無法|无法)(?:再|繼續|继续)?(?:這樣|这样|繼續|继续|做|承擔|承担|接)(?:做|下去)?/gu,
    },
  ];
const englishTemporary =
  /(?:for now|at the moment|for the moment|for the time being|temporarily|right now)/iu;
const englishTemporaryPrefix =
  /(?:for now|at the moment|for the moment|for the time being|temporarily|right now)\s*,?\s*$/iu;
const englishTemporarySuffix =
  /^\s+(?:for now|at the moment|for the moment|for the time being|temporarily|right now)\b/iu;
const chineseTemporary = /(?:先|暫時|暂时)/u;
const chineseTemporaryPrefix = /(?:先|暫時|暂时)\s*[,，]?\s*$/u;
const unknownBoundaryPrefix = /(?:maybe|perhaps|可能|也許|也许)\s*[,，]?\s*$/iu;
const sentenceBreak = /[.!?。！？;；\n]/gu;

function precedingClause(text: string, start: number): string {
  const before = text.slice(0, start);
  let lastBreak = -1;
  for (const match of before.matchAll(sentenceBreak)) lastBreak = match.index;
  return before.slice(lastBreak + 1);
}

/** Narrow clause-attached scope recognition, never a global temporal-word ban. */
function boundaryScopes(text: string): Map<BoundaryKind, Set<BoundaryScope>> {
  const normalized = text.normalize("NFKC");
  const found = new Map<BoundaryKind, Set<BoundaryScope>>();
  for (const { kind, pattern, language } of boundaryPatterns) {
    for (const match of normalized.matchAll(pattern)) {
      const before = precedingClause(normalized, match.index);
      const after = normalized.slice(match.index + match[0].length);
      const temporary =
        language === "en"
          ? englishTemporary.test(match[0]) ||
            englishTemporaryPrefix.test(before) ||
            englishTemporarySuffix.test(after)
          : chineseTemporary.test(match[0]) || chineseTemporaryPrefix.test(before);
      const scope: BoundaryScope = temporary
        ? "TEMPORARY"
        : unknownBoundaryPrefix.test(before)
          ? "UNKNOWN"
          : "DURABLE_OR_UNQUALIFIED";
      const scopes = found.get(kind) ?? new Set<BoundaryScope>();
      scopes.add(scope);
      found.set(kind, scopes);
    }
  }
  return found;
}

export function userOwnedEvidenceText(request: CoachingRequest): string {
  return [
    ...request.analysis.messages
      .filter(({ speaker, speakerConfidence }) => speaker === "USER" && speakerConfidence >= 0.8)
      .map(({ text }) => text),
    ...(request.analysis.draft.text !== null && request.analysis.draft.confidence >= 0.8
      ? [request.analysis.draft.text]
      : []),
    ...(request.selection !== null
      ? [request.selection.kind === "ACTION" ? request.selection.intent : request.selection.answer]
      : []),
  ].join("\n");
}

export function buildComposerTask(
  rawRequest: CoachingRequest,
  policy: CoachingPolicyDecision,
  rawGuidance: CommunicationGuidance,
  suppliedContext: UserSuppliedCommunicationContext = {},
): ComposerTask {
  const request = CoachingRequestSchema.parse(rawRequest);
  const problem = normalizeCommunicationProblem(request, suppliedContext);
  const guidance = CommunicationGuidanceSchema.parse(rawGuidance);
  const source =
    problem.meaningToPreserve !== null &&
    (problem.meaningToPreserve.provenance === "USER_SUPPLIED" ||
      (problem.sourceDraft?.confidence ?? 0) >= 0.8)
      ? {
          text: problem.meaningToPreserve.text,
          sourceRef:
            problem.meaningToPreserve.provenance === "USER_SUPPLIED" ? "SELECTION" : "DRAFT",
        }
      : null;
  const acceptedRequest =
    source !== null && affirmativeAnswer.test(source.text) && problem.latestOtherMessage !== null;
  const acceptedSend = acceptedRequest && otherSendRequest.test(problem.latestOtherMessage!.text);
  const acceptedReview =
    acceptedRequest && otherReviewRequest.test(problem.latestOtherMessage!.text);
  const userText = userOwnedEvidenceText(request);
  const categories = new Set<MustNotInventCategory>([
    "DEADLINE",
    "IDENTITY",
    "RELATIONSHIP",
    "FAULT_ADMISSION",
    "REASON_OR_EXCUSE",
  ]);
  if (!noUpdateFact.test(userText)) categories.add("NO_UPDATE_OR_PROGRESS");
  if (!checkingFact.test(userText)) categories.add("ONGOING_CHECKING");
  if (!followUpFact.test(userText)) categories.add("FOLLOW_UP_PROMISE");
  if (!sendCommitment.test(userText) && !sendAssertion.test(userText) && !acceptedSend)
    categories.add("SEND_COMMITMENT");
  if (!reviewCommitment.test(userText) && !reviewAssertion.test(userText) && !acceptedReview)
    categories.add("REVIEW_COMMITMENT");
  if (!availabilityFact.test(userText)) categories.add("AVAILABILITY");
  if (!informationFact.test(userText)) categories.add("USER_INFORMATION_STATE");
  if (!thanksExpression.test(userText)) categories.add("PRIOR_ACTION");
  if (
    !request.analysis.messages.some(
      ({ speaker, speakerConfidence, text }) =>
        speaker === "OTHER" && speakerConfidence >= 0.8 && explicitEmotion.test(text),
    )
  )
    categories.add("EMOTIONAL_STATE");

  const anchors: ComposerTask["mustPreserve"] = [];
  if (source !== null) {
    const sourceText = source.text.normalize("NFKC");
    const tentative = uncertainty.test(sourceText);
    const certainty = tentative ? "TENTATIVE" : "DEFINITE";
    if (refusal.test(sourceText))
      anchors.push({
        concept: "REFUSAL",
        value: "refusal",
        certainty,
        owner: "USER",
        sourceRef: source.sourceRef,
      });
    if (acceptedSend || acceptedReview)
      anchors.push({
        concept: "ACCEPTANCE",
        value: acceptedSend ? "accepted send request" : "accepted review request",
        certainty: "DEFINITE",
        owner: "USER",
        sourceRef: source.sourceRef,
      });
    if (tentative)
      anchors.push({
        concept: "UNCERTAINTY",
        value: "tentative",
        certainty: "TENTATIVE",
        owner: "USER",
        sourceRef: source.sourceRef,
      });
    if (directRequest.test(sourceText))
      anchors.push({
        concept: "REQUEST",
        value: "user request",
        certainty: "DEFINITE",
        owner: "USER",
        sourceRef: source.sourceRef,
      });
    for (const [kind, scopes] of boundaryScopes(sourceText)) {
      // Conflicting source clauses cannot support a single high-priority scope anchor.
      if (scopes.size !== 1) continue;
      const scope = [...scopes][0]!;
      anchors.push({
        concept: "BOUNDARY_SCOPE",
        value: `${kind}:${scope}`,
        certainty: "DEFINITE",
        owner: "USER",
        sourceRef: source.sourceRef,
      });
    }
    const seenTiming = new Set<string>();
    for (const match of sourceText.matchAll(timing)) {
      const value = match[0].toLowerCase();
      if (seenTiming.has(value)) continue;
      seenTiming.add(value);
      anchors.push({
        concept: "TIMING",
        value,
        certainty: approximate.test(sourceText) ? "APPROXIMATE" : certainty,
        owner: "USER",
        sourceRef: source.sourceRef,
      });
    }
    for (const [category, pattern] of [
      ["SEND_COMMITMENT", sendCommitment],
      ["REVIEW_COMMITMENT", reviewCommitment],
    ] as const)
      if (pattern.test(sourceText))
        anchors.push({
          concept: "COMMITMENT",
          value: category,
          certainty,
          owner: "USER",
          sourceRef: source.sourceRef,
        });
  }
  for (const message of request.analysis.messages) {
    if (message.speaker !== "USER" || message.speakerConfidence < 0.8) continue;
    const match =
      message.text.match(noUpdateFact) ??
      message.text.match(checkingFact) ??
      message.text.match(statusFact);
    if (match)
      anchors.push({
        concept: "STATUS",
        value: match[0].slice(0, 80),
        certainty: "DEFINITE",
        owner: "USER",
        sourceRef: `MESSAGE:${message.id}`,
      });
  }
  anchors.push({
    concept: "LANGUAGE_SCRIPT",
    value: `${problem.language.primary}:${problem.language.script}`,
    certainty: "DEFINITE",
    owner: "CONTEXT",
    sourceRef: "LANGUAGE",
  });
  const lastOther = problem.latestOtherMessage;
  const unknownStatusReply =
    policy.action === "SUGGEST_REPLY" &&
    lastOther !== null &&
    statusRequest.test(lastOther.text) &&
    !statusFact.test(userText) &&
    !noUpdateFact.test(userText) &&
    !checkingFact.test(userText) &&
    !followUpFact.test(userText) &&
    !informationFact.test(userText);

  return ComposerTaskSchema.parse({
    fixedAction: policy.action,
    mustPreserve: anchors,
    mustNotInvent: [...categories],
    coreCommunicationGuidance: guidance,
    optionalStyle: {
      agentInstruction: problem.instruction,
      priorities: problem.stylisticPriorities.map(({ value }) => value),
    },
    statusReplyMode: unknownStatusReply ? "ASK_SCOPE_ONLY" : "NONE",
  });
}

export type ComposerTaskViolation =
  | "STATUS_REPLY_GROUNDING"
  | "UNSUPPORTED_INFORMATION_STATE"
  | "UNSUPPORTED_COMMITMENT"
  | "UNSUPPORTED_EMOTION"
  | "BOUNDARY_TEMPORAL_WEAKENING"
  | "BOUNDARY_TEMPORAL_STRENGTHENING";

/** High-signal backstop only; it does not replace human semantic review. */
export function detectComposerTaskViolation(
  candidate: string,
  task: ComposerTask,
): ComposerTaskViolation | null {
  const normalized = candidate.normalize("NFKC");
  if (
    task.mustNotInvent.includes("USER_INFORMATION_STATE") &&
    unsupportedInformationClaim.test(normalized)
  )
    return "UNSUPPORTED_INFORMATION_STATE";
  if (
    (task.mustNotInvent.includes("SEND_COMMITMENT") &&
      (sendCommitment.test(normalized) || sendAssertion.test(normalized))) ||
    (task.mustNotInvent.includes("REVIEW_COMMITMENT") &&
      (reviewCommitment.test(normalized) || reviewAssertion.test(normalized))) ||
    (task.mustNotInvent.includes("AVAILABILITY") && availabilityFact.test(normalized))
  )
    return "UNSUPPORTED_COMMITMENT";
  if (task.mustNotInvent.includes("EMOTIONAL_STATE") && assertedEmotion.test(normalized))
    return "UNSUPPORTED_EMOTION";
  const candidateScopes = boundaryScopes(normalized);
  for (const anchor of task.mustPreserve) {
    if (anchor.concept !== "BOUNDARY_SCOPE") continue;
    const [kind, sourceScope] = anchor.value.split(":") as [BoundaryKind, BoundaryScope];
    const observedScopes = candidateScopes.get(kind);
    // An unrecognized paraphrase needs semantic review; this bounded guard must abstain.
    if (!observedScopes) continue;
    if (sourceScope !== "TEMPORARY" && observedScopes.has("TEMPORARY"))
      return "BOUNDARY_TEMPORAL_WEAKENING";
    if (
      sourceScope === "TEMPORARY" &&
      (observedScopes.has("DURABLE_OR_UNQUALIFIED") || observedScopes.has("UNKNOWN"))
    )
      return "BOUNDARY_TEMPORAL_STRENGTHENING";
  }
  if (task.statusReplyMode === "ASK_SCOPE_ONLY" && !/[?？]\s*$/u.test(normalized))
    return "STATUS_REPLY_GROUNDING";
  return null;
}
