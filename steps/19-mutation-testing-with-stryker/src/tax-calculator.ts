import type { LineItem } from './line-item';
import { Money } from './money';

export type TaxRates = Readonly<Record<string, number>>;

// Standard VAT rates in percent, by country code. A small fixed table for the course.
export const STANDARD_RATES: TaxRates = { DE: 19, FR: 20, NL: 21, CH: 8.1 };

export class TaxCalculator {
  private readonly rates: TaxRates;

  constructor(rates: TaxRates = STANDARD_RATES) {
    this.rates = rates;
  }

  rateFor(country: string): number {
    const rate = this.rates[country];
    if (rate === undefined) {
      throw new Error(`No tax rate for country ${country}`);
    }
    return rate;
  }

  // Tax on a total, rounded once.
  taxOn(amount: Money, country: string): Money {
    return amount.percent(this.rateFor(country));
  }

  // Tax rounded on every line, then added up. Can differ from taxOn by a few cents.
  // The sum starts at zero, so an invoice with no lines owes no tax.
  taxPerLine(lines: readonly LineItem[], country: string, currency = 'EUR'): Money {
    const rate = this.rateFor(country);
    return lines
      .map((line) => line.total().percent(rate))
      .reduce((sum, tax) => sum.plus(tax), Money.of(0, currency));
  }
}
