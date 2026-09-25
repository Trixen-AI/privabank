// Reown AppKit uses valtio, which reads import.meta; Expo SDK 53+ needs this flag.
module.exports = function (api) {
  api.cache(true);
  return {
    presets: [["babel-preset-expo", { unstable_transformImportMeta: true }]],
  };
};
