import { describe, expect, test } from '@jest/globals';
import fc from 'fast-check';
import { BuyNGetOneFree, type DiscountPolicy, PercentageDiscount, TieredDiscount } from './discounts';
import { InvoiceCalculator } from './invoice-calculator';
import { LineItem } from './line-item';
import { Money } from './money';
import { TaxCalculator } from './tax-calculator';

// Generators: random but valid invoice lines and discount policies.
const line = fc
  .record({
    sku: fc.constantFrom('MUG-01', 'PEN-10', 'BAG-02'),
    unitCents: fc.integer({ min: 1, max: 100_000 }),
    quantity: fc.integer({ min: 1, max: 50 }),
  })
  .map(({ sku, unitCents, quantity }) => new LineItem({ sku, description: sku, unitPrice: Money.of(unitCents), quantity }));
const lines = fc.array(line, { minLength: 1, maxLength: 8 });
const country = fc.constantFrom('DE', 'FR', 'NL', 'CH');

const policy: fc.Arbitrary<DiscountPolicy> = fc.oneof(
  fc.integer({ min: 0, max: 100 }).map((percent) => new PercentageDiscount(percent)),
  fc
    .tuple(fc.integer({ min: 0, max: 1_000_000 }), fc.integer({ min: 0, max: 100 }))
    .map(([from, percent]) => new TieredDiscount([{ from: Money.of(from), percent }])),
  fc
    .tuple(fc.constantFrom('MUG-01', 'PEN-10'), fc.integer({ min: 1, max: 5 }))
    .map(([sku, n]) => new BuyNGetOneFree(sku, n)),
);

const calculator = new InvoiceCalculator();
const taxes = new TaxCalculator();

describe('pricing properties', () => {
  test('a discount is never negative and never more than the subtotal', () => {
    fc.assert(
      fc.property(lines, policy, (someLines, discountPolicy) => {
        const subtotal = calculator.subtotal(someLines);
        const discount = discountPolicy.discountFor(someLines, subtotal);
        expect(discount.cents).toBeGreaterThanOrEqual(0);
        expect(discount.cents).toBeLessThanOrEqual(subtotal.cents);
      }),
    );
  });

  test('the total is the subtotal minus the discount plus the tax', () => {
    fc.assert(
      fc.property(lines, country, policy, (someLines, someCountry, discountPolicy) => {
        const { subtotal, discount, tax, total } = calculator.totals(someLines, someCountry, discountPolicy);
        expect(total).toEqual(subtotal.minus(discount).plus(tax));
      }),
    );
  });

  test('rounding per line differs from rounding once by at most half a cent per line', () => {
    fc.assert(
      fc.property(lines, country, (someLines, someCountry) => {
        const perLine = taxes.taxPerLine(someLines, someCountry).cents;
        const once = taxes.taxOn(calculator.subtotal(someLines), someCountry).cents;
        expect(Math.abs(perLine - once)).toBeLessThanOrEqual((someLines.length + 1) / 2);
      }),
    );
  });
});
