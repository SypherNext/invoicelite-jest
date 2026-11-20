import { beforeEach, describe, expect, test } from '@jest/globals';
import { BuyNGetOneFree, NoDiscount, PercentageDiscount, TieredDiscount } from './discounts';
import { LineItem } from './line-item';
import { Money } from './money';

function line(sku: string, unitCents: number, quantity: number): LineItem {
  return new LineItem({ sku, description: sku, unitPrice: Money.of(unitCents), quantity });
}

describe('NoDiscount', () => {
  test('takes nothing off', () => {
    expect(new NoDiscount().discountFor([], Money.of(5000))).toEqual(Money.of(0));
  });
});

describe('PercentageDiscount', () => {
  test.each`
    percent | subtotal | expected
    ${0}    | ${5000}  | ${0}
    ${10}   | ${5000}  | ${500}
    ${15}   | ${1999}  | ${300}
    ${100}  | ${5000}  | ${5000}
  `('$percent% off $subtotal cents is $expected cents', ({ percent, subtotal, expected }) => {
    const discount = new PercentageDiscount(percent).discountFor([], Money.of(subtotal));

    expect(discount).toEqual(Money.of(expected));
  });

  test.each([-1, 101])('refuses %d percent', (percent) => {
    expect(() => new PercentageDiscount(percent)).toThrow('between 0 and 100');
  });
});

describe('TieredDiscount', () => {
  const tiers = new TieredDiscount([
    { from: Money.of(10000), percent: 5 },
    { from: Money.of(50000), percent: 10 },
  ]);

  test.each`
    subtotal | expected
    ${9999}  | ${0}
    ${10000} | ${500}
    ${49999} | ${2500}
    ${50000} | ${5000}
  `('$subtotal cents gets $expected cents off', ({ subtotal, expected }) => {
    expect(tiers.discountFor([], Money.of(subtotal))).toEqual(Money.of(expected));
  });
});

describe('BuyNGetOneFree', () => {
  const policy = new BuyNGetOneFree('MUG-01', 2);
  let lines: LineItem[];

  beforeEach(() => {
    lines = [line('MUG-01', 1250, 7), line('PEN-10', 640, 3)];
  });

  test('gives every third mug free', () => {
    expect(policy.discountFor(lines, Money.of(0))).toEqual(Money.of(2500));
  });

  test('ignores other SKUs', () => {
    lines = [line('PEN-10', 640, 9)];

    expect(policy.discountFor(lines, Money.of(0))).toEqual(Money.of(0));
  });

  test('gives nothing free below n + 1 units', () => {
    lines[0] = line('MUG-01', 1250, 2);

    expect(policy.discountFor(lines, Money.of(0))).toEqual(Money.of(0));
  });
});
