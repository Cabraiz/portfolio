/** @type {import("prettier").Config} */
import organizeImports from "prettier-plugin-organize-imports";

export default {
  semi: true,
  singleQuote: true,
  printWidth: 80,
  bracketSameLine: false,
  jsxSingleQuote: false,
  bracketSpacing: true,
  plugins: [organizeImports],
};
