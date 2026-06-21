module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // En Reanimated 4 (SDK 54) el plugin se separó a react-native-worklets.
      // Tiene que ir SIEMPRE último.
      'react-native-worklets/plugin',
    ],
  };
};
