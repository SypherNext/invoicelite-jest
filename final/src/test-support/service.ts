import { type Clock, fixedClock } from '../clock';
import { InMemoryInvoiceRepository } from '../invoice-repository';
import { InvoiceNumberGenerator } from '../invoice-number-generator';
import { InvoiceService } from '../invoice-service';
import { mockNotifier, mockPaymentGateway } from './doubles';

// An InvoiceService wired to an in-memory repository, a fixed clock and mocks,
// with every collaborator returned so a test can look at it.
export function serviceWithFakes(clock: Clock = fixedClock('2026-11-17T09:00:00Z')) {
  const repository = new InMemoryInvoiceRepository();
  const payments = mockPaymentGateway();
  const notifier = mockNotifier();
  const service = new InvoiceService({
    repository,
    numbers: new InvoiceNumberGenerator(clock),
    clock,
    payments,
    notifier,
  });
  return { service, repository, payments, notifier };
}
