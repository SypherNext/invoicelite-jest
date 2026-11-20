import { beforeEach, describe, expect, test } from '@jest/globals';
import { InMemoryInvoiceRepository, InvoiceNotFoundError, requireInvoice } from './invoice-repository';
import { anInvoice } from './test-support/invoices';

describe('InMemoryInvoiceRepository', () => {
  let repository: InMemoryInvoiceRepository;

  beforeEach(() => {
    repository = new InMemoryInvoiceRepository();
  });

  test('finds a saved invoice by its number', async () => {
    const invoice = anInvoice({ number: 'INV-2026-0001' });

    await repository.save(invoice);
    const found = await repository.findByNumber('INV-2026-0001');

    expect(found).toEqual(invoice);
  });

  test('finds nothing for a number it never saw', async () => {
    await expect(repository.findByNumber('INV-2026-9999')).resolves.toBeUndefined();
  });

  test('saving the same number again replaces the invoice', async () => {
    await repository.save(anInvoice({ status: 'DRAFT' }));
    await repository.save(anInvoice({ status: 'ISSUED' }));

    const found = await repository.findByNumber('INV-2026-0001');

    expect(found?.status).toBe('ISSUED');
  });

  test('finds invoices by status', async () => {
    await repository.save(anInvoice({ number: 'INV-2026-0001', status: 'ISSUED' }));
    await repository.save(anInvoice({ number: 'INV-2026-0002', status: 'PAID' }));
    await repository.save(anInvoice({ number: 'INV-2026-0003', status: 'ISSUED' }));

    const issued = await repository.findByStatus('ISSUED');

    expect(issued.map((invoice) => invoice.number)).toEqual(['INV-2026-0001', 'INV-2026-0003']);
  });

  test('returning the promise works as well as awaiting it', () => {
    return repository.save(anInvoice()).then(() => {
      return expect(repository.findByStatus('DRAFT')).resolves.toHaveLength(1);
    });
  });
});

describe('requireInvoice', () => {
  const repository = new InMemoryInvoiceRepository();

  test('rejects with InvoiceNotFoundError for an unknown number', async () => {
    await expect(requireInvoice(repository, 'INV-2026-9999')).rejects.toThrow(InvoiceNotFoundError);
  });

  test('says which invoice is missing', async () => {
    await expect(requireInvoice(repository, 'INV-2026-9999')).rejects.toThrow(
      'Invoice INV-2026-9999 was not found',
    );
  });

  test('the error carries the number', async () => {
    expect.assertions(2);
    try {
      await requireInvoice(repository, 'INV-2026-9999');
    } catch (error) {
      expect(error).toBeInstanceOf(InvoiceNotFoundError);
      expect((error as InvoiceNotFoundError).number).toBe('INV-2026-9999');
    }
  });
});
