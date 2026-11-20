import { describe, expect, test } from '@jest/globals';
import { EmailNotifier } from './email-notifier';
import { sendMail } from './mailer';
import { anInvoice } from './test-support/invoices';

// Replace every export of ./mailer with a mock function. The transform moves this
// call above the imports, so email-notifier gets the mock too. It must be the
// global `jest` (not one imported from @jest/globals) for @swc/jest to move it.
jest.mock('./mailer');

const sendMailMock = jest.mocked(sendMail);
const notifier = new EmailNotifier({ 'Northwind Traders': 'billing@northwind.example' });
const invoice = anInvoice({ status: 'ISSUED', issueDate: '2026-11-17', dueDate: '2026-12-17' });

describe('EmailNotifier', () => {
  test('emails the customer when an invoice is issued', async () => {
    await notifier.invoiceIssued(invoice);

    expect(sendMailMock).toHaveBeenCalledWith({
      to: 'billing@northwind.example',
      subject: 'Invoice INV-2026-0001',
      text: 'Your invoice INV-2026-0001 for EUR 29.75 is due on 2026-12-17.',
    });
  });

  test('says thank you for a payment', async () => {
    await notifier.paymentReceived(invoice);

    expect(sendMailMock.mock.calls[0][0].subject).toBe('Payment received for INV-2026-0001');
  });

  test('names the due date in the overdue reminder', async () => {
    await notifier.invoiceOverdue(invoice);

    expect(sendMailMock).toHaveBeenCalledWith(
      expect.objectContaining({ text: expect.stringContaining('was due on 2026-12-17') }),
    );
  });

  test('passes on a failure from the mail relay', async () => {
    sendMailMock.mockRejectedValueOnce(new Error('Mail relay answered 503'));

    await expect(notifier.invoiceIssued(invoice)).rejects.toThrow('Mail relay answered 503');
  });

  test('refuses a customer with no address and sends nothing', async () => {
    await expect(notifier.invoiceIssued(anInvoice({ customer: 'Unknown Ltd' }))).rejects.toThrow(
      'No email address for Unknown Ltd',
    );
    expect(sendMailMock).not.toHaveBeenCalled();
  });
});
