/** @type {import('jest').Config} */
module.exports = {
  preset: "jest-expo",
  testMatch: ["<rootDir>/src/**/*.(test|spec).ts?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "/android/", "/ios/", "/.expo/"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/assets/(.*)$": "<rootDir>/assets/$1",
  },
  setupFiles: [
    "react-native-unistyles/mocks",
    "<rootDir>/src/theme/unistyles.ts",
    "react-native-gesture-handler/jestSetup.js",
  ],
  setupFilesAfterEnv: ["<rootDir>/src/test-setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(jest-)?react-native|@react-native|expo|@expo|@unimodules|unimodules|sentry-expo|native-base|react-clone-referenced-element|react-native-unistyles|react-native-reanimated|react-native-worklets|react-native-safe-area-context|react-native-gesture-handler|react-native-screens|react-native-keyboard-controller|react-native-svg|sonner-native|@shopify/flash-list|@tanstack|redux-persist|axios|msw|until-async|lucide-react-native|date-fns)/",
  ],
};
