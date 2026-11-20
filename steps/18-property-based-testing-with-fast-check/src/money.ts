// An amount of money: a whole number of cents plus a currency code.
// Cents are integers, so adding 0.10 and 0.20 gives exactly 0.30.
export class Money {
  readonly cents: number;
  readonly currency: string;

  private constructor(cents: number, currency: string) {
    if (!Number.isSafeInteger(cents)) {
      throw new Error(`Money needs whole cents, got ${cents}`);
    }
    this.cents = cents;
    this.currency = currency;
    Object.freeze(this);
  }

  static of(cents: number, currency = 'EUR'): Money {
    return new Money(cents, currency);
  }

  plus(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents + other.cents, this.currency);
  }

  minus(other: Money): Money {
    this.assertSameCurrency(other);
    return new Money(this.cents - other.cents, this.currency);
  }

  times(quantity: number): Money {
    return new Money(this.cents * quantity, this.currency);
  }

  // A percentage of this amount, rounded to whole cents with banker's rounding:
  // an exact half goes to the even cent (28.5 becomes 28, 47.5 becomes 48).
  // BigInt keeps cents x basis points exact even for very large amounts.
  percent(rate: number): Money {
    const basisPoints = BigInt(Math.round(rate * 100));
    return new Money(Number(divideHalfEven(BigInt(this.cents) * basisPoints, 10000n)), this.currency);
  }

  format(): string {
    return `${this.currency} ${(this.cents / 100).toFixed(2)}`;
  }

  private assertSameCurrency(other: Money): void {
    if (other.currency !== this.currency) {
      throw new Error(`Cannot combine ${this.currency} with ${other.currency}`);
    }
  }
}

function divideHalfEven(numerator: bigint, denominator: bigint): bigint {
  let quotient = numerator / denominator;
  let remainder = numerator % denominator;
  if (remainder < 0n) {
    quotient -= 1n;
    remainder += denominator;
  }
  const twiceRemainder = remainder * 2n;
  if (twiceRemainder > denominator || (twiceRemainder === denominator && quotient % 2n !== 0n)) {
    return quotient + 1n;
  }
  return quotient;
}
