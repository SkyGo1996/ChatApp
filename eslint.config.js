// https://docs.expo.dev/guides/using-eslint/
// https://typescript-eslint.io/getting-started
// https://typescript-eslint.io/getting-started/typed-linting
const { defineConfig } = require("eslint/config");
const expoConfig = require("eslint-config-expo/flat");
const eslintPluginPrettierRecommended = require("eslint-plugin-prettier/recommended");
const js = require("@eslint/js");
const tseslint = require("typescript-eslint");
const globals = require("globals");

/** Path-literal bans shared by feature source (techstack §3 / §10). */
const pathLiteralRestrictedSyntax = [
  {
    selector: 'Literal[value="/users"]',
    message:
      'Do not use raw path literal "/users" — use endpoints.conversations.list / endpoints.profile.detail(id).',
  },
  {
    selector: 'Literal[value="/posts"]',
    message:
      'Do not use raw path literal "/posts" — use endpoints.chat.send / endpoints.chat.messages(id).',
  },
  {
    selector: 'Literal[value="/api"]',
    message:
      'Do not use raw "/api" literal — use endpoints registry + client baseURL.',
  },
  {
    selector: 'TemplateLiteral > TemplateElement[value.raw="/users"]',
    message:
      'Do not interpolate raw "/users" — use endpoints.profile.detail(id).',
  },
  {
    selector: 'TemplateLiteral > TemplateElement[value.raw="/posts"]',
    message: 'Do not interpolate raw "/posts" — use endpoints.chat registry.',
  },
];

/** Cross-feature type redefinition bans (techstack §2 / §10). */
const typeOwnershipRestrictedSyntax = [
  {
    selector:
      "TSTypeAliasDeclaration[id.name='Conversation'], TSInterfaceDeclaration[id.name='Conversation']",
    message:
      "Conversation is owned by @/features/conversations/types — import from there, do not redefine.",
  },
  {
    selector:
      "TSTypeAliasDeclaration[id.name='ThemeMode'], TSInterfaceDeclaration[id.name='ThemeMode']",
    message:
      "ThemeMode is owned by @/features/settings/types — import from there, do not redefine.",
  },
  {
    selector:
      "TSTypeAliasDeclaration[id.name='Message'], TSInterfaceDeclaration[id.name='Message']",
    message:
      "Message is owned by @/features/chat/types — import from there, do not redefine.",
  },
  {
    selector:
      "TSTypeAliasDeclaration[id.name='Profile'], TSInterfaceDeclaration[id.name='Profile']",
    message:
      "Profile is owned by @/features/profile/types — import from there, do not redefine.",
  },
  {
    selector:
      "TSTypeAliasDeclaration[id.name='Contact'], TSInterfaceDeclaration[id.name='Contact']",
    message:
      "Contact is owned by @/features/profile/types — import from there, do not redefine.",
  },
];

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
    files: [
      "eslint.config.js",
      "babel.config.js",
      "metro.config.js",
      "jest.config.js",
    ],
    extends: [tseslint.configs.disableTypeChecked],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  // Jest setup / test helpers: `require` is required inside jest.mock factories
  // (hoisted, out-of-scope `import` is forbidden). Disable only that rule;
  // keep type-aware checks (no-unsafe-*) active.
  {
    files: [
      "src/test-setup.ts",
      "src/test-utils.tsx",
      "src/test-msw.ts",
      "src/**/*.test.{ts,tsx}",
      "src/**/__tests__/**/*.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  eslintPluginPrettierRecommended,
  // Import hygiene + TypeScript resolver for `@/*` (techstack §10 / §13.1–13.2)
  {
    files: ["src/**/*.{ts,tsx}"],
    settings: {
      "import/resolver": {
        typescript: {
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        },
        node: true,
      },
    },
    rules: {
      "import/no-cycle": "error",
      "import/no-self-import": "error",
      "import/no-useless-path-segments": "error",
    },
  },
  {
    files: ["src/**/*.{ts,tsx}"],
    ignores: ["src/services/api/endpoints.ts", "src/services/api/client.ts"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "axios",
              message:
                "Import axios only in src/services/api/client.ts — use `import { client } from '@/services/api/client'` elsewhere.",
            },
          ],
          patterns: [
            {
              // Ban relative registry imports; `**/endpoints*` also matches the `@/` alias.
              regex: "^\\..*services/api/endpoints",
              message:
                "Import path strings only via `import { endpoints } from '@/services/api/endpoints'`.",
            },
            {
              // Depth ≥2 parent imports — prefer `@/*` (techstack §13.1). 1-level `../` is fine.
              regex: "^\\.\\./\\.\\.",
              message:
                "Prefer `@/*` alias instead of `../../` (or deeper) relative imports.",
            },
          ],
        },
      ],
      "no-restricted-syntax": [
        "error",
        ...pathLiteralRestrictedSyntax,
        ...typeOwnershipRestrictedSyntax,
      ],
    },
  },
  // Owner `types.ts` may declare their entity types; re-exports elsewhere remain allowed.
  {
    files: [
      "src/features/conversations/types.ts",
      "src/features/settings/types.ts",
      "src/features/chat/types.ts",
      "src/features/profile/types.ts",
    ],
    rules: {
      "no-restricted-syntax": ["error", ...pathLiteralRestrictedSyntax],
    },
  },
  {
    files: ["src/services/api/endpoints.ts", "src/services/api/client.ts"],
    rules: {
      // Registry and client are the only places allowed to contain raw path strings / axios import
      "no-restricted-imports": "off",
      "no-restricted-syntax": "off",
      "import/no-named-as-default-member": "off",
    },
  },
  {
    files: ["src/services/api/rate-limit.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    ignores: ["dist/*", ".expo/*"],
  },
]);
