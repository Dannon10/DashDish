/** @type {import('jest').Config} */
const config = {
    testEnvironment: 'jsdom',
    testMatch: [
        '**/__tests__/components/**/*.[jt]s?(x)',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
        '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        '^react-native$': 'react-native-web',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(react-native|@react-native|expo|@expo|react-native-web|@testing-library)/)',
    ],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    collectCoverageFrom: [
        'components/**/*.{ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
    ],
    testPathIgnorePatterns: ['/node_modules/', '/.expo/', '/build/'],
};

module.exports = config;