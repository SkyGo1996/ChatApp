// https://docs.expo.dev/guides/using-eslint/
// https://typescript-eslint.io/getting-started
// https://typescript-eslint.io/getting-started/typed-linting
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const globals = require("globals");

module.exports = defineConfig([
  expoConfig,
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...tseslint.configs.recommendedTypeChecked,
  {
    files: ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["*.js", "*.cjs", "*.mjs", "babel.config.js"],
        },
        tsconfigRootDir: __dirname,
      },
    },
  },
  // Node.js config files (CJS `require` + `__dirname`) — no type info needed.
  // https://typescript-eslint.io/getting-started/typed-linting/#troubleshooting
  // https://docs.expo.dev/guides/using-eslint/#flat-config
  {
    files: ["eslint.config.js", "babel.config.js", "metro.config.js", "jest.config.js"],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  eslintPluginPrettierRecommended,
  {
    ignores: ["dist/*", ".expo/*"],
  },
]);
