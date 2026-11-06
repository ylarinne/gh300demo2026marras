import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["**/dist/**", "**/node_modules/**", "test-results/**", "playwright-report/**"] },
  js.configs.recommended,
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: { ecmaFeatures: { jsx: true } }
    },
    rules: { "no-unused-vars": ["error", { varsIgnorePattern: "^[A-Z]" }] }
  },
  {
    files: ["api/**/*.js", "*.js", "client/vite.config.js", "client/e2e/**/*.js"],
    languageOptions: { globals: globals.node }
  },
  {
    files: ["client/e2e/**/*.js"],
    languageOptions: { globals: globals.browser }
  },
  {
    files: ["client/src/**/*.{js,jsx}"],
    languageOptions: { globals: globals.browser },
    plugins: { "react-hooks": reactHooks },
    rules: reactHooks.configs.recommended.rules
  },
  {
    files: ["client/src/**/*.jsx"],
    plugins: { "react-refresh": reactRefresh },
    rules: { "react-refresh/only-export-components": ["warn", { allowConstantExport: true }] }
  }
];