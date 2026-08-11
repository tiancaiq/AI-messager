import { resolve } from "node:path";

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    emptyOutDir: true,
    lib: {
      entry: resolve(import.meta.dirname, "src/main/index.ts"),
      fileName: () => "index.cjs",
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
