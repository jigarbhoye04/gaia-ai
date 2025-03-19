import { FlatCompat } from "@eslint/eslintrc";
import { dirname } from "path";
import { fileURLToPath } from "url";

import tseslint from "@typescript-eslint/eslint-plugin";
import tsparser from "@typescript-eslint/parser";
import simpleImportSort from "eslint-plugin-simple-import-sort";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  // Extends Next.js and TypeScript recommended rules
  ...compat.extends(
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended",
  ),

  {
    ignores: [
      "node_modules/",
      "pnpm-lock.yaml",
      ".next/",
      ".env",
      ".env.local",
      ".env.*.local",
      "*.d.ts",
      "tsconfig.tsbuildinfo",
      "*.log",
      ".yarn/",
      ".vscode/",
      ".idea/",
      ".DS_Store",
    ],
  },

  {
    languageOptions: {
      parser: tsparser,
    },
    plugins: {
      "@typescript-eslint": tseslint,
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      "react/no-unescaped-entities": "off",
      "import/order": "off",
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/explicit-function-return-type": "off",
      "no-console": "off",
      "@typescript-eslint/no-empty-object-type": "off",
    },
  },
];
