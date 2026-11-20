import { describe, expect, test } from '@jest/globals';
import { renderInvoiceText } from './invoice-text';
import { toInvoiceView } from './invoice-view';
import { Money } from './money';
import { aLine, anInvoice } from './test-support/invoices';

const issued = anInvoice({
  status: 'ISSUED',
  issueDate: '2026-11-17',
  dueDate: '2026-12-17',
  lines: [aLine(), aLine({ sku: 'PEN-10', description: 'Gel pen pack', unitPrice: Money.of(640), quantity: 1 })],
});

describe('renderInvoiceText', () => {
  test('renders an issued invoice', () => {
    expect(renderInvoiceText(issued)).toMatchSnapshot();
  });

  test('says "not yet" for the dates of a draft', () => {
    const header = renderInvoiceText(anInvoice()).split('\n').slice(0, 4).join('\n');

    expect(header).toMatchInlineSnapshot(`
"INVOICE INV-2026-0001
Customer: Northwind Traders (DE)
Issued: not yet   Due: not yet
Status: DRAFT"
`);
  });

  test('puts the total on the last line', () => {
    const lastLine = renderInvoiceText(issued).split('\n').at(-1);

    expect(lastLine).toBe(`Total${'EUR 37.37'.padStart(55)}`);
  });
});

describe('toInvoiceView', () => {
  test('turns an invoice into plain JSON data', () => {
    expect(toInvoiceView(issued)).toMatchSnapshot();
  });
});
