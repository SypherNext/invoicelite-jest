import { jest } from '@jest/globals';
import type { Notifier } from '../notifier';
import type { PaymentGateway } from '../payment-gateway';

// Mock versions of the service's collaborators. Every function is a jest.fn(),
// so a test can check how it was called and decide what it returns.

export function mockNotifier() {
  return {
    invoiceIssued: jest.fn<Notifier['invoiceIssued']>().mockResolvedValue(undefined),
    paymentReceived: jest.fn<Notifier['paymentReceived']>().mockResolvedValue(undefined),
    invoiceOverdue: jest.fn<Notifier['invoiceOverdue']>().mockResolvedValue(undefined),
  } satisfies Notifier;
}

export function mockPaymentGateway() {
  return {
    charge: jest.fn<PaymentGateway['charge']>().mockResolvedValue({ chargeId: 'ch_test_1' }),
  } satisfies PaymentGateway;
}
