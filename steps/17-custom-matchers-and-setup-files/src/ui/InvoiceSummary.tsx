import type { InvoiceView } from '../invoice-view';

// Shows one invoice: who, its state, the lines and the totals.
export function InvoiceSummary({ invoice }: { invoice: InvoiceView }) {
  const { totals } = invoice;
  return (
    <section aria-labelledby="invoice-title">
      <h2 id="invoice-title">Invoice {invoice.number}</h2>
      <p>
        {invoice.customer} <span role="status">{invoice.status}</span>
      </p>
      {invoice.dueDate && <p>Due on {invoice.dueDate}</p>}
      {invoice.status === 'OVERDUE' && <p role="alert">This invoice is overdue.</p>}
      <table aria-label="Lines">
        <thead>
          <tr>
            <th scope="col">SKU</th>
            <th scope="col">Description</th>
            <th scope="col">Qty</th>
            <th scope="col">Total</th>
          </tr>
        </thead>
        <tbody>
          {invoice.lines.map((line) => (
            <tr key={line.sku}>
              <td>{line.sku}</td>
              <td>{line.description}</td>
              <td>{line.quantity}</td>
              <td>{line.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <table aria-label="Totals">
        <tbody>
          <AmountRow label="Subtotal" amount={totals.subtotal} />
          <AmountRow label="Discount" amount={totals.discount} />
          <AmountRow label="Tax" amount={totals.tax} />
          <AmountRow label="Total" amount={totals.total} />
        </tbody>
      </table>
    </section>
  );
}

function AmountRow({ label, amount }: { label: string; amount: string }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{amount}</td>
    </tr>
  );
}
