import { type DiscountPolicy, NoDiscount } from './discounts';
import type { LineItem } from './line-item';
import { Money } from './money';
import { TaxCalculator } from './tax-calculator';

export interface InvoiceSummary {
  lineCount: number;
  units: number;
  skus: string[];
  subtotal: Money;
}

export interface InvoiceTotals {
  subtotal: Money;
  discount: Money;
  tax: Money;
  total: Money;
}

// Adds up the lines of an invoice, takes off the discount and adds tax.
export class InvoiceCalculator {
  private readonly taxes: TaxCalculator;

  constructor(taxes = new TaxCalculator()) {
    this.taxes = taxes;
  }

  subtotal(lines: readonly LineItem[], currency = 'EUR'): Money {
    return lines.reduce((sum, line) => sum.plus(line.total()), Money.of(0, currency));
  }

  summarize(lines: readonly LineItem[]): InvoiceSummary {
    return {
      lineCount: lines.length,
      units: lines.reduce((sum, line) => sum + line.quantity, 0),
      skus: lines.map((line) => line.sku),
      subtotal: this.subtotal(lines),
    };
  }

  totals(lines: readonly LineItem[], country: string, discountPolicy: DiscountPolicy = new NoDiscount()): InvoiceTotals {
    const subtotal = this.subtotal(lines);
    const discount = discountPolicy.discountFor(lines, subtotal);
    const taxable = subtotal.minus(discount);
    const tax = this.taxes.taxOn(taxable, country);
    return { subtotal, discount, tax, total: taxable.plus(tax) };
  }
}
