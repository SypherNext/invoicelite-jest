import type { jest as jestApi } from '@jest/globals';

// Jest also puts the `jest` object on the global scope. @swc/jest moves jest.mock()
// above the imports only when it is called on that global, so a test file that
// mocks a module uses the global `jest` instead of importing it.
declare global {
  const jest: typeof jestApi;
}
