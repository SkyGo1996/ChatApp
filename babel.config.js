module.exports = function (api) {
  // api.env() also configures Babel caching — do not call api.cache() separately.
  const isProd = api.env("production");
  const plugins = [["react-native-unistyles/plugin", { root: "src" }]];

  if (isProd) {
    plugins.push("transform-remove-console");
  }

  // Must remain last (techstack §10 / Reanimated).
  plugins.push("react-native-reanimated/plugin");

  return {
    presets: ["babel-preset-expo"],
    plugins,
  };
};
