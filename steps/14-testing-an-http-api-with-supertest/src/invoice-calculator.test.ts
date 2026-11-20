import { describe, expect, test } from '@jest/globals';
import { InvoiceCalculator } from './invoice-calculator';
import { PercentageDiscount } from './discounts';
import { LineItem } from './line-item';
import { Money } from './money';

const calculator = new InvoiceCalculator();
const lines = [
  new LineItem({ sku: 'MUG-01', description: 'Enamel mug', unitPrice: Money.of(1250), quantity: 2 }),
  new LineItem({ sku: 'PEN-10', description: 'Gel pen pack', unitPrice: Money.of(640), quantity: 1 }),
];

test('the subtotal of no lines is zero', () => {
  expect(calculator.subtotal([])).toEqual(Money.of(0));
});

test('the subtotal adds every line total', () => {
  expect(calculator.subtotal(lines)).toEqual(Money.of(3140));
});

test('summarizes the lines', () => {
  expect(calculator.summarize(lines)).toEqual({
    lineCount: 2,
    units: 3,
    skus: ['MUG-01', 'PEN-10'],
    subtotal: Money.of(3140),
  });
});

test('the summary lists every SKU', () => {
  const { skus } = calculator.summarize(lines);

  expect(skus).toHaveLength(2);
  expect(skus).toContain('PEN-10');
  expect(skus).toEqual(expect.arrayContaining(['PEN-10', 'MUG-01']));
});

test('checks only the parts of the summary that matter here', () => {
  expect(calculator.summarize(lines)).toEqual(
    expect.objectContaining({ lineCount: 2, units: expect.any(Number) }),
  );
  expect(calculator.summarize(lines).units).toBeGreaterThan(2);
});

describe('totals', () => {
  test('adds German VAT to the subtotal', () => {
    expect(calculator.totals(lines, 'DE')).toEqual({
      subtotal: Money.of(3140),
      discount: Money.of(0),
      tax: Money.of(597),
      total: Money.of(3737),
    });
  });

  test('takes the discount off before tax', () => {
    const totals = calculator.totals(lines, 'DE', new PercentageDiscount(10));

    expect(totals.discount).toEqual(Money.of(314));
    expect(totals.tax).toEqual(Money.of(537));
    expect(totals.total).toEqual(Money.of(3363));
  });
});
