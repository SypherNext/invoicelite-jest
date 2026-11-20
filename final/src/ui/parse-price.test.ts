import { expect, test } from '@jest/globals';
import { parsePriceToCents } from './parse-price';

test.each([
  ['12.50', 1250],
  ['12.5', 1250],
  ['7', 700],
  ['0.05', 5],
  [' 6.40 ', 640],
])('"%s" is %i cents', (text, cents) => {
  expect(parsePriceToCents(text)).toBe(cents);
});

test.each(['', 'abc', '12,50', '1.005', '-3', '1e3'])('"%s" is not a price', (text) => {
  expect(parsePriceToCents(text)).toBeUndefined();
});
