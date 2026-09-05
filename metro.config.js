// https://docs.expo.dev/more/metro/#configuring-metro
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Block test files and generated artifacts from being bundled into the app.
// Without this, `import * as fs from "node:fs"` and `jest.mock` inside *.test.*
// would be evaluated at runtime and crash before AppRegistry.registerComponent
// ("property is not writable" + "main has not been registered").
const testBlock = /.*\.(test|spec)\.[jt]sx?$|.*\/__tests__\/.*/;
const existing = config.resolver.blockList;
config.resolver.blockList = existing
  ? new RegExp(`(${existing.source})|(${testBlock.source})`)
  : testBlock;

module.exports = config;
