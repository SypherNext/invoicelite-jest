import type { Pool } from 'pg';
import type { Invoice, InvoiceStatus } from './invoice';
import type { InvoiceRepository } from './invoice-repository';
import { LineItem } from './line-item';
import { Money } from './money';

// The columns, as PostgreSQL returns them. Dates come back as text ('2026-11-17'):
// the query casts them, so the pg driver never turns them into a local-time Date.
interface InvoiceRow {
  number: string;
  customer: string;
  country: string;
  status: InvoiceStatus;
  issue_date: string | null;
  due_date: string | null;
  payment_reference: string | null;
  currency: string;
  lines: { sku: string; description: string; unitPriceCents: number; quantity: number }[];
  totals: { subtotal: number; discount: number; tax: number; total: number };
  payments: { amountCents: number; chargeId: string; paidOn: string }[];
}

const SELECT = `
  select number, customer, country, status, issue_date::text, due_date::text,
         payment_reference, currency, lines, totals, payments
  from invoices`;

// Keeps invoices in PostgreSQL. Lines and totals are stored as JSON, amounts in cents.
export class PgInvoiceRepository implements InvoiceRepository {
  private readonly pool: Pool;

  constructor(pool: Pool) {
    this.pool = pool;
  }

  async save(invoice: Invoice): Promise<void> {
    await this.pool.query(
      `insert into invoices
         (number, customer, country, status, issue_date, due_date, payment_reference, currency, lines, totals, payments)
       values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       on conflict (number) do update set
         customer = excluded.customer, country = excluded.country, status = excluded.status,
         issue_date = excluded.issue_date, due_date = excluded.due_date,
         payment_reference = excluded.payment_reference, currency = excluded.currency,
         lines = excluded.lines, totals = excluded.totals, payments = excluded.payments`,
      toParameters(invoice),
    );
  }

  async findByNumber(number: string): Promise<Invoice | undefined> {
    const { rows } = await this.pool.query<InvoiceRow>(`${SELECT} where number = $1`, [number]);
    return rows.length === 0 ? undefined : fromRow(rows[0]);
  }

  async findByStatus(status: InvoiceStatus): Promise<Invoice[]> {
    const { rows } = await this.pool.query<InvoiceRow>(`${SELECT} where status = $1 order by number`, [status]);
    return rows.map(fromRow);
  }
}

function toParameters(invoice: Invoice): unknown[] {
  const { subtotal, discount, tax, total } = invoice.totals;
  const lines = invoice.lines.map((line) => ({
    sku: line.sku,
    description: line.description,
    unitPriceCents: line.unitPrice.cents,
    quantity: line.quantity,
  }));
  return [
    invoice.number,
    invoice.customer,
    invoice.country,
    invoice.status,
    invoice.issueDate ?? null,
    invoice.dueDate ?? null,
    invoice.paymentReference ?? null,
    total.currency,
    JSON.stringify(lines),
    JSON.stringify({ subtotal: subtotal.cents, discount: discount.cents, tax: tax.cents, total: total.cents }),
    JSON.stringify(
      (invoice.payments ?? []).map((payment) => ({
        amountCents: payment.amount.cents,
        chargeId: payment.chargeId,
        paidOn: payment.paidOn,
      })),
    ),
  ];
}

function fromRow(row: InvoiceRow): Invoice {
  const money = (cents: number) => Money.of(cents, row.currency);
  return {
    number: row.number,
    customer: row.customer,
    country: row.country,
    status: row.status,
    lines: row.lines.map(
      (line) =>
        new LineItem({
          sku: line.sku,
          description: line.description,
          unitPrice: money(line.unitPriceCents),
          quantity: line.quantity,
        }),
    ),
    totals: {
      subtotal: money(row.totals.subtotal),
      discount: money(row.totals.discount),
      tax: money(row.totals.tax),
      total: money(row.totals.total),
    },
    ...(row.issue_date && { issueDate: row.issue_date }),
    ...(row.due_date && { dueDate: row.due_date }),
    ...(row.payment_reference && { paymentReference: row.payment_reference }),
    ...(row.payments.length > 0 && {
      payments: row.payments.map((payment) => ({
        amount: money(payment.amountCents),
        chargeId: payment.chargeId,
        paidOn: payment.paidOn,
      })),
    }),
  };
}
