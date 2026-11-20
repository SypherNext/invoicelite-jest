import { expect } from '@jest/globals';
import type { MatcherFunction } from 'expect';
import { Money } from '../money';

// expect(total).toBeMoney('EUR 29.75') compares a Money with the way people write it,
// and on failure prints both amounts the same way.
const toBeMoney: MatcherFunction<[expected: string]> = function (received, expected) {
  const shown = received instanceof Money ? received.format() : received;
  const pass = received instanceof Money && shown === expected;
  const hint = this.utils.matcherHint('toBeMoney', undefined, undefined, { isNot: this.isNot });
  return {
    pass,
    message: () =>
      `${hint}\n\n` +
      `Expected: ${this.isNot ? 'not ' : ''}${this.utils.printExpected(expected)}\n` +
      `Received: ${this.utils.printReceived(shown)}`,
  };
};

expect.extend({ toBeMoney });

// Tell TypeScript about the new matcher, on expect(...) and as expect.toBeMoney(...).
declare module 'expect' {
  interface AsymmetricMatchers {
    toBeMoney(expected: string): void;
  }
  interface Matchers<R> {
    toBeMoney(expected: string): R;
  }
}
