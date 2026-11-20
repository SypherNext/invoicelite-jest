import { expect, test } from '@jest/globals';
import { toInvoiceView } from './invoice-view';
import { anInvoice } from './test-support/invoices';

test('a draft has no dates yet', () => {
  const view = toInvoiceView(anInvoice({ status: 'DRAFT' }));

  expect(view.issueDate).toBeNull();
  expect(view.dueDate).toBeNull();
});

test('gives the total as text for people and in cents for programs', () => {
  expect(toInvoiceView(anInvoice()).totals).toMatchObject({ total: 'EUR 29.75', totalCents: 2975 });
});
