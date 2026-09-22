// eslint.config.js
import js from "@eslint/js";
import eslintReact from "@eslint-react/eslint-plugin";
import globals from "globals";
import tseslint from "typescript-eslint";
import pluginPrettier from "eslint-plugin-prettier";
import { defineConfig } from "eslint/config";

const reactRecommended = eslintReact.configs["recommended-typescript"];

export default defineConfig([
  {
    files: ["**/*.{js,jsx,ts,tsx}"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: reactRecommended.settings,
    plugins: {
      prettier: pluginPrettier,
      ...reactRecommended.plugins,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...tseslint.configs.recommended[0].rules,
      ...reactRecommended.rules,
      "prettier/prettier": "off",
      "no-unused-vars": "warn",
    },
  },
]);
