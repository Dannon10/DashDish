module.exports = function (api) {
    // Cache based on NODE_ENV to differentiate between test and non-test environments
    api.cache.using(() => process.env.NODE_ENV);
    
    const isTest = process.env.NODE_ENV === 'test';
    
    if (isTest) {
        // For tests, use standard Node.js presets without Expo
        return {
            presets: [
                ['@babel/preset-env', { targets: { node: 'current' } }],
                '@babel/preset-react',
                '@babel/preset-typescript',
            ],
        };
    }
    
    // For production/development, use Expo preset
    return {
        presets: ['babel-preset-expo'],
    };
};