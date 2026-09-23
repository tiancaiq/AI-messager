import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: {
        index: resolve(import.meta.dirname, "src/main/index.ts"),
        "local-memory/storage-utility": resolve(
          import.meta.dirname,
          "src/main/local-memory/storage-utility.ts",
        ),
      },
      fileName: (_format, entryName) => `${entryName}.cjs`,
      formats: ["cjs"],
    },
    outDir: "dist/main",
    rollupOptions: {
      external: ["electron", /^node:/],
    },
    sourcemap: true,
    target: "node24",
  },
});
