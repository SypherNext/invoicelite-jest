/** @type {import('jest').Config} */
module.exports = {
  // Most tests run in Node. A UI test file asks for a browser-like DOM with a
  // `@jest-environment jsdom` comment at its top.
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['@swc/jest', { jsc: { transform: { react: { runtime: 'automatic' } } } }],
  },
  // Runs once, before all test files, in Jest's main process.
  globalSetup: '<rootDir>/src/test-support/global-setup.ts',
  // Runs before every test file, once expect and the hooks exist: extra matchers.
  setupFilesAfterEnv: ['<rootDir>/src/test-support/setup-tests.ts'],
  // Before each test: forget the calls every mock has recorded...
  clearMocks: true,
  // ...and put back every method replaced with jest.spyOn().
  restoreMocks: true,

  // Coverage, used by `npm run test:coverage`.
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/test-support/**',
    // These files hold only interfaces and types: they compile to nothing to run.
    '!src/{invoice,notifier,payment-gateway}.ts',
  ],
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: { statements: 90, branches: 90, functions: 90, lines: 90 },
  },
};
