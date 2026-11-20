/**
 * @jest-environment jsdom
 */
import { describe, expect, jest, test } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { LineItemForm, type NewLine } from './LineItemForm';

function renderForm() {
  const onAdd = jest.fn<(line: NewLine) => void>();
  const user = userEvent.setup();
  render(<LineItemForm onAdd={onAdd} />);
  return { onAdd, user };
}

describe('LineItemForm', () => {
  test('hands a valid line to onAdd, with the price in cents', async () => {
    const { onAdd, user } = renderForm();

    await user.type(screen.getByLabelText('SKU'), 'MUG-01');
    await user.type(screen.getByLabelText('Description'), 'Enamel mug');
    await user.type(screen.getByLabelText('Unit price (EUR)'), '12.50');
    await user.clear(screen.getByLabelText('Quantity'));
    await user.type(screen.getByLabelText('Quantity'), '2');
    await user.click(screen.getByRole('button', { name: 'Add line' }));

    expect(onAdd).toHaveBeenCalledWith({
      sku: 'MUG-01',
      description: 'Enamel mug',
      unitPriceCents: 1250,
      quantity: 2,
    });
  });

  test('clears itself after adding a line', async () => {
    const { user } = renderForm();

    await user.type(screen.getByLabelText('SKU'), 'MUG-01');
    await user.type(screen.getByLabelText('Unit price (EUR)'), '12.50');
    await user.click(screen.getByRole('button', { name: 'Add line' }));

    expect(screen.getByLabelText('SKU')).toHaveValue('');
    expect(screen.getByLabelText('Quantity')).toHaveValue(1);
  });

  test('shows every problem at once and adds nothing', async () => {
    const { onAdd, user } = renderForm();

    await user.type(screen.getByLabelText('Unit price (EUR)'), '12,50');
    await user.click(screen.getByRole('button', { name: 'Add line' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Enter a SKU.');
    expect(screen.getByRole('alert')).toHaveTextContent('Enter a price such as 12.50.');
    expect(onAdd).not.toHaveBeenCalled();
  });

  test('Enter in a field submits the form', async () => {
    const { onAdd, user } = renderForm();

    await user.type(screen.getByLabelText('SKU'), 'PEN-10');
    await user.type(screen.getByLabelText('Unit price (EUR)'), '6.4{Enter}');

    expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({ sku: 'PEN-10', unitPriceCents: 640 }));
  });
});
