import type { Clock } from './clock';

// Hands out invoice numbers such as INV-2026-0001: the year comes from the clock,
// and the counter starts again at 1 every year.
export class InvoiceNumberGenerator {
  private readonly clock: Clock;
  private readonly lastByYear = new Map<number, number>();

  constructor(clock: Clock) {
    this.clock = clock;
  }

  next(): string {
    const year = this.clock.now().getUTCFullYear();
    const sequence = (this.lastByYear.get(year) ?? 0) + 1;
    this.lastByYear.set(year, sequence);
    return format(year, sequence);
  }
}

function format(year: number, sequence: number): string {
  return `INV-${year}-${String(sequence).padStart(4, '0')}`;
}
