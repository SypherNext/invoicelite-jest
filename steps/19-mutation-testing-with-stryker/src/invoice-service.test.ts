import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals';
import { fixedClock, systemClock } from './clock';
import { PercentageDiscount } from './discounts';
import { InvalidInvoiceStateError, ValidationError } from './errors';
import { InMemoryInvoiceRepository } from './invoice-repository';
import { InvoiceNumberGenerator } from './invoice-number-generator';
import { InvoiceService } from './invoice-service';
import { Money } from './money';
import { mockNotifier, mockPaymentGateway } from './test-support/doubles';
import { aLine, anInvoice } from './test-support/invoices';

const today = fixedClock('2026-11-17T09:00:00Z');

let repository: InMemoryInvoiceRepository;
let numbers: InvoiceNumberGenerator;
let payments: ReturnType<typeof mockPaymentGateway>;
let notifier: ReturnType<typeof mockNotifier>;
let service: InvoiceService;

beforeEach(() => {
  repository = new InMemoryInvoiceRepository();
  numbers = new InvoiceNumberGenerator(today);
  payments = mockPaymentGateway();
  notifier = mockNotifier();
  service = new InvoiceService({
    repository,
    numbers,
    clock: today,
    payments,
    notifier,
  });
});

const newInvoice = { customer: 'Northwind Traders', country: 'DE', lines: [aLine()] };

describe('create', () => {
  test('saves a draft with the next number and its totals', async () => {
    const invoice = await service.create({ ...newInvoice, discount: new PercentageDiscount(10) });

    expect(invoice).toMatchObject({ number: 'INV-2026-0001', status: 'DRAFT' });
    expect(invoice.totals.total).toBeMoney('EUR 26.78');
    await expect(repository.findByNumber('INV-2026-0001')).resolves.toEqual(invoice);
  });

  test('asks the generator for exactly one number', async () => {
    const next = jest.spyOn(numbers, 'next');

    await service.create(newInvoice);

    expect(next).toHaveBeenCalledTimes(1);
    expect(next).toHaveReturnedWith('INV-2026-0001');
  });

  test('refuses an invoice without lines', async () => {
    await expect(service.create({ ...newInvoice, lines: [] })).rejects.toThrow(ValidationError);
  });
});

describe('issue', () => {
  test('sets the issue date to today and the due date 30 days later', async () => {
    const { number } = await service.create(newInvoice);

    const issued = await service.issue(number);

    expect(issued).toMatchObject({ status: 'ISSUED', issueDate: '2026-11-17', dueDate: '2026-12-17' });
  });

  test('tells the customer once', async () => {
    const { number } = await service.create(newInvoice);

    const issued = await service.issue(number);

    expect(notifier.invoiceIssued).toHaveBeenCalledTimes(1);
    expect(notifier.invoiceIssued).toHaveBeenCalledWith(issued);
  });

  test('refuses to issue an invoice twice and tells nobody the second time', async () => {
    const { number } = await service.create(newInvoice);
    await service.issue(number);

    await expect(service.issue(number)).rejects.toThrow(InvalidInvoiceStateError);
    expect(notifier.invoiceIssued).toHaveBeenCalledTimes(1);
  });

  test('stays issued when the email fails, and logs a warning', async () => {
    const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
    notifier.invoiceIssued.mockRejectedValueOnce(new Error('Mail relay answered 503'));
    const { number } = await service.create(newInvoice);

    const issued = await service.issue(number);

    expect(issued.status).toBe('ISSUED');
    expect(warn).toHaveBeenCalledWith(
      'Could not notify Northwind Traders about INV-2026-0001: Mail relay answered 503',
    );
  });
});

describe('pay', () => {
  test('charges the customer the invoice total', async () => {
    await repository.save(anInvoice({ status: 'ISSUED' }));

    await service.pay('INV-2026-0001');

    expect(payments.charge).toHaveBeenCalledWith({
      invoiceNumber: 'INV-2026-0001',
      customer: 'Northwind Traders',
      amount: Money.of(2975),
    });
  });

  test('keeps the charge id the gateway returns', async () => {
    await repository.save(anInvoice({ status: 'ISSUED' }));
    payments.charge.mockResolvedValueOnce({ chargeId: 'ch_3PqX7' });

    const paid = await service.pay('INV-2026-0001');

    expect(paid).toMatchObject({ status: 'PAID', paymentReference: 'ch_3PqX7' });
    expect(notifier.paymentReceived).toHaveBeenCalledWith(paid);
  });

  test('leaves the invoice unpaid when the gateway declines', async () => {
    await repository.save(anInvoice({ status: 'ISSUED' }));
    payments.charge.mockRejectedValueOnce(new Error('card declined'));

    await expect(service.pay('INV-2026-0001')).rejects.toThrow('card declined');

    await expect(repository.findByNumber('INV-2026-0001')).resolves.toMatchObject({ status: 'ISSUED' });
    expect(notifier.paymentReceived).not.toHaveBeenCalled();
  });

  test('never charges for a draft', async () => {
    await repository.save(anInvoice({ status: 'DRAFT' }));

    await expect(service.pay('INV-2026-0001')).rejects.toThrow(
      'Invoice INV-2026-0001 is DRAFT and cannot be paid',
    );
    expect(payments.charge).not.toHaveBeenCalled();
  });

  test('builds the charge id from what it was given', async () => {
    payments.charge.mockImplementation(async (request) => ({ chargeId: `ch_${request.invoiceNumber}` }));
    await repository.save(anInvoice({ number: 'INV-2026-0007', status: 'ISSUED' }));

    const paid = await service.pay('INV-2026-0007');

    expect(paid.paymentReference).toBe('ch_INV-2026-0007');
  });
});

describe('markOverdue', () => {
  test('marks only issued invoices whose due date has passed', async () => {
    await repository.save(anInvoice({ number: 'INV-2026-0001', status: 'ISSUED', dueDate: '2026-11-16' }));
    await repository.save(anInvoice({ number: 'INV-2026-0002', status: 'ISSUED', dueDate: '2026-11-17' }));
    await repository.save(anInvoice({ number: 'INV-2026-0003', status: 'PAID', dueDate: '2026-10-01' }));

    const overdue = await service.markOverdue();

    expect(overdue.map((invoice) => invoice.number)).toEqual(['INV-2026-0001']);
    expect(notifier.invoiceOverdue).toHaveBeenCalledTimes(1);
    expect(notifier.invoiceOverdue.mock.calls[0][0]).toMatchObject({
      number: 'INV-2026-0001',
      status: 'OVERDUE',
    });
  });
});

describe('with the system clock and fake time', () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  test('an invoice issued today is overdue 31 days later', async () => {
    jest.useFakeTimers({ now: new Date('2026-11-17T09:00:00Z') });
    const clockService = new InvoiceService({
      repository,
      numbers: new InvoiceNumberGenerator(systemClock),
      clock: systemClock,
      payments,
      notifier,
    });
    const { number } = await clockService.create(newInvoice);
    await clockService.issue(number);

    jest.setSystemTime(new Date('2026-12-17T23:00:00Z'));
    await expect(clockService.markOverdue()).resolves.toEqual([]);

    jest.setSystemTime(new Date('2026-12-18T00:00:00Z'));
    const overdue = await clockService.markOverdue();

    expect(overdue).toHaveLength(1);
    expect(overdue[0]).toMatchObject({ number, status: 'OVERDUE', dueDate: '2026-12-17' });
  });
});
