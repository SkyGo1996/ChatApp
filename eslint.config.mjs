// https://docs.expo.dev/guides/using-eslint/
// https://typescript-eslint.io/getting-started
// https://typescript-eslint.io/getting-started/typed-linting
// https://github.com/ArnaudBarre/eslint-plugin-react-refresh
// https://github.com/un-ts/eslint-plugin-import-x
import expoConfig from "eslint-config-expo/flat.js";
import { createTypeScriptImportResolver } from "eslint-import-resolver-typescript";
import { createNodeResolver, importX } from "eslint-plugin-import-x";
import eslintPluginPrettierRecommended from "eslint-plugin-prettier/recommended";
import { reactRefresh } from "eslint-plugin-react-refresh";
import { defineConfig } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

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

export default defineConfig([
  // Expo already includes react-hooks v7 recommended (incl. compiler rules).
  expoConfig,
  // recommendedTypeChecked includes recommended — do not also spread recommended.
  ...tseslint.configs.recommendedTypeChecked,
  // Fast Refresh: Expo Router route/layout exports are allowed.
  // https://github.com/ArnaudBarre/eslint-plugin-react-refresh
  reactRefresh.configs.recommended({
    allowExportNames: [
      "unstable_settings",
      "ErrorBoundary",
      "loader",
      "SuspenseFallback",
    ],
  }),
  {
    files: ["**/*.{js,cjs,mjs,jsx,ts,cts,mts,tsx}"],
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: [
            "*.js",
            "*.cjs",
            "*.mjs",
            "babel.config.js",
            "eslint.config.mjs",
          ],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
  // Node.js config files (CJS `require` + `__dirname`) — no type info needed.
  // https://typescript-eslint.io/getting-started/typed-linting/#troubleshooting
  // https://docs.expo.dev/guides/using-eslint/#flat-config
  {
    files: [
      "eslint.config.mjs",
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
  eslintPluginPrettierRecommended,
  // Import hygiene via import-x + TypeScript resolver for `@/*` (techstack §10 / §13.1–13.2)
  {
    files: ["src/**/*.{ts,tsx}"],
    plugins: {
      "import-x": importX,
    },
    settings: {
      "import-x/resolver-next": [
        createTypeScriptImportResolver({
          alwaysTryTypes: true,
          project: "./tsconfig.json",
        }),
        createNodeResolver(),
      ],
    },
    rules: {
      "import-x/no-cycle": "error",
      "import-x/no-self-import": "error",
      "import-x/no-useless-path-segments": "error",
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
      // Expo's bundled eslint-plugin-import still owns this rule name.
      "import/no-named-as-default-member": "off",
    },
  },
  // Jest setup / tests: `require` in jest.mock factories; not Fast Refresh entry points.
  {
    files: [
      "src/test-setup.ts",
      "src/test-utils.tsx",
      "src/test-msw.ts",
      "src/**/*.test.{ts,tsx}",
    ],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
      "react-refresh/only-export-components": "off",
    },
  },
  {
    ignores: ["dist/*", ".expo/*"],
  },
]);
