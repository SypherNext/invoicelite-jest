// Where "now" comes from. Code that asks a Clock instead of calling new Date()
// can be tested on any day you choose.
export interface Clock {
  now(): Date;
}

export const systemClock: Clock = {
  now: () => new Date(),
};

// A clock that always answers the same instant, for tests and for replaying a day.
export function fixedClock(isoInstant: string): Clock {
  const instant = new Date(isoInstant).getTime();
  return { now: () => new Date(instant) };
}

// The calendar date of an instant in UTC, as 'YYYY-MM-DD'.
export function isoDate(instant: Date): string {
  return instant.toISOString().slice(0, 10);
}

// A calendar date some days later: addDays('2026-11-17', 30) is '2026-12-17'.
export function addDays(date: string, days: number): string {
  const result = new Date(`${date}T00:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return isoDate(result);
}
