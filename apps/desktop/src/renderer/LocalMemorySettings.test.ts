import { describe, expect, it } from "vitest";

import { isMessageLengthDirty } from "./LocalMemorySettings.js";

describe("local memory preference editing", () => {
  it("treats an unset preference as different from explicitly selected Balanced", () => {
    expect(
      isMessageLengthDirty(
        {
          generation: "00000000-0000-4000-8000-000000000001",
          revision: 0,
          directoryRevision: 0,
          memoryRevision: 0,
          messageLength: null,
          updatedAt: null,
        },
        "BALANCED",
      ),
    ).toBe(true);
  });
});
