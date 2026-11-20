/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': '@swc/jest',
  },
  // Before each test: forget the calls every mock has recorded...
  clearMocks: true,
  // ...and put back every method replaced with jest.spyOn().
  restoreMocks: true,

  // Coverage, used by `npm run test:coverage` (jest --coverage).
  coverageProvider: 'v8',
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.test.ts',
    '!src/test-support/**',
    // These files hold only interfaces and types: they compile to nothing to run.
    '!src/{invoice,notifier,payment-gateway}.ts',
  ],
  coverageReporters: ['text', 'lcov'],
  coverageThreshold: {
    global: { statements: 90, branches: 90, functions: 90, lines: 90 },
  },
};
