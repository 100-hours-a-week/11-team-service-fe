// eslint.config.js
import js from "@eslint/js";
import babelParser from "@babel/eslint-parser";
import reactHooks from "eslint-plugin-react-hooks";
import globals from "globals";

export default [
  // 1) Lint 제외 대상
  {
    ignores: [
      "**/dist/**",
      "**/build/**",
      "**/coverage/**",
      "**/.vite/**",
      "**/node_modules/**",
    ],
  },

  // 2) 기본 추천 규칙
  js.configs.recommended,

  // 3) App 코드(브라우저 + React Hooks)
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

      // ✅ 브라우저 전역(window, document, localStorage, setTimeout, setInterval 등) 한 번에 주입
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
    },
    rules: {
      // React Hooks 규칙
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",

      // 개발 편의
      "no-unused-vars": "warn",
      "no-console": "off",
    },
  },

  // 4) Node 환경 파일 (Vite/ESLint config 등)
  {
    files: [
      "vite.config.*",
      "eslint.config.*",
      "postcss.config.*",
      "tailwind.config.*",
    ],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
