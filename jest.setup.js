// Jest setup file - conditional setup based on test environment
// For component tests (jsdom), set up React Native Testing Library
// For unit tests (node), skip React setup

if (process.env.NODE_ENV === 'test') {
    // Only set up React Native Testing Library for component tests (jsdom environment)
    if (typeof window !== 'undefined' || process.env.JEST_WORKER_ID) {
        try {
            require('@testing-library/jest-native/extend-expect');
        } catch (error) {
            // Silently fail if React Native Testing Library is not available
            // This allows unit tests to run without React setup
        }
    }
}

// Suppress specific console warnings in tests
const originalError = console.error;
const originalWarn = console.warn;

beforeAll(() => {
    console.error = (...args) => {
        if (
            typeof args[0] === 'string' &&
            (args[0].includes('Non-serializable values were found') ||
                args[0].includes('Warning: ReactDOM.render') ||
                args[0].includes('Cannot use import statement outside a module'))
        ) {
            return;
        }
        originalError.call(console, ...args);
    };

    console.warn = (...args) => {
        if (
            typeof args[0] === 'string' &&
            args[0].includes('jest-native')
        ) {
            return;
        }
        originalWarn.call(console, ...args);
    };
});

afterAll(() => {
    console.error = originalError;
    console.warn = originalWarn;
});
