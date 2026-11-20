// Integration tests: the real PostgreSQL in Docker, started once for the whole run.
// Run them with `npm run test:integration` (Docker must be running).
const shared = require('./jest.shared');

/** @type {import('jest').Config} */
module.exports = {
  ...shared,
  displayName: 'integration',
  testEnvironment: 'node',
  testMatch: ['**/src/**/*.int.test.ts'],
  globalSetup: '<rootDir>/src/test-support/integration-global-setup.ts',
  globalTeardown: '<rootDir>/src/test-support/integration-global-teardown.ts',
};
