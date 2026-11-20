// An amount of money: a whole number of cents plus a currency code.
// Cents are integers, so adding 0.10 and 0.20 gives exactly 0.30.
class Money {
  constructor(cents, currency) {
    if (!Number.isSafeInteger(cents)) {
      throw new Error(`Money needs whole cents, got ${cents}`);
    }
    this.cents = cents;
    this.currency = currency;
    Object.freeze(this);
  }

  static of(cents, currency = 'EUR') {
    return new Money(cents, currency);
  }

  plus(other) {
    this.assertSameCurrency(other);
    return new Money(this.cents + other.cents, this.currency);
  }

  minus(other) {
    this.assertSameCurrency(other);
    return new Money(this.cents - other.cents, this.currency);
  }

  times(quantity) {
    return new Money(this.cents * quantity, this.currency);
  }

  format() {
    return `${this.currency} ${(this.cents / 100).toFixed(2)}`;
  }

  assertSameCurrency(other) {
    if (other.currency !== this.currency) {
      throw new Error(`Cannot combine ${this.currency} with ${other.currency}`);
    }
  }
}

module.exports = { Money };
