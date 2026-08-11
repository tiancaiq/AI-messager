import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    conditions: ["development"],
  },
  test: {
    exclude: ["**/dist/**", "**/node_modules/**"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
  },
});
