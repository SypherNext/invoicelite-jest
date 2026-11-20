import { type ChangeEvent, type FormEvent, useState } from 'react';
import { parsePriceToCents } from './parse-price';

export interface NewLine {
  sku: string;
  description: string;
  unitPriceCents: number;
  quantity: number;
}

const EMPTY = { sku: '', description: '', price: '', quantity: '1' };

// A form for one invoice line. It checks the fields, and on success hands the
// line to onAdd and clears itself for the next one.
export function LineItemForm({ onAdd }: { onAdd: (line: NewLine) => void }) {
  const [fields, setFields] = useState(EMPTY);
  const [errors, setErrors] = useState<string[]>([]);

  const field = (name: keyof typeof EMPTY) => ({
    value: fields[name],
    onChange: (event: ChangeEvent<HTMLInputElement>) => setFields({ ...fields, [name]: event.target.value }),
  });

  function submit(event: FormEvent) {
    event.preventDefault();
    const unitPriceCents = parsePriceToCents(fields.price);
    const quantity = Number(fields.quantity);
    const problems = [
      fields.sku.trim() === '' && 'Enter a SKU.',
      unitPriceCents === undefined && 'Enter a price such as 12.50.',
      !(Number.isInteger(quantity) && quantity >= 1) && 'Quantity must be a whole number of at least 1.',
    ].filter((problem): problem is string => typeof problem === 'string');
    setErrors(problems);
    if (problems.length === 0 && unitPriceCents !== undefined) {
      onAdd({ sku: fields.sku.trim(), description: fields.description.trim(), unitPriceCents, quantity });
      setFields(EMPTY);
    }
  }

  return (
    <form aria-label="Add a line" onSubmit={submit} noValidate>
      <label>
        SKU <input {...field('sku')} />
      </label>
      <label>
        Description <input {...field('description')} />
      </label>
      <label>
        Unit price (EUR) <input inputMode="decimal" {...field('price')} />
      </label>
      <label>
        Quantity <input type="number" min={1} {...field('quantity')} />
      </label>
      <button type="submit">Add line</button>
      {errors.length > 0 && (
        <ul role="alert">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </form>
  );
}
