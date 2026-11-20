import { addDays, type Clock, isoDate } from './clock';
import type { DiscountPolicy } from './discounts';
import { InvalidInvoiceStateError, ValidationError } from './errors';
import type { Invoice, InvoiceStatus } from './invoice';
import { InvoiceCalculator } from './invoice-calculator';
import type { InvoiceNumberGenerator } from './invoice-number-generator';
import { type InvoiceRepository, requireInvoice } from './invoice-repository';
import type { LineItem } from './line-item';
import type { Notifier } from './notifier';
import type { PaymentGateway } from './payment-gateway';

export interface NewInvoice {
  customer: string;
  country: string;
  lines: readonly LineItem[];
  discount?: DiscountPolicy;
}

// Everything the service talks to comes in from outside, so a test can hand in
// an in-memory repository, a fixed clock and test doubles.
export interface InvoiceServiceDependencies {
  repository: InvoiceRepository;
  numbers: InvoiceNumberGenerator;
  clock: Clock;
  payments: PaymentGateway;
  notifier: Notifier;
  calculator?: InvoiceCalculator;
  paymentTermsDays?: number;
  logger?: Pick<Console, 'warn'>;
}

export class InvoiceService {
  private readonly repository: InvoiceRepository;
  private readonly numbers: InvoiceNumberGenerator;
  private readonly clock: Clock;
  private readonly payments: PaymentGateway;
  private readonly notifier: Notifier;
  private readonly calculator: InvoiceCalculator;
  private readonly paymentTermsDays: number;
  private readonly logger: Pick<Console, 'warn'>;

  constructor(deps: InvoiceServiceDependencies) {
    this.repository = deps.repository;
    this.numbers = deps.numbers;
    this.clock = deps.clock;
    this.payments = deps.payments;
    this.notifier = deps.notifier;
    this.calculator = deps.calculator ?? new InvoiceCalculator();
    this.paymentTermsDays = deps.paymentTermsDays ?? 30;
    this.logger = deps.logger ?? console;
  }

  async create({ customer, country, lines, discount }: NewInvoice): Promise<Invoice> {
    if (lines.length === 0) {
      throw new ValidationError('An invoice needs at least one line');
    }
    const invoice: Invoice = {
      number: this.numbers.next(),
      customer,
      country,
      lines,
      totals: this.calculator.totals(lines, country, discount),
      status: 'DRAFT',
    };
    await this.repository.save(invoice);
    return invoice;
  }

  async get(number: string): Promise<Invoice> {
    return requireInvoice(this.repository, number);
  }

  async issue(number: string): Promise<Invoice> {
    const invoice = await this.find(number, ['DRAFT'], 'issued');
    const issueDate = isoDate(this.clock.now());
    const issued: Invoice = {
      ...invoice,
      status: 'ISSUED',
      issueDate,
      dueDate: addDays(issueDate, this.paymentTermsDays),
    };
    await this.repository.save(issued);
    await this.notify(issued, (n) => n.invoiceIssued(issued));
    return issued;
  }

  async pay(number: string): Promise<Invoice> {
    const invoice = await this.find(number, ['ISSUED', 'OVERDUE'], 'paid');
    const { chargeId } = await this.payments.charge({
      invoiceNumber: invoice.number,
      customer: invoice.customer,
      amount: invoice.totals.total,
    });
    const paid: Invoice = { ...invoice, status: 'PAID', paymentReference: chargeId };
    await this.repository.save(paid);
    await this.notify(paid, (n) => n.paymentReceived(paid));
    return paid;
  }

  // Marks every issued invoice whose due date has passed as overdue.
  async markOverdue(): Promise<Invoice[]> {
    const today = isoDate(this.clock.now());
    const issued = await this.repository.findByStatus('ISSUED');
    const overdue = issued
      .filter((invoice) => invoice.dueDate !== undefined && invoice.dueDate < today)
      .map((invoice): Invoice => ({ ...invoice, status: 'OVERDUE' }));
    for (const invoice of overdue) {
      await this.repository.save(invoice);
      await this.notify(invoice, (n) => n.invoiceOverdue(invoice));
    }
    return overdue;
  }

  // A failed email must not undo an invoice that was issued or paid: log it and go on.
  private async notify(invoice: Invoice, send: (notifier: Notifier) => Promise<void>): Promise<void> {
    try {
      await send(this.notifier);
    } catch (error) {
      this.logger.warn(`Could not notify ${invoice.customer} about ${invoice.number}: ${(error as Error).message}`);
    }
  }

  private async find(number: string, allowed: InvoiceStatus[], action: string): Promise<Invoice> {
    const invoice = await requireInvoice(this.repository, number);
    if (!allowed.includes(invoice.status)) {
      throw new InvalidInvoiceStateError(number, invoice.status, action);
    }
    return invoice;
  }
}
