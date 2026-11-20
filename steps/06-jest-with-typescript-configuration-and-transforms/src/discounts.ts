import type { LineItem } from './line-item';
import { Money } from './money';

// A discount policy answers one question: how much comes off these lines?
export interface DiscountPolicy {
  discountFor(lines: readonly LineItem[], subtotal: Money): Money;
}

export class NoDiscount implements DiscountPolicy {
  discountFor(lines: readonly LineItem[], subtotal: Money): Money {
    return Money.of(0, subtotal.currency);
  }
}

export class PercentageDiscount implements DiscountPolicy {
  readonly percent: number;

  constructor(percent: number) {
    if (percent < 0 || percent > 100) {
      throw new Error(`A percentage discount must be between 0 and 100, got ${percent}`);
    }
    this.percent = percent;
  }

  discountFor(lines: readonly LineItem[], subtotal: Money): Money {
    return subtotal.percent(this.percent);
  }
}

export interface DiscountTier {
  from: Money;
  percent: number;
}

// The highest tier the subtotal reaches wins.
export class TieredDiscount implements DiscountPolicy {
  private readonly tiers: readonly DiscountTier[];

  constructor(tiers: readonly DiscountTier[]) {
    this.tiers = [...tiers].sort((a, b) => b.from.cents - a.from.cents);
  }

  discountFor(lines: readonly LineItem[], subtotal: Money): Money {
    const tier = this.tiers.find((t) => subtotal.cents >= t.from.cents);
    return tier ? subtotal.percent(tier.percent) : Money.of(0, subtotal.currency);
  }
}

// Buy n of one SKU, get the next one free: for n = 2, every third unit costs nothing.
export class BuyNGetOneFree implements DiscountPolicy {
  readonly sku: string;
  readonly n: number;

  constructor(sku: string, n: number) {
    this.sku = sku;
    this.n = n;
  }

  discountFor(lines: readonly LineItem[], subtotal: Money): Money {
    return lines
      .filter((line) => line.sku === this.sku)
      .reduce((sum, line) => {
        const freeUnits = Math.floor(line.quantity / (this.n + 1));
        return sum.plus(line.unitPrice.times(freeUnits));
      }, Money.of(0, subtotal.currency));
  }
}
