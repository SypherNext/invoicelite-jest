import type { Invoice } from './invoice';
import { sendMail } from './mailer';
import type { Notifier } from './notifier';

// Sends the customer an email for each event. Addresses come from a small
// address book: customer name to billing email.
export class EmailNotifier implements Notifier {
  private readonly addresses: Readonly<Record<string, string>>;

  constructor(addresses: Readonly<Record<string, string>>) {
    this.addresses = addresses;
  }

  async invoiceIssued(invoice: Invoice): Promise<void> {
    await this.send(
      invoice,
      `Invoice ${invoice.number}`,
      `Your invoice ${invoice.number} for ${invoice.totals.total.format()} is due on ${invoice.dueDate}.`,
    );
  }

  async paymentReceived(invoice: Invoice): Promise<void> {
    await this.send(
      invoice,
      `Payment received for ${invoice.number}`,
      `Thank you. We received ${invoice.totals.total.format()} for invoice ${invoice.number}.`,
    );
  }

  async invoiceOverdue(invoice: Invoice): Promise<void> {
    await this.send(
      invoice,
      `Invoice ${invoice.number} is overdue`,
      `Invoice ${invoice.number} for ${invoice.totals.total.format()} was due on ${invoice.dueDate}.`,
    );
  }

  private async send(invoice: Invoice, subject: string, text: string): Promise<void> {
    const to = this.addresses[invoice.customer];
    if (!to) {
      throw new Error(`No email address for ${invoice.customer}`);
    }
    await sendMail({ to, subject, text });
  }
}
