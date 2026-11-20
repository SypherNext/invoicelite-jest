import { describe, expect, test } from '@jest/globals';
import fc from 'fast-check';
import { balanceDue } from './balance';
import { Money } from './money';
import { anInvoice } from './test-support/invoices';
import { serviceWithFakes } from './test-support/service';

const TOTAL = 2975; // the default invoice: two mugs and German VAT

// Up to five cut points between 1 and TOTAL - 1 split the total into payments.
const split = fc
  .uniqueArray(fc.integer({ min: 1, max: TOTAL - 1 }), { maxLength: 5 })
  .map((cuts) => {
    const points = [...cuts].sort((a, b) => a - b).concat(TOTAL);
    return points.map((point, i) => point - (i === 0 ? 0 : points[i - 1]));
  });

describe('payment properties', () => {
  test('paying the total in any number of parts ends paid, with nothing due', async () => {
    await fc.assert(
      fc.asyncProperty(split, async (parts) => {
        const { service, repository } = serviceWithFakes();
        await repository.save(anInvoice({ status: 'ISSUED' }));

        for (const part of parts) {
          await service.recordPayment('INV-2026-0001', Money.of(part));
        }

        const invoice = await service.get('INV-2026-0001');
        expect(invoice.status).toBe('PAID');
        expect(invoice.payments).toHaveLength(parts.length);
        expect(balanceDue(invoice)).toBeMoney('EUR 0.00');
      }),
    );
  });

  test('no sequence of payments can take more than the total', async () => {
    await fc.assert(
      fc.asyncProperty(fc.array(fc.integer({ min: 1, max: 4000 }), { minLength: 1, maxLength: 6 }), async (amounts) => {
        const { service, repository, payments } = serviceWithFakes();
        await repository.save(anInvoice({ status: 'ISSUED' }));

        for (const cents of amounts) {
          await service.recordPayment('INV-2026-0001', Money.of(cents)).catch(() => undefined);
        }

        const charged = payments.charge.mock.calls.reduce((sum, [request]) => sum + request.amount.cents, 0);
        expect(charged).toBeLessThanOrEqual(TOTAL);
      }),
    );
  });
});
