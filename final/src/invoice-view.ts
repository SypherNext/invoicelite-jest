import { amountPaid, balanceDue } from './balance';
import type { Invoice, InvoiceStatus } from './invoice';

// The invoice as plain JSON data: amounts as cents and as text. The HTTP API
// sends this shape, and the screens in lesson 16 show it.
export interface InvoiceView {
  number: string;
  customer: string;
  country: string;
  status: InvoiceStatus;
  issueDate: string | null;
  dueDate: string | null;
  lines: { sku: string; description: string; quantity: number; unitPrice: string; total: string }[];
  totals: {
    subtotal: string;
    discount: string;
    tax: string;
    total: string;
    totalCents: number;
    paid: string;
    balanceDue: string;
    balanceDueCents: number;
  };
}

export function toInvoiceView(invoice: Invoice): InvoiceView {
  const { subtotal, discount, tax, total } = invoice.totals;
  return {
    number: invoice.number,
    customer: invoice.customer,
    country: invoice.country,
    status: invoice.status,
    issueDate: invoice.issueDate ?? null,
    dueDate: invoice.dueDate ?? null,
    lines: invoice.lines.map((line) => ({
      sku: line.sku,
      description: line.description,
      quantity: line.quantity,
      unitPrice: line.unitPrice.format(),
      total: line.total().format(),
    })),
    totals: {
      subtotal: subtotal.format(),
      discount: discount.format(),
      tax: tax.format(),
      total: total.format(),
      totalCents: total.cents,
      paid: amountPaid(invoice).format(),
      balanceDue: balanceDue(invoice).format(),
      balanceDueCents: balanceDue(invoice).cents,
    },
  };
}
