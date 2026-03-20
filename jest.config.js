/** @type {import('jest').Config} */
const config = {
    testEnvironment: 'node',
    testMatch: [
        '**/__tests__/**/*.[jt]s?(x)',
        '!**/__tests__/components/**/*.[jt]s?(x)',
    ],
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
    transform: {
        '^.+\\.tsx?$': 'babel-jest',
    },
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    },
    transformIgnorePatterns: [
        'node_modules/(?!(expo|@expo|@react-native-mapbox-gl|@rnmapbox)/)',
    ],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    collectCoverageFrom: [
        'utils/**/*.{ts,tsx}',
        'services/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        '!**/*.d.ts',
        '!**/node_modules/**',
    ],
    testPathIgnorePatterns: ['/node_modules/', '/.expo/', '/build/'],
};

module.exports = config;