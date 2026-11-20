import { describe, expect, test } from '@jest/globals';
import { amountPaid, balanceDue } from './balance';
import { Money } from './money';
import { anInvoice } from './test-support/invoices';

const payment = (cents: number, chargeId: string) => ({ amount: Money.of(cents), chargeId, paidOn: '2026-11-20' });

describe('balance', () => {
  test('an invoice without payments owes its total', () => {
    const invoice = anInvoice();

    expect(amountPaid(invoice)).toBeMoney('EUR 0.00');
    expect(balanceDue(invoice)).toBeMoney('EUR 29.75');
  });

  test('every payment comes off the balance', () => {
    const invoice = anInvoice({ payments: [payment(1000, 'ch_1'), payment(975, 'ch_2')] });

    expect(amountPaid(invoice)).toBeMoney('EUR 19.75');
    expect(balanceDue(invoice)).toBeMoney('EUR 10.00');
  });

  test('a fully paid invoice owes nothing', () => {
    const invoice = anInvoice({ payments: [payment(2975, 'ch_1')] });

    expect(balanceDue(invoice)).toBeMoney('EUR 0.00');
  });
});
