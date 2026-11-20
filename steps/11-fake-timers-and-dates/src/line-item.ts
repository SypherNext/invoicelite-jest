import { Money } from './money';

export interface LineItemInput {
  sku: string;
  description: string;
  unitPrice: Money;
  quantity: number;
}

// One line of an invoice: what was sold, at what price, and how many.
export class LineItem {
  readonly sku: string;
  readonly description: string;
  readonly unitPrice: Money;
  readonly quantity: number;

  constructor({ sku, description, unitPrice, quantity }: LineItemInput) {
    if (!sku) {
      throw new Error('A line item needs a SKU');
    }
    if (!Number.isInteger(quantity) || quantity < 1) {
      throw new Error(`Quantity must be a whole number of at least 1, got ${quantity}`);
    }
    this.sku = sku;
    this.description = description;
    this.unitPrice = unitPrice;
    this.quantity = quantity;
    Object.freeze(this);
  }

  total(): Money {
    return this.unitPrice.times(this.quantity);
  }
}
