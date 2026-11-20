import type { InvoiceStatus } from './invoice';

// The request itself is wrong, for example an invoice without lines.
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

// The invoice exists but is in the wrong state for the action, for example paying a draft.
export class InvalidInvoiceStateError extends Error {
  readonly number: string;
  readonly status: InvoiceStatus;

  constructor(number: string, status: InvoiceStatus, action: string) {
    super(`Invoice ${number} is ${status} and cannot be ${action}`);
    this.name = 'InvalidInvoiceStateError';
    this.number = number;
    this.status = status;
  }
}
