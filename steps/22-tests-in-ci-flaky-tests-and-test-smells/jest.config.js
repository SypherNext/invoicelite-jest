const shared = require('./jest.shared');

/** @type {import('jest').Config} */
module.exports = {
  // The fast tests, in one run: logic in Node, screens in a browser-like DOM.
  // Run one of them with --selectProjects unit (or ui). The globs leave out <rootDir>:
  // Stryker on Windows hands Jest a rootDir with backslashes, and such a glob matches nothing.
  projects: [
    {
      ...shared,
      displayName: 'unit',
      testEnvironment: 'node',
      testMatch: ['**/src/**/*.test.ts'],
      testPathIgnorePatterns: ['/node_modules/', '/src/ui/', '\\.int\\.test\\.ts$'],
    },
    {
      ...shared,
      displayName: 'ui',
      testEnvironment: 'jsdom',
      testMatch: ['**/src/ui/**/*.test.{ts,tsx}'],
    },
  ],

  // Options for the whole run.
  globalSetup: '<rootDir>/src/test-support/global-setup.ts',
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.test.{ts,tsx}',
    '!src/test-support/**',
    // These files hold only interfaces and types: they compile to nothing to run.
    '!src/{invoice,notifier,payment-gateway}.ts',
    // Covered by the integration tests, which a coverage run of the unit tests does not include.
    '!src/pg-invoice-repository.ts',
  ],
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: { statements: 90, branches: 90, functions: 90, lines: 90 },
  },
};
