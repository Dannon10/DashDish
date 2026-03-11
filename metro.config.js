const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Allow Metro to handle CSS files (required by mapbox-gl on web)
config.resolver.assetExts = config.resolver.assetExts.filter(ext => ext !== 'css');
config.resolver.sourceExts = [...config.resolver.sourceExts, 'css'];

// Transform CSS files as empty modules on native, real CSS on web
config.transformer = {
    ...config.transformer,
    babelTransformerPath: require.resolve('./cssTransformer.js'),
};

module.exports = config;