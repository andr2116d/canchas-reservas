import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "max-lines": ["error", { max: 300 }],
      "max-lines-per-function": ["error", { max: 50 }],
      "max-params": ["error", { max: 4 }],
    },
  },
  {
    files: ["**/*.test.ts", "**/*.test.tsx"],
    rules: {
      "max-lines-per-function": "off",
    },
  },
  globalIgnores([".next/**", ".next-e2e/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
