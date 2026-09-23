import { describe, expect, it } from "vitest";

import { resolveAsarUnpackedPath } from "./native-path.js";

describe("SQLCipher packaged path", () => {
  it("routes an ASAR path to the required unpacked native tree", () => {
    expect(
      resolveAsarUnpackedPath(
        "C:\\resources\\app.asar\\dist\\native\\sqlcipher\\node_sqlite3.node",
        "\\",
      ),
    ).toBe("C:\\resources\\app.asar.unpacked\\dist\\native\\sqlcipher\\node_sqlite3.node");
  });

  it("leaves development and relocated unpacked paths unchanged", () => {
    expect(resolveAsarUnpackedPath("C:\\relocated\\dist\\native\\binding.node", "\\")).toBe(
      "C:\\relocated\\dist\\native\\binding.node",
    );
  });
});
