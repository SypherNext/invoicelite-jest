// One line of an invoice: what was sold, at what price, and how many.
class LineItem {
  constructor({ sku, description, unitPrice, quantity }) {
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

  total() {
    return this.unitPrice.times(this.quantity);
  }
}

module.exports = { LineItem };
