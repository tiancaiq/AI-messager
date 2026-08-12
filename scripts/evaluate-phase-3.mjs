import { OpenAiCoachingAdapter, coachConversation } from "@ai-message-coach/ai";
import { coachingEvaluationFixtures } from "@ai-message-coach/test-fixtures";

const limitArgument = process.argv.indexOf("--limit");
const limit =
  limitArgument === -1
    ? coachingEvaluationFixtures.length
    : Number.parseInt(process.argv[limitArgument + 1] ?? "", 10);
if (!Number.isSafeInteger(limit) || limit <= 0)
  throw new Error("--limit must be a positive integer.");

const apiKey = process.env.OPENAI_API_KEY?.trim();
if (!apiKey) throw new Error("OPENAI_API_KEY is required for the opt-in Phase 3 evaluation.");

const adapter = new OpenAiCoachingAdapter({
  apiKey,
  ...(process.env.OPENAI_TEXT_MODEL ? { modelId: process.env.OPENAI_TEXT_MODEL } : {}),
});

let actionMatches = 0;
let unnecessaryClarifications = 0;
let missedClarifications = 0;
let failures = 0;

for (const fixture of coachingEvaluationFixtures.slice(0, limit)) {
  const result = await coachConversation(adapter, { analysis: fixture.input, selection: null });
  if (!result.ok) {
    failures += 1;
    process.stdout.write(`${fixture.id}: provider-error:${result.error.code}\n`);
    continue;
  }
  const accepted =
    result.decision.action === fixture.expectedAction ||
    fixture.acceptableActions?.includes(result.decision.action);
  if (accepted) actionMatches += 1;
  if (
    result.decision.action === "ASK_CLARIFICATION" &&
    fixture.forbiddenActions?.includes("ASK_CLARIFICATION")
  )
    unnecessaryClarifications += 1;
  if (
    fixture.expectedAction === "ASK_CLARIFICATION" &&
    result.decision.action !== "ASK_CLARIFICATION"
  )
    missedClarifications += 1;
  process.stdout.write(
    `${fixture.id}: ${result.decision.action}:${accepted ? "pass" : "review"}\n`,
  );
}

process.stdout.write(
  `summary: action=${actionMatches}/${Math.min(limit, coachingEvaluationFixtures.length)} unnecessary_clarification=${unnecessaryClarifications} missed_clarification=${missedClarifications} provider_failures=${failures}\n`,
);
process.stdout.write(
  "Intent preservation, hallucinated facts, and language match require human review of generated wording; no message content is logged by this harness.\n",
);
