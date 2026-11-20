import { expect, test } from '@jest/globals';
import { LineItem } from './line-item';
import { Money } from './money';

const mug = { sku: 'MUG-01', description: 'Enamel mug', unitPrice: Money.of(1250), quantity: 2 };

test('the line total is unit price times quantity', () => {
  expect(new LineItem(mug).total()).toEqual(Money.of(2500));
});

test('keeps what it was given', () => {
  const line = new LineItem(mug);

  expect(line).toMatchObject({ sku: 'MUG-01', quantity: 2 });
  expect(line).toHaveProperty('unitPrice.cents', 1250);
});

test('needs a SKU', () => {
  expect(() => new LineItem({ ...mug, sku: '' })).toThrow('A line item needs a SKU');
});

test('needs a whole quantity of at least 1', () => {
  expect(() => new LineItem({ ...mug, quantity: 0 })).toThrow('got 0');
  expect(() => new LineItem({ ...mug, quantity: 1.5 })).toThrow('got 1.5');
});
