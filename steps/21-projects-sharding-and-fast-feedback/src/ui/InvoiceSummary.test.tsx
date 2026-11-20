import { describe, expect, test } from '@jest/globals';
import { render, screen, within } from '@testing-library/react';
import type { Invoice } from '../invoice';
import { toInvoiceView } from '../invoice-view';
import { Money } from '../money';
import { aLine, anInvoice } from '../test-support/invoices';
import { InvoiceSummary } from './InvoiceSummary';

function renderInvoice(overrides: Partial<Invoice> = {}) {
  const invoice = anInvoice({ status: 'ISSUED', issueDate: '2026-11-17', dueDate: '2026-12-17', ...overrides });
  render(<InvoiceSummary invoice={toInvoiceView(invoice)} />);
}

describe('InvoiceSummary', () => {
  test('shows the number, the customer and the status', () => {
    renderInvoice();

    expect(screen.getByRole('heading', { name: 'Invoice INV-2026-0001' })).toBeInTheDocument();
    expect(screen.getByText(/Northwind Traders/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('ISSUED');
    expect(screen.getByText('Due on 2026-12-17')).toBeInTheDocument();
  });

  test('lists one row per line', () => {
    renderInvoice({
      lines: [aLine(), aLine({ sku: 'PEN-10', description: 'Gel pen pack', unitPrice: Money.of(640), quantity: 1 })],
    });

    const rows = within(screen.getByRole('table', { name: 'Lines' })).getAllByRole('row');

    expect(rows).toHaveLength(3);
    expect(rows[2]).toHaveTextContent('PEN-10Gel pen pack1EUR 6.40');
  });

  test('shows the total with tax', () => {
    renderInvoice();

    expect(screen.getByRole('row', { name: /^Tax/ })).toHaveTextContent('EUR 4.75');
    expect(screen.getByRole('row', { name: /^Total/ })).toHaveTextContent('EUR 29.75');
  });

  test('warns when the invoice is overdue', () => {
    renderInvoice({ status: 'OVERDUE' });

    expect(screen.getByRole('alert')).toHaveTextContent('This invoice is overdue.');
  });

  test('a draft shows no due date and no warning', () => {
    renderInvoice({ status: 'DRAFT', issueDate: undefined, dueDate: undefined });

    expect(screen.queryByText(/Due on/)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).toBeNull();
  });
});
