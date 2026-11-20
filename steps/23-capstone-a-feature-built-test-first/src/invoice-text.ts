import type { Invoice } from './invoice';
import type { LineItem } from './line-item';
import type { Money } from './money';

const WIDTH = 60;

// The invoice as plain text, for an email body or a terminal.
export function renderInvoiceText(invoice: Invoice): string {
  const { subtotal, discount, tax, total } = invoice.totals;
  return [
    `INVOICE ${invoice.number}`,
    `Customer: ${invoice.customer} (${invoice.country})`,
    `Issued: ${invoice.issueDate ?? 'not yet'}   Due: ${invoice.dueDate ?? 'not yet'}`,
    `Status: ${invoice.status}`,
    '',
    row('SKU', 'Description', 'Qty', 'Unit price', 'Total'),
    ...invoice.lines.map(lineRow),
    '',
    amountRow('Subtotal', subtotal),
    amountRow('Discount', discount),
    amountRow(`Tax (${invoice.country})`, tax),
    amountRow('Total', total),
  ].join('\n');
}

function lineRow(line: LineItem): string {
  return row(line.sku, line.description, String(line.quantity), line.unitPrice.format(), line.total().format());
}

function row(sku: string, description: string, quantity: string, unitPrice: string, total: string): string {
  return sku.padEnd(9) + description.padEnd(20) + quantity.padStart(4) + unitPrice.padStart(13) + total.padStart(14);
}

function amountRow(label: string, amount: Money): string {
  return label + amount.format().padStart(WIDTH - label.length);
}
