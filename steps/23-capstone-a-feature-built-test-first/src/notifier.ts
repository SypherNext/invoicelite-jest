import type { Invoice } from './invoice';

// Tells the customer what happened to their invoice. The real one sends email.
export interface Notifier {
  invoiceIssued(invoice: Invoice): Promise<void>;
  paymentReceived(invoice: Invoice): Promise<void>;
  invoiceOverdue(invoice: Invoice): Promise<void>;
}
