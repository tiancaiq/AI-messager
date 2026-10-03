import {
  CoachingDecisionResultSchema,
  CoachingRequestSchema,
  CommunicationGuidanceSchema,
  CommunicationPlanSchema,
  ProviderConfigurationSchema,
  type CoachingDecision,
  type CoachingDecisionResult,
  type CoachingRequest,
  type CommunicationGuidance,
  type CommunicationPlan,
  type ProviderConfiguration,
  type SkillContext,
} from "@ai-message-coach/contracts";
import { createSkillEngine, initialSkillRegistry } from "@ai-message-coach/skills";

import {
  normalizeCommunicationProblem,
  type CommunicationProblem,
  type CommunicationProblemGoalKind,
} from "./communication-problem.js";
import { decideCoachingAction, type CoachingPolicyDecision } from "./coaching-policy.js";
import { runB2SkillShadow, type SkillShadowTrace } from "./skill-shadow.js";
import { deriveSkillContext, type CommunicationSkillPlanner } from "./skill-context.js";

export interface CoachingTextGenerator {
  readonly configuration: ProviderConfiguration;
  generateCoachingDecision(
    request: CoachingRequest,
    policy: CoachingPolicyDecision,
    communicationGuidance: CommunicationGuidance,
  ): Promise<CoachingDecisionResult>;
}

export interface CoachingEngineOptions {
  skillPlanner?: CommunicationSkillPlanner;
  onCommunicationPlan?: (plan: CommunicationPlan) => void;
  onProblemNormalization?: (status: {
    status: "NORMALIZED" | "FAILED";
    goalKind: CommunicationProblemGoalKind | null;
  }) => void;
  onShadowComparison?: (trace: SkillShadowTrace) => void;
}

const safeFailure: CoachingDecisionResult = {
  ok: false,
  error: { code: "PROVIDER_ERROR", message: "A message could not be generated. Please try again." },
};

const defaultSkillEngine = createSkillEngine(initialSkillRegistry);
const defaultSkillPlanner: CommunicationSkillPlanner = {
  plan: (context) => defaultSkillEngine.select(context),
};
const noCommunicationPlan: CommunicationPlan = {
  status: "NONE",
  selectedSkills: [],
  principles: [],
  avoid: [],
};

function inspectPlan(options: CoachingEngineOptions, plan: CommunicationPlan): void {
  try {
    options.onCommunicationPlan?.(structuredClone(plan));
  } catch {
    // Development inspection must never change product behavior.
  }
}

function inspectProblemNormalization(
  options: CoachingEngineOptions,
  status: { status: "NORMALIZED" | "FAILED"; goalKind: CommunicationProblemGoalKind | null },
): void {
  try {
    options.onProblemNormalization?.(status);
  } catch {
    // In-process structural inspection must never change product behavior.
  }
}

function inspectShadowComparison(
  options: CoachingEngineOptions,
  problem: CommunicationProblem | null,
  context: SkillContext | null,
  action: CoachingPolicyDecision["action"],
  productionPlan: CommunicationPlan,
): void {
  try {
    const trace = runB2SkillShadow(problem, context, action, productionPlan);
    options.onShadowComparison?.(structuredClone(trace));
  } catch {
    // Shadow comparison must never affect policy, Composer, provider calls or public results.
  }
}

function guidanceForGeneration(plan: CommunicationPlan): CommunicationGuidance {
  return CommunicationGuidanceSchema.parse({
    principles: plan.principles,
    avoid: plan.avoid,
  });
}

const uncertainIntent =
  /\b(?:uncertain|not (?:yet )?(?:certain|sure)|maybe|possibly|probably|likely|unlikely|approximately|approximate|roughly|tentative|might|may|could)\b|\baround\s+\d|(?:不确定|不確定|可能|也许|也許|大概|差不多|暂定|暫定)/iu;
const negatedRefusalIntent =
  /\b(?:do not|don['’]t|will not|won['’]t|would not|wouldn['’]t)\s+(?:want to\s+)?(?:decline|refuse|reject)\b|(?:不想|不会|不會)\s*(?:拒绝|拒絕|婉拒)/iu;
const uncertaintyOutput =
  /\b(?:uncertain|not (?:yet )?(?:certain|sure)|maybe|possibly|probably|likely|unlikely|approximately|approximate|around|roughly|about|tentative|think|expect|hope|aim|plan|might|may|could|should)\b|(?:不确定|不確定|可能|也许|也許|大概|差不多|暂定|暫定|应该|應該|预计|預計|希望|打算|计划|計劃)/iu;
const hardenedCertaintyOutput =
  /\b(?:definitely|certainly|guaranteed|for sure|without (?:a )?doubt)\b|(?:一定|肯定|保证|保證|确认无误|確認無誤)/iu;
const refusalIntent =
  /\b(?:declin(?:e|ing)|refus(?:e|ing)|reject(?:ing)?|cannot|can['’]t|can not|won['’]t|will not|do not want|don['’]t want|not able|unable|not available)\b|(?:拒绝|拒絕|婉拒|不想|不能|无法|無法|没办法|沒辦法|不会|不會|不参加|不參加)/iu;
const refusalOutput =
  /\b(?:declin(?:e|ing)|refus(?:e|ing)|reject(?:ing)?|cannot|can['’]t|can not|won['’]t|will not|do not want|don['’]t want|not able|unable|not available|rather not|have to pass|need to pass|sit this out|skip this|need more time|not possible|isn['’]t possible|won['’]t work|not going to)\b|(?:拒绝|拒絕|婉拒|不想|不能|无法|無法|没办法|沒辦法|不会|不會|不参加|不參加|这次不行|這次不行)/iu;
const hardAcceptanceOutput =
  /\b(?:accept|accepted|will attend|can attend|i(?:'|’)ll (?:come|join|go|attend)|happy to (?:come|join|go|attend)|count me in|see you there)\b|(?:没问题|沒問題|接受|参加|參加|我会去|我會去|算我一个|算我一個)/iu;
const negatedRefusalOutput =
  /\b(?:(?:(?:cannot|can['’]t|can not|could not|couldn['’]t|will not|won['’]t|would not|wouldn['’]t)\s+(?:bring\s+(?:myself|ourselves)\s+to\s+)?)|(?:(?:refus|declin)(?:e|ed|ing)\s+to\s+))(?:decline|refuse|reject|say no|turn(?:\s+(?:it|this|that|the (?:offer|invitation|request)))?\s+down)\b/giu;
const nonRefusalInabilityOutput =
  /\b(?:cannot|can['’]t|can not|could not|couldn['’]t)\s+(?:wait\s+to\s+(?:come|join|go|attend)|resist)\b/giu;
const negativeCommitmentIntent =
  /\b(?:cannot|can['’]t|can not|won['’]t|will not|not able|unable|not available)\b|(?:不能|无法|無法|没办法|沒辦法|不会|不會)/iu;
const positiveCommitmentOutput =
  /\b(?:(?:i|we)(?:'|’)ll|(?:i|we) will|(?:i|we) can(?!['’]?t\b))\s+(?:come|join|go|attend|do|send|finish|complete|make|help|handle|review|deliver|be there|take care)|\b(?:definitely|guarantee|promise)\b|(?:我(?:会|會)|我们(?:会|會)|我們(?:会|會))(?:去|来|來|参加|參加|完成|做|发|發|发送|發送|处理|處理|帮|幫)|(?:一定|保证|保證)/iu;
const factualAnchor =
  /(?:\b\d{1,4}(?::\d{2})?(?:\s?(?:a\.?m\.?|p\.?m\.?))?\b|\b(?:today|tomorrow|tonight|yesterday|monday|tuesday|wednesday|thursday|friday|saturday|sunday|morning|afternoon|evening|weekend|next week|this week|last week)\b|(?:今天|明天|今晚|昨天|上午|下午|晚上|周末|週末|下周|下週|本周|本週|上周|上週|星期[一二三四五六日天]|周[一二三四五六日天]|週[一二三四五六日天]|\d{1,2}[点點時时月日号號]))/giu;

function normalizedText(value: string): string {
  return value.normalize("NFKC").toLowerCase();
}

function generatedMessages(decision: CoachingDecision): string[] {
  if (decision.action === "REWRITE_DRAFT" || decision.action === "COMPLETE_DRAFT")
    return [decision.primary, ...decision.alternatives.map(({ text }) => text)];
  if (decision.action === "SUGGEST_REPLY") return decision.replies.map(({ text }) => text);
  return [];
}

function explicitIntent(request: CoachingRequest, policy: CoachingPolicyDecision): string {
  if (request.selection !== null)
    return request.selection.kind === "ACTION"
      ? request.selection.intent
      : request.selection.answer;
  return request.analysis.draft.text ?? policy.userIntent.value ?? "";
}

function factualAnchors(value: string): Set<string> {
  return new Set([...normalizedText(value).matchAll(factualAnchor)].map(([match]) => match));
}

function hasActualRefusalOutput(value: string): boolean {
  return refusalOutput.test(
    value.replace(negatedRefusalOutput, "").replace(nonRefusalInabilityOutput, ""),
  );
}

// These are conservative, explainable lexical guards for high-signal invariants. They do not
// claim general semantic equivalence or complete hallucination detection; live human review remains
// necessary for paraphrases and unsupported facts outside the bounded anchors below.
function passesDeterministicOutputGuards(
  decision: CoachingDecision,
  request: CoachingRequest,
  policy: CoachingPolicyDecision,
): boolean {
  if (
    decision.action !== policy.action ||
    decision.userIntent.value !== policy.userIntent.value ||
    decision.userIntent.confidence !== policy.userIntent.confidence ||
    decision.actionConfidence !== policy.actionConfidence ||
    decision.ambiguity.material !== policy.ambiguity.material ||
    decision.ambiguity.reason !== policy.ambiguity.reason
  )
    return false;

  const intent = normalizedText(explicitIntent(request, policy));
  const refusalRequired = refusalIntent.test(intent) && !negatedRefusalIntent.test(intent);
  const requiredAnchors = factualAnchors(intent);
  const sourceAnchors = factualAnchors(
    [
      ...request.analysis.messages.map(({ text }) => text),
      request.analysis.draft.text ?? "",
      request.selection?.kind === "ACTION" ? request.selection.intent : "",
      request.selection?.kind === "CLARIFICATION" ? request.selection.answer : "",
    ].join("\n"),
  );

  return generatedMessages(decision).every((message) => {
    const normalized = normalizedText(message);
    if (
      uncertainIntent.test(intent) &&
      (!uncertaintyOutput.test(normalized) || hardenedCertaintyOutput.test(normalized))
    )
      return false;
    if (
      refusalRequired &&
      (!hasActualRefusalOutput(normalized) || hardAcceptanceOutput.test(normalized))
    )
      return false;
    if (negativeCommitmentIntent.test(intent) && positiveCommitmentOutput.test(normalized))
      return false;
    const outputAnchors = factualAnchors(normalized);
    return (
      [...requiredAnchors].every((anchor) => outputAnchors.has(anchor)) &&
      [...outputAnchors].every((anchor) => sourceAnchors.has(anchor))
    );
  });
}

function localDecision(policy: CoachingPolicyDecision): CoachingDecision | undefined {
  const base = {
    userIntent: policy.userIntent,
    actionConfidence: policy.actionConfidence,
    ambiguity: policy.ambiguity,
  };

  if (policy.action === "SUGGEST_ACTIONS" && policy.actions) {
    return { ...base, action: policy.action, actions: policy.actions };
  }
  if (policy.action === "ASK_CLARIFICATION" && policy.clarification) {
    return { ...base, action: policy.action, ...policy.clarification };
  }
  if (policy.action === "NO_REPLY_NEEDED" && policy.noReply) {
    return { ...base, action: policy.action, ...policy.noReply };
  }
  return undefined;
}

export async function coachConversation(
  generator: CoachingTextGenerator,
  request: CoachingRequest,
  options: CoachingEngineOptions = {},
): Promise<CoachingDecisionResult> {
  const parsedRequest = CoachingRequestSchema.safeParse(request);
  const parsedConfiguration = ProviderConfigurationSchema.safeParse(generator.configuration);
  if (!parsedRequest.success || !parsedConfiguration.success) return safeFailure;

  let problem: CommunicationProblem | null = null;
  try {
    problem = normalizeCommunicationProblem(parsedRequest.data);
    inspectProblemNormalization(options, { status: "NORMALIZED", goalKind: problem.goal.kind });
  } catch {
    inspectProblemNormalization(options, { status: "FAILED", goalKind: null });
  }

  const policy = decideCoachingAction(parsedRequest.data);
  const deterministic = localDecision(policy);
  if (deterministic) {
    inspectPlan(options, noCommunicationPlan);
    let shadowContext: SkillContext | null = null;
    try {
      shadowContext = deriveSkillContext(parsedRequest.data, policy);
    } catch {
      // Production local decisions do not depend on Skill context.
    }
    inspectShadowComparison(options, problem, shadowContext, policy.action, noCommunicationPlan);
    return { ok: true, decision: deterministic };
  }

  let communicationPlan: CommunicationPlan;
  let skillContext: SkillContext | null = null;
  try {
    skillContext = deriveSkillContext(parsedRequest.data, policy);
    communicationPlan = CommunicationPlanSchema.parse(
      (options.skillPlanner ?? defaultSkillPlanner).plan(skillContext),
    );
  } catch {
    communicationPlan = { status: "FAILED", selectedSkills: [], principles: [], avoid: [] };
  }
  inspectPlan(options, communicationPlan);
  inspectShadowComparison(options, problem, skillContext, policy.action, communicationPlan);

  if (!parsedConfiguration.data.configured) {
    return {
      ok: false,
      error: { code: "NOT_CONFIGURED", message: "Configure an API key, then try again." },
    };
  }
  if (
    !parsedConfiguration.data.capabilities.textGeneration ||
    !parsedConfiguration.data.capabilities.structuredOutput
  ) {
    return {
      ok: false,
      error: {
        code: "MODEL_UNAVAILABLE",
        message: "The selected model cannot generate structured coaching.",
      },
    };
  }

  try {
    const result = await generator.generateCoachingDecision(
      parsedRequest.data,
      policy,
      guidanceForGeneration(communicationPlan),
    );
    const parsed = CoachingDecisionResultSchema.safeParse(result);
    if (
      !parsed.success ||
      (parsed.data.ok &&
        !passesDeterministicOutputGuards(parsed.data.decision, parsedRequest.data, policy))
    )
      return {
        ok: false,
        error: {
          code: "INVALID_RESPONSE",
          message: "The provider returned an invalid coaching result.",
        },
      };
    return parsed.data;
  } catch {
    return safeFailure;
  }
}
