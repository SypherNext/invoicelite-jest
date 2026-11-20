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
};
