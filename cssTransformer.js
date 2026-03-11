const upstreamTransformer = require('@expo/metro-config/build/transform-worker/metro-transform-worker');

module.exports.transform = async function ({ src, filename, options, ...rest }) {
    if (filename.endsWith('.css')) {
        // On web: pass CSS through as-is so the browser can load it
        // On native: return an empty module (CSS doesn't apply)
        const isWeb = options?.platform === 'web';
        if (isWeb) {
            return upstreamTransformer.transform({
                src,
                filename,
                options,
                ...rest,
            });
        }
        // Native — return empty module
        return upstreamTransformer.transform({
            src: '',
            filename,
            options,
            ...rest,
        });
    }
    return upstreamTransformer.transform({ src, filename, options, ...rest });
};