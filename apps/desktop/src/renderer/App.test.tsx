import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AnalysisResultView, App } from "./App.js";

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
});
