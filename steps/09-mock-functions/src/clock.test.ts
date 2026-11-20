import { describe, expect, test } from '@jest/globals';
import { addDays, fixedClock, isoDate } from './clock';

describe('fixedClock', () => {
  test('always answers the same instant', () => {
    const clock = fixedClock('2026-11-17T09:30:00Z');

    expect(clock.now().toISOString()).toBe('2026-11-17T09:30:00.000Z');
    expect(clock.now()).toEqual(clock.now());
  });

  test('hands out a new Date each time, so callers cannot change it', () => {
    const clock = fixedClock('2026-11-17T09:30:00Z');

    clock.now().setUTCFullYear(1999);

    expect(clock.now().getUTCFullYear()).toBe(2026);
  });
});

describe('dates', () => {
  test('isoDate is the UTC calendar date', () => {
    expect(isoDate(new Date('2026-11-17T23:59:59Z'))).toBe('2026-11-17');
  });

  test.each([
    ['2026-11-17', 30, '2026-12-17'],
    ['2026-12-15', 30, '2027-01-14'],
    ['2028-02-28', 1, '2028-02-29'],
  ])('%s plus %i days is %s', (start, days, expected) => {
    expect(addDays(start, days)).toBe(expected);
  });
});
