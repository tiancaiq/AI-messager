import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["**/coverage/**", "**/dist/**", "**/node_modules/**", "**/*.d.ts"],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.{js,mjs,ts,tsx}"],
    languageOptions: {
      ecmaVersion: "latest",
    },
    rules: {
      "no-console": "error",
    },
  },
  {
    files: [
      "apps/api/**/*.ts",
      "apps/desktop/src/{main,preload}/**/*.ts",
      "apps/desktop/*.config.ts",
      "**/*.test.{ts,tsx}",
      "**/scripts/**/*.mjs",
    ],
    languageOptions: {
      globals: globals.node,
    },
  },
  {
    files: ["apps/desktop/src/renderer/**/*.{ts,tsx}"],
    languageOptions: {
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      ...reactHooks.configs.flat.recommended.rules,
    },
  },
  {
    files: ["apps/api/src/server.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["**/scripts/**/*.cjs"],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
);
