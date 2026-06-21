/**
 * Metro config con react-native-svg-transformer.
 * Esto permite hacer `import ScannerIcon from '@/assets/icons/scanner.svg'`
 * y recibir un React component renderizable con react-native-svg.
 */
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const { transformer, resolver } = config;

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer/expo'),
};

config.resolver = {
  ...resolver,
  assetExts: resolver.assetExts.filter((ext) => ext !== 'svg'),
  sourceExts: [...resolver.sourceExts, 'svg'],
};

module.exports = config;
