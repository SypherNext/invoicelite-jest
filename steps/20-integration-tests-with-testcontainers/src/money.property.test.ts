import { describe, expect, test } from '@jest/globals';
import fc from 'fast-check';
import { Money } from './money';

// Amounts up to 10 million euros, in cents, for the arithmetic properties.
const cents = fc.integer({ min: -1_000_000_000, max: 1_000_000_000 });
const money = cents.map((c) => Money.of(c));

describe('Money properties', () => {
  test('adding is commutative: a + b equals b + a', () => {
    fc.assert(
      fc.property(money, money, (a, b) => {
        expect(a.plus(b)).toEqual(b.plus(a));
      }),
    );
  });

  test('adding is associative: (a + b) + c equals a + (b + c)', () => {
    fc.assert(
      fc.property(money, money, money, (a, b, c) => {
        expect(a.plus(b).plus(c)).toEqual(a.plus(b.plus(c)));
      }),
    );
  });

  test('subtracting what you added gives the amount back', () => {
    fc.assert(
      fc.property(money, money, (a, b) => {
        expect(a.plus(b).minus(b)).toEqual(a);
      }),
    );
  });

  test('a percentage is never more than half a cent from the exact value', () => {
    // Any non-negative amount Money accepts, and any rate from 0% to 100% in steps of 0.01%.
    const anyAmount = fc.maxSafeNat();
    const basisPoints = fc.integer({ min: 0, max: 10_000 });
    fc.assert(
      fc.property(anyAmount, basisPoints, (amount, bp) => {
        const result = Money.of(amount).percent(bp / 100).cents;
        // The exact answer is amount * bp / 10000 cents. Compare in ten-thousandths of a cent,
        // with BigInt, so the check itself cannot lose precision.
        const error = BigInt(result) * 10_000n - BigInt(amount) * BigInt(bp);
        expect(Math.abs(Number(error))).toBeLessThanOrEqual(5_000);
      }),
    );
  });

  test('an exact half cent always rounds to the even cent', () => {
    // 10% of an amount that ends in 5 is exactly half a cent: 10% of 15 is 1.5.
    const endsInFive = fc.integer({ min: 0, max: 1_000_000 }).map((n) => 10 * n + 5);
    fc.assert(
      fc.property(endsInFive, (amount) => {
        expect(Money.of(amount).percent(10).cents % 2).toBe(0);
      }),
    );
  });
});
