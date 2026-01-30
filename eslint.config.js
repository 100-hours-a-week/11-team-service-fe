// eslint.config.js
import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import babelParser from "@babel/eslint-parser";

export default [
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.vite/**",
      "**/node_modules/**",
    ],
  },

  js.configs.recommended,

  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      parser: babelParser,
      parserOptions: {
        requireConfigFile: false,
        babelOptions: {
          presets: ["@babel/preset-react"],
        },
        ecmaVersion: "latest",
        sourceType: "module",
      },
      globals: {
        window: "readonly",
        document: "readonly",
        localStorage: "readonly",
        sessionStorage: "readonly",
        navigator: "readonly",
        location: "readonly",
        alert: "readonly",
        console: "readonly",
        fetch: "readonly",
        FormData: "readonly",
        IntersectionObserver: "readonly",
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },

  {
    files: ["vite.config.*", "eslint.config.*"],
    languageOptions: {
      globals: { __dirname: "readonly", process: "readonly" },
    },
  },
];
