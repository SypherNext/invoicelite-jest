import { expect, test } from '@jest/globals';
import { type Clock, fixedClock } from './clock';
import { InvoiceNumberGenerator } from './invoice-number-generator';

const november2026 = fixedClock('2026-11-17T09:30:00Z');

test('the first number of the year is INV-2026-0001', () => {
  const numbers = new InvoiceNumberGenerator(november2026);

  expect(numbers.next()).toBe('INV-2026-0001');
});

test('counts up by one', () => {
  const numbers = new InvoiceNumberGenerator(november2026);

  numbers.next();

  expect(numbers.next()).toBe('INV-2026-0002');
});

test('takes the year from the clock', () => {
  const numbers = new InvoiceNumberGenerator(fixedClock('2027-03-01T08:00:00Z'));

  expect(numbers.next()).toBe('INV-2027-0001');
});

test('starts again at 0001 in a new year', () => {
  let now = new Date('2026-12-31T23:59:00Z');
  const clock: Clock = { now: () => now };
  const numbers = new InvoiceNumberGenerator(clock);
  numbers.next();
  numbers.next();

  now = new Date('2027-01-01T00:01:00Z');

  expect(numbers.next()).toBe('INV-2027-0001');
});

test('keeps counting past 9999', () => {
  const numbers = new InvoiceNumberGenerator(november2026);
  for (let i = 0; i < 9999; i++) {
    numbers.next();
  }

  expect(numbers.next()).toBe('INV-2026-10000');
});
