import pluginVue from "eslint-plugin-vue";
import eslintConfigPrettier from "@vue/eslint-config-prettier";
import {
  defineConfigWithVueTs,
  vueTsConfigs,
} from "@vue/eslint-config-typescript";

export default defineConfigWithVueTs(
  {
    ignores: ["dist/**", "node_modules/**", "coverage/**"],
  },
  pluginVue.configs["flat/recommended"],
  vueTsConfigs.recommended,
  eslintConfigPrettier,
  {
    rules: {
      "vue/multi-word-component-names": "off",
    },
  },
  {
    files: ["server/**/*.js", "*.cjs"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
    },
  },
);
