import { describe, expect, it } from "vitest";

import { selectCaptureSource } from "./capture-source.js";

describe("capture source selection", () => {
  it("matches the Electron display identifier", () => {
    const sources = [
      { id: "screen:0:0", display_id: "10" },
      { id: "screen:1:0", display_id: "20" },
    ];

    expect(selectCaptureSource(sources, "20")).toBe(sources[1]);
  });

  it("uses the sole source when a platform cannot expose display_id", () => {
    const source = { id: "screen:0:0", display_id: "" };
    expect(selectCaptureSource([source], "20")).toBe(source);
  });

  it("fails safely instead of guessing among unmatched displays", () => {
    expect(
      selectCaptureSource(
        [
          { id: "screen:0:0", display_id: "" },
          { id: "screen:1:0", display_id: "" },
        ],
        "20",
      ),
    ).toBeUndefined();
  });
});
