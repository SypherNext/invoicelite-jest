// Settings every Jest config in this project shares: how to compile TypeScript,
// the extra matchers, and clean mocks before each test.
module.exports = {
  transform: {
    '^.+\\.tsx?$': ['@swc/jest', { jsc: { transform: { react: { runtime: 'automatic' } } } }],
  },
  setupFilesAfterEnv: ['<rootDir>/src/test-support/setup-tests.ts'],
  clearMocks: true,
  restoreMocks: true,
};
