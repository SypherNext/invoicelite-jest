const { Money } = require('./money');

// A discount policy answers one question: how much comes off these lines?
// Each policy has a discountFor(lines, subtotal) method that returns Money.

class NoDiscount {
  discountFor(lines, subtotal) {
    return Money.of(0, subtotal.currency);
  }
}

class PercentageDiscount {
  constructor(percent) {
    if (percent < 0 || percent > 100) {
      throw new Error(`A percentage discount must be between 0 and 100, got ${percent}`);
    }
    this.percent = percent;
  }

  discountFor(lines, subtotal) {
    return subtotal.percent(this.percent);
  }
}

// tiers: [{ from: Money.of(10000), percent: 5 }, ...]; the highest tier reached wins.
class TieredDiscount {
  constructor(tiers) {
    this.tiers = [...tiers].sort((a, b) => b.from.cents - a.from.cents);
  }

  discountFor(lines, subtotal) {
    const tier = this.tiers.find((t) => subtotal.cents >= t.from.cents);
    return tier ? subtotal.percent(tier.percent) : Money.of(0, subtotal.currency);
  }
}

// Buy n of one SKU, get the next one free: for n = 2, every third unit costs nothing.
class BuyNGetOneFree {
  constructor(sku, n) {
    this.sku = sku;
    this.n = n;
  }

  discountFor(lines, subtotal) {
    return lines
      .filter((line) => line.sku === this.sku)
      .reduce((sum, line) => {
        const freeUnits = Math.floor(line.quantity / (this.n + 1));
        return sum.plus(line.unitPrice.times(freeUnits));
      }, Money.of(0, subtotal.currency));
  }
}

module.exports = { NoDiscount, PercentageDiscount, TieredDiscount, BuyNGetOneFree };
