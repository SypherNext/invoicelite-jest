import type { Invoice } from './invoice';
import { Money } from './money';

// Everything paid towards an invoice so far.
export function amountPaid(invoice: Invoice): Money {
  const zero = Money.of(0, invoice.totals.total.currency);
  return (invoice.payments ?? []).reduce((sum, payment) => sum.plus(payment.amount), zero);
}

// What the customer still owes.
export function balanceDue(invoice: Invoice): Money {
  return invoice.totals.total.minus(amountPaid(invoice));
}
