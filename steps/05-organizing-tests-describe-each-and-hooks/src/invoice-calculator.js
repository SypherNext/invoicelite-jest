const { Money } = require('./money');
const { NoDiscount } = require('./discounts');
const { TaxCalculator } = require('./tax-calculator');

// Adds up the lines of an invoice, takes off the discount and adds tax.
class InvoiceCalculator {
  constructor(taxes = new TaxCalculator()) {
    this.taxes = taxes;
  }

  subtotal(lines, currency = 'EUR') {
    return lines.reduce((sum, line) => sum.plus(line.total()), Money.of(0, currency));
  }

  summarize(lines) {
    return {
      lineCount: lines.length,
      units: lines.reduce((sum, line) => sum + line.quantity, 0),
      skus: lines.map((line) => line.sku),
      subtotal: this.subtotal(lines),
    };
  }

  totals(lines, country, discountPolicy = new NoDiscount()) {
    const subtotal = this.subtotal(lines);
    const discount = discountPolicy.discountFor(lines, subtotal);
    const taxable = subtotal.minus(discount);
    const tax = this.taxes.taxOn(taxable, country);
    return { subtotal, discount, tax, total: taxable.plus(tax) };
  }
}

module.exports = { InvoiceCalculator };
