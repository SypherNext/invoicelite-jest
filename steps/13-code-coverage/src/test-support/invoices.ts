import type { Invoice } from '../invoice';
import { InvoiceCalculator } from '../invoice-calculator';
import { LineItem, type LineItemInput } from '../line-item';
import { Money } from '../money';

// Test data builders: one place that knows how to make a valid object,
// so each test only spells out the fields it cares about.

export function aLine(overrides: Partial<LineItemInput> = {}): LineItem {
  return new LineItem({
    sku: 'MUG-01',
    description: 'Enamel mug',
    unitPrice: Money.of(1250),
    quantity: 2,
    ...overrides,
  });
}

export function anInvoice(overrides: Partial<Invoice> = {}): Invoice {
  const lines = overrides.lines ?? [aLine()];
  const country = overrides.country ?? 'DE';
  return {
    number: 'INV-2026-0001',
    customer: 'Northwind Traders',
    country,
    lines,
    totals: new InvoiceCalculator().totals(lines, country),
    status: 'DRAFT',
    ...overrides,
  };
}
