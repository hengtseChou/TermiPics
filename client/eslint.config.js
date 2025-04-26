import js from "@eslint/js";
import importPlugin from "eslint-plugin-import";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import globals from "globals";

export default [
  { ignores: ["node_modules"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: { react: { version: "18.3" } },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
      import: importPlugin,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,
      "react/jsx-no-target-blank": "off",
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "react-hooks/exhaustive-deps": "off",
      "import/order": [
        "warn",
        {
          groups: [
            ["builtin", "external"],
            ["internal", "sibling", "parent", "index"],
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
          pathGroups: [
            {
              pattern: "{react,react-router-dom}",
              group: "external",
              position: "before",
            },
          ],
          pathGroupsExcludedImportTypes: ["react"],
        },
      ],
      "react/prop-types": "off",
      "no-unused-vars": "off",
      quotes: ["warn", "double", { avoidEscape: true }],
      "max-len": [
        "warn",
        {
          code: 100,
          ignoreUrls: true,
          ignoreComments: true,
          ignoreStrings: true,
          ignoreTemplateLiterals: false,
        },
      ],
      "no-trailing-spaces": "warn",
      "space-infix-ops": "warn",
      indent: ["warn", 2],
      "no-multi-spaces": "warn",
    },
  },
];
