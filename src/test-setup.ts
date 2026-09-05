// Setup for jest: worklets mock must come before reanimated setUpTests()
// Per https://docs.swmansion.com/react-native-worklets/docs/guides/testing
// and https://docs.swmansion.com/react-native-reanimated/docs/guides/testing

// 1. Worklets mock - must be before reanimated import

// 3. Safe area context mock

import mockSafeAreaContext from "react-native-safe-area-context/jest/mock";

// jest.mock factories must use `require` (hoisted, out-of-scope `import` is forbidden).
// `no-require-imports` is disabled via eslint.config.js for this file; keep
// `no-unsafe-return` narrowly suppressed — factory returns untyped third-party mock.
/* eslint-disable @typescript-eslint/no-unsafe-return */
jest.mock("react-native-worklets", () =>
  require("react-native-worklets/src/mock")
);
/* eslint-enable @typescript-eslint/no-unsafe-return */

// 2. Reanimated mock setup — typed to avoid no-unsafe-call / no-unsafe-member-access
const { setUpTests } = require("react-native-reanimated") as {
  setUpTests: () => void;
};
setUpTests();

jest.mock("react-native-safe-area-context", () => mockSafeAreaContext);

// 4. Keyboard controller mock
/* eslint-disable @typescript-eslint/no-unsafe-return */
jest.mock("react-native-keyboard-controller", () =>
  require("react-native-keyboard-controller/jest")
);
/* eslint-enable @typescript-eslint/no-unsafe-return */

// 5. Expo SecureStore in-memory mock (for persist.ts)
// jest-expo auto-mocks expo-secure-store, but we provide deterministic in-memory impl
jest.mock("expo-secure-store", () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn((key: string) =>
      Promise.resolve(store.get(key) ?? null)
    ),
    setItemAsync: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    // expose for test cleanup
    __store: store,
    __clear: () => store.clear(),
  };
});

// 6. Expo Router mocks (auto-mocked via jest-expo, but ensure gesture-handler/reanimated deps)
// Import expo-router testing-library mocks for integration helpers
// This augments jest-expo's linking + gesture mocks — optional, best-effort.
try {
  require("expo-router/testing-library/mocks");
} catch (e: unknown) {
  // MODULE_NOT_FOUND is expected on expo-router versions without this path
  // (jest-expo already provides linking mocks). Only warn on unexpected errors.
  const msg = e instanceof Error ? e.message : String(e);
  if (!msg.includes("Cannot find module") && __DEV__) {
    console.warn("[test-setup] expo-router mocks failed", e);
  }
}

// RNTL v14 built-in matchers: no need for @testing-library/jest-native/extend-expect
// Importing from @testing-library/react-native auto-extends expect.
// Keep explicit import for coverage if pure import is avoided in some tests.

// @testing-library/react-native/pure does NOT auto-extend, but main entry does.
// We intentionally do not import extend-expect here (deprecated path).
