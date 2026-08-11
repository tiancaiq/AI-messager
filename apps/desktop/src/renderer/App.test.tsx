import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { App } from "./App.js";

describe("desktop capture entry", () => {
  it("renders the product name and primary Generate trigger", () => {
    const markup = renderToStaticMarkup(<App />);

    expect(markup).toContain("<h1>AI Message Coach</h1>");
    expect(markup).toContain(">Generate</button>");
  });
});
