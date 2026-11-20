const { Money } = require('./money');

// Adds up the lines of an invoice.
class InvoiceCalculator {
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
}

module.exports = { InvoiceCalculator };
