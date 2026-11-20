const { Money } = require('./money');

// Standard VAT rates in percent, by country code. A small fixed table for the course.
const STANDARD_RATES = { DE: 19, FR: 20, NL: 21, CH: 8.1 };

class TaxCalculator {
  constructor(rates = STANDARD_RATES) {
    this.rates = rates;
  }

  rateFor(country) {
    const rate = this.rates[country];
    if (rate === undefined) {
      throw new Error(`No tax rate for country ${country}`);
    }
    return rate;
  }

  // Tax on a total, rounded once.
  taxOn(amount, country) {
    return amount.percent(this.rateFor(country));
  }

  // Tax rounded on every line, then added up. Can differ from taxOn by a few cents.
  // The sum starts at zero, so an invoice with no lines owes no tax.
  taxPerLine(lines, country, currency = 'EUR') {
    const rate = this.rateFor(country);
    return lines
      .map((line) => line.total().percent(rate))
      .reduce((sum, tax) => sum.plus(tax), Money.of(0, currency));
  }
}

module.exports = { TaxCalculator, STANDARD_RATES };
