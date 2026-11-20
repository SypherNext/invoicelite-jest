import { afterAll, beforeAll, expect, jest, test } from '@jest/globals';
import { Pool } from 'pg';
import type { InvoiceStatus } from './invoice';
import { PgInvoiceRepository } from './pg-invoice-repository';
import { describeInvoiceRepositoryContract } from './test-support/invoice-repository-contract';
import { anInvoice } from './test-support/invoices';

// A real database answers in milliseconds, but the first image download can take a while.
jest.setTimeout(30_000);

let pool: Pool;

beforeAll(() => {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
});

afterAll(async () => {
  await pool.end();
});

// Every test starts from an empty table.
async function emptyRepository(): Promise<PgInvoiceRepository> {
  await pool.query('truncate invoices');
  return new PgInvoiceRepository(pool);
}

describeInvoiceRepositoryContract('PgInvoiceRepository', emptyRepository);

test('stores every amount as whole cents', async () => {
  const repository = await emptyRepository();

  await repository.save(anInvoice());

  const { rows } = await pool.query(
    `select totals->>'total' as total, lines->0->>'unitPriceCents' as unit_price, currency from invoices`,
  );
  expect(rows).toEqual([{ total: '2975', unit_price: '1250', currency: 'EUR' }]);
});

test('the database refuses a status the code does not know', async () => {
  const repository = await emptyRepository();

  await expect(repository.save(anInvoice({ status: 'LOST' as InvoiceStatus }))).rejects.toThrow(
    'violates check constraint "invoices_status_check"',
  );
});
