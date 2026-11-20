import { type DiscountPolicy, PercentageDiscount } from '../discounts';
import { ValidationError } from '../errors';
import type { NewInvoice } from '../invoice-service';
import { LineItem } from '../line-item';
import { Money } from '../money';

// Turns an untrusted JSON body into a NewInvoice, or throws ValidationError.
// Expected shape:
// { "customer": "...", "country": "DE", "discountPercent": 10,
//   "lines": [{ "sku": "...", "description": "...", "unitPriceCents": 1250, "quantity": 2 }] }
export function parseNewInvoice(body: unknown): NewInvoice {
  const input = asObject(body, 'The request body');
  const lines = input.lines;
  if (!Array.isArray(lines)) {
    throw new ValidationError('lines must be a list');
  }
  return {
    customer: requiredText(input.customer, 'customer'),
    country: requiredText(input.country, 'country'),
    lines: lines.map(parseLine),
    discount: parseDiscount(input.discountPercent),
  };
}

// Turns { "amountCents": 1000 } into Money, or throws ValidationError.
export function parsePayment(body: unknown): Money {
  const { amountCents } = asObject(body, 'The request body');
  if (!Number.isInteger(amountCents)) {
    throw new ValidationError('amountCents must be a whole number');
  }
  return Money.of(amountCents as number);
}

function parseLine(value: unknown, index: number): LineItem {
  const line = asObject(value, `lines[${index}]`);
  const unitPriceCents = line.unitPriceCents;
  if (!Number.isInteger(unitPriceCents)) {
    throw new ValidationError(`lines[${index}].unitPriceCents must be a whole number`);
  }
  return new LineItem({
    sku: requiredText(line.sku, `lines[${index}].sku`),
    description: requiredText(line.description, `lines[${index}].description`),
    unitPrice: Money.of(unitPriceCents as number),
    quantity: line.quantity as number,
  });
}

function parseDiscount(value: unknown): DiscountPolicy | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (typeof value !== 'number') {
    throw new ValidationError('discountPercent must be a number');
  }
  return new PercentageDiscount(value);
}

function asObject(value: unknown, name: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ValidationError(`${name} must be a JSON object`);
  }
  return value as Record<string, unknown>;
}

function requiredText(value: unknown, name: string): string {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ValidationError(`${name} is required`);
  }
  return value;
}
