import { describe, expect, test } from '@jest/globals';
import { InMemoryInvoiceRepository, InvoiceNotFoundError, requireInvoice } from './invoice-repository';
import { describeInvoiceRepositoryContract } from './test-support/invoice-repository-contract';

// The same contract the PostgreSQL repository passes in the integration tests.
describeInvoiceRepositoryContract('InMemoryInvoiceRepository', async () => new InMemoryInvoiceRepository());

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
