import type { InvoiceTotals } from './invoice-calculator';
import type { LineItem } from './line-item';
import type { Money } from './money';

// One payment towards an invoice: how much, the gateway's charge id, and the day.
export interface Payment {
  readonly amount: Money;
  readonly chargeId: string;
  readonly paidOn: string;
}

export type InvoiceStatus = 'DRAFT' | 'ISSUED' | 'PAID' | 'OVERDUE';

// An invoice is a plain, read-only value. Changing one means building a new one.
// Dates are ISO calendar dates such as '2026-11-17'.
export interface Invoice {
  readonly number: string;
  readonly customer: string;
  readonly country: string;
  readonly lines: readonly LineItem[];
  readonly totals: InvoiceTotals;
  readonly status: InvoiceStatus;
  readonly issueDate?: string;
  readonly dueDate?: string;
  readonly paymentReference?: string;
  readonly payments?: readonly Payment[];
}
