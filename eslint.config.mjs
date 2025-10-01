import js from "@eslint/js"
import globals from "globals"
import { defineConfig } from "eslint/config"

export default defineConfig([
  {
    files: ["**/*.{js,mjs,cjs}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.jest,
      }
    },
    rules: {
      // 文末セミコロン禁止
      semi: ["error", "never"],

      // camelCase を強制（プロパティ名もチェック）
      camelcase: ["error", { properties: "never" }],
    }
  },
  {
    files: ["**/*.js"]
    , languageOptions: { sourceType: "commonjs" }
  },
])
