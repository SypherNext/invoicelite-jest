import { beforeEach, describe, expect, test } from '@jest/globals';
import type { InvoiceRepository } from '../invoice-repository';
import { Money } from '../money';
import { aLine, anInvoice } from './invoices';

// The behaviour every InvoiceRepository must have, written once. The in-memory
// repository runs it in the unit tests, the PostgreSQL one in the integration tests.
// `fresh` returns an empty repository for each test.
export function describeInvoiceRepositoryContract(name: string, fresh: () => Promise<InvoiceRepository>) {
  describe(`${name} (InvoiceRepository contract)`, () => {
    let repository: InvoiceRepository;

    beforeEach(async () => {
      repository = await fresh();
    });

    test('finds a saved invoice by its number', async () => {
      const invoice = anInvoice({ number: 'INV-2026-0001' });

      await repository.save(invoice);

      await expect(repository.findByNumber('INV-2026-0001')).resolves.toEqual(invoice);
    });

    test('finds nothing for a number it never saw', async () => {
      await expect(repository.findByNumber('INV-2026-9999')).resolves.toBeUndefined();
    });

    test('saving the same number again replaces the invoice', async () => {
      await repository.save(anInvoice({ status: 'DRAFT' }));
      await repository.save(anInvoice({ status: 'ISSUED', issueDate: '2026-11-17', dueDate: '2026-12-17' }));

      const found = await repository.findByNumber('INV-2026-0001');

      expect(found).toMatchObject({ status: 'ISSUED', issueDate: '2026-11-17', dueDate: '2026-12-17' });
    });

    test('finds invoices by status', async () => {
      await repository.save(anInvoice({ number: 'INV-2026-0001', status: 'ISSUED' }));
      await repository.save(anInvoice({ number: 'INV-2026-0002', status: 'PAID' }));
      await repository.save(anInvoice({ number: 'INV-2026-0003', status: 'ISSUED' }));

      const issued = await repository.findByStatus('ISSUED');

      expect(issued.map((invoice) => invoice.number)).toEqual(['INV-2026-0001', 'INV-2026-0003']);
    });

    test('gives back lines that still calculate', async () => {
      const lines = [aLine(), aLine({ sku: 'PEN-10', description: 'Gel pen pack', unitPrice: Money.of(640), quantity: 3 })];
      await repository.save(anInvoice({ lines, paymentReference: 'ch_3PqX7' }));

      const found = await repository.findByNumber('INV-2026-0001');

      expect(found?.lines[1].total()).toBeMoney('EUR 19.20');
      expect(found?.totals.total).toBeMoney('EUR 52.60');
      expect(found?.paymentReference).toBe('ch_3PqX7');
    });
  });
}
