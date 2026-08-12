import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AnalysisResultView, App, CoachingDecisionView } from "./App.js";

describe("desktop capture entry", () => {
  it("renders the product name and primary Generate trigger", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("<h1>AI Message Coach</h1>");
    expect(markup).toContain(">Generate</button>");
  });

  it("renders validated observations without a coaching result", () => {
    const markup = renderToStaticMarkup(
      <AnalysisResultView
        analysis={{
          messages: [
            {
              id: "message-1",
              order: 1,
              speaker: "OTHER",
              text: "Can you review the synthetic notes?",
              textConfidence: 0.98,
              speakerConfidence: 0.91,
            },
          ],
          draft: { text: "I am checking them now.", confidence: 0.96 },
          participants: [],
          visibleContact: {
            displayName: "Alex",
            username: "@alex",
            channelOrGroupName: null,
            platformHint: null,
            confidence: 0.92,
          },
          language: {
            primary: "en",
            secondary: null,
            script: "NOT_APPLICABLE",
            codeSwitching: false,
            supportedForLanguageSpecificSkills: true,
            confidence: 0.99,
          },
          conversation: { summary: "A review request is visible.", confidence: 0.9 },
          warnings: [],
          overallConfidence: 0.9,
        }}
      />,
    );

    expect(markup).toContain("Messages in visible order");
    expect(markup).toContain("Can you review the synthetic notes?");
    expect(markup).toContain("Visible contact");
    expect(markup).toContain("Alex");
    expect(markup).not.toContain("Suggested reply");
    expect(markup).not.toContain("Copy reply");
  });

  it("renders a copyable coaching result", () => {
    const markup = renderToStaticMarkup(
      <CoachingDecisionView
        copyStatus={undefined}
        decision={{
          action: "REWRITE_DRAFT",
          userIntent: { value: "Preserve uncertainty about tomorrow.", confidence: 0.95 },
          actionConfidence: 0.96,
          ambiguity: { material: false, reason: null },
          primary: "Sorry, testing is taking longer, so it will probably be tomorrow.",
          alternatives: [{ label: "Shorter", text: "Testing is taking longer—probably tomorrow." }],
        }}
        onCopy={() => undefined}
        onSelect={() => undefined}
      />,
    );

    expect(markup).toContain("Here’s a clearer message");
    expect(markup).toContain("probably be tomorrow");
    expect(markup).toContain(">Copy</button>");
    expect(markup).toContain("model-estimated, not calibrated");
  });

  it("renders suggested actions and one clarification question", () => {
    const actions = renderToStaticMarkup(
      <CoachingDecisionView
        copyStatus={undefined}
        decision={{
          action: "SUGGEST_ACTIONS",
          userIntent: { value: null, confidence: 0.4 },
          actionConfidence: 0.9,
          ambiguity: { material: true, reason: "The choice changes the reply." },
          actions: [
            { id: "accept", label: "Accept", intent: "Accept." },
            { id: "decline", label: "Decline", intent: "Decline." },
          ],
        }}
        onCopy={() => undefined}
        onSelect={() => undefined}
      />,
    );
    const clarification = renderToStaticMarkup(
      <CoachingDecisionView
        copyStatus={undefined}
        decision={{
          action: "ASK_CLARIFICATION",
          userIntent: { value: null, confidence: 0.2 },
          actionConfidence: 0.8,
          ambiguity: { material: true, reason: "The intent is unclear." },
          question: "What would you like to do next?",
          options: ["Acknowledge", "Ask a follow-up"],
        }}
        onCopy={() => undefined}
        onSelect={() => undefined}
      />,
    );
    expect(actions).toContain(">Accept</button>");
    expect(actions).toContain(">Decline</button>");
    expect(clarification).toContain("What would you like to do next?");
  });
});
