import { beforeEach, describe, expect, jest, test } from '@jest/globals';
import request from 'supertest';
import { fixedClock } from '../clock';
import { InMemoryInvoiceRepository } from '../invoice-repository';
import { InvoiceNumberGenerator } from '../invoice-number-generator';
import { InvoiceService } from '../invoice-service';
import { mockNotifier, mockPaymentGateway } from '../test-support/doubles';
import { anInvoice } from '../test-support/invoices';
import { createApp } from './app';

const today = fixedClock('2026-11-17T09:00:00Z');
const mugOrder = {
  customer: 'Northwind Traders',
  country: 'DE',
  lines: [{ sku: 'MUG-01', description: 'Enamel mug', unitPriceCents: 1250, quantity: 2 }],
};

let repository: InMemoryInvoiceRepository;
let payments: ReturnType<typeof mockPaymentGateway>;
let api: ReturnType<typeof request>;

beforeEach(() => {
  repository = new InMemoryInvoiceRepository();
  payments = mockPaymentGateway();
  const service = new InvoiceService({
    repository,
    numbers: new InvoiceNumberGenerator(today),
    clock: today,
    payments,
    notifier: mockNotifier(),
  });
  api = request(createApp(service));
});

describe('POST /invoices', () => {
  test('creates a draft and says where to find it', async () => {
    const response = await api.post('/invoices').send(mugOrder).expect(201);

    expect(response.headers.location).toBe('/invoices/INV-2026-0001');
    expect(response.body).toMatchObject({
      number: 'INV-2026-0001',
      status: 'DRAFT',
      totals: { total: 'EUR 29.75', totalCents: 2975 },
    });
  });

  test('takes a percentage discount off before tax', async () => {
    const response = await api.post('/invoices').send({ ...mugOrder, discountPercent: 10 }).expect(201);

    expect(response.body.totals).toMatchObject({ discount: 'EUR 2.50', total: 'EUR 26.78' });
  });

  test.each([
    ['an empty customer', { ...mugOrder, customer: '' }, 'customer is required'],
    ['lines that are not a list', { ...mugOrder, lines: 'MUG-01' }, 'lines must be a list'],
    ['no lines', { ...mugOrder, lines: [] }, 'An invoice needs at least one line'],
    ['a zero quantity', { ...mugOrder, lines: [{ ...mugOrder.lines[0], quantity: 0 }] }, 'Quantity must be a whole number of at least 1, got 0'],
    ['a price in fractions of a cent', { ...mugOrder, lines: [{ ...mugOrder.lines[0], unitPriceCents: 12.5 }] }, 'lines[0].unitPriceCents must be a whole number'],
  ])('answers 400 for %s', async (label, body, message) => {
    await api.post('/invoices').send(body).expect(400, { error: message });
  });

  test('answers 400 when the body is not JSON at all', async () => {
    await api
      .post('/invoices')
      .set('Content-Type', 'application/json')
      .send('{"customer": ')
      .expect(400, { error: 'The request body is not valid JSON' });
  });
});

describe('GET /invoices/:number', () => {
  test('returns the invoice as JSON', async () => {
    await repository.save(anInvoice({ number: 'INV-2026-0042' }));

    const response = await api.get('/invoices/INV-2026-0042').expect('Content-Type', /json/).expect(200);

    expect(response.body.number).toBe('INV-2026-0042');
  });

  test('answers 404 for an unknown number', async () => {
    await api.get('/invoices/INV-2026-9999').expect(404, { error: 'Invoice INV-2026-9999 was not found' });
  });
});

describe('issue and pay', () => {
  test('a created invoice can be issued and then paid', async () => {
    await api.post('/invoices').send(mugOrder).expect(201);

    const issued = await api.post('/invoices/INV-2026-0001/issue').expect(200);
    const paid = await api.post('/invoices/INV-2026-0001/pay').expect(200);

    expect(issued.body).toMatchObject({ status: 'ISSUED', dueDate: '2026-12-17' });
    expect(paid.body.status).toBe('PAID');
    expect(payments.charge).toHaveBeenCalledTimes(1);
  });

  test('answers 409 when paying a draft', async () => {
    await api.post('/invoices').send(mugOrder).expect(201);

    await api
      .post('/invoices/INV-2026-0001/pay')
      .expect(409, { error: 'Invoice INV-2026-0001 is DRAFT and cannot be paid' });
  });

  test('answers 500 without details when something unexpected fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    payments.charge.mockRejectedValueOnce(new Error('socket hang up'));
    await repository.save(anInvoice({ status: 'ISSUED' }));

    await api.post('/invoices/INV-2026-0001/pay').expect(500, { error: 'Something went wrong' });
  });
});
