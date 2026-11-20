import type { Invoice, InvoiceStatus } from './invoice';

// Where invoices are kept. Every method returns a Promise, because a real store
// (a database, a web service) answers later, not right away.
export interface InvoiceRepository {
  save(invoice: Invoice): Promise<void>;
  findByNumber(number: string): Promise<Invoice | undefined>;
  findByStatus(status: InvoiceStatus): Promise<Invoice[]>;
}

export class InvoiceNotFoundError extends Error {
  readonly number: string;

  constructor(number: string) {
    super(`Invoice ${number} was not found`);
    this.name = 'InvoiceNotFoundError';
    this.number = number;
  }
}

// Finds an invoice or rejects with InvoiceNotFoundError.
export async function requireInvoice(repository: InvoiceRepository, number: string): Promise<Invoice> {
  const invoice = await repository.findByNumber(number);
  if (!invoice) {
    throw new InvoiceNotFoundError(number);
  }
  return invoice;
}

export class InMemoryInvoiceRepository implements InvoiceRepository {
  private readonly invoices = new Map<string, Invoice>();

  async save(invoice: Invoice): Promise<void> {
    this.invoices.set(invoice.number, invoice);
  }

  async findByNumber(number: string): Promise<Invoice | undefined> {
    return this.invoices.get(number);
  }

  async findByStatus(status: InvoiceStatus): Promise<Invoice[]> {
    return [...this.invoices.values()].filter((invoice) => invoice.status === status);
  }
}
