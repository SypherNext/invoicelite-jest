import type { InvoiceTotals } from './invoice-calculator';
import type { LineItem } from './line-item';

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
}
