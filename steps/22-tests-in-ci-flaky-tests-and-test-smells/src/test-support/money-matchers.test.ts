import { describe, expect, test } from '@jest/globals';
import { Money } from '../money';

describe('toBeMoney', () => {
  test('passes when the amount and currency match', () => {
    expect(Money.of(2975)).toBeMoney('EUR 29.75');
    expect(Money.of(500, 'CHF')).toBeMoney('CHF 5.00');
  });

  test('works with .not', () => {
    expect(Money.of(2975)).not.toBeMoney('EUR 29.76');
  });

  test('fails with both amounts written the same way', () => {
    expect(() => expect(Money.of(2975)).toBeMoney('EUR 29.76')).toThrow(/Received: "EUR 29.75"/);
  });

  test('fails for something that is not Money', () => {
    expect(() => expect(2975).toBeMoney('EUR 29.75')).toThrow(/Received: 2975/);
  });

  test('works inside toEqual as expect.toBeMoney()', () => {
    const totals = { subtotal: Money.of(2500), tax: Money.of(475) };

    expect(totals).toEqual({ subtotal: expect.toBeMoney('EUR 25.00'), tax: expect.toBeMoney('EUR 4.75') });
  });
});

describe('the setup files', () => {
  test('every test runs in UTC, so local dates are the same everywhere', () => {
    const lateEvening = new Date('2026-11-17T23:30:00Z');

    expect(lateEvening.getDate()).toBe(17);
    expect(lateEvening.getHours()).toBe(23);
  });
});
