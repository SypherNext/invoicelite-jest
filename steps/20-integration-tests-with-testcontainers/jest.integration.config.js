// Integration tests: the real PostgreSQL in Docker, started once for the whole run.
// Run them with `npm run test:integration` (Docker must be running).
const base = require('./jest.config');

/** @type {import('jest').Config} */
module.exports = {
  ...base,
  testMatch: ['<rootDir>/src/**/*.int.test.ts'],
  testPathIgnorePatterns: ['/node_modules/'],
  globalSetup: '<rootDir>/src/test-support/integration-global-setup.ts',
  globalTeardown: '<rootDir>/src/test-support/integration-global-teardown.ts',
  // A real database answers in milliseconds, but the first image download can take a while.
  testTimeout: 30_000,
};
