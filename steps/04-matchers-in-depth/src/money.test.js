const { Money } = require('./money');

test('adds two amounts', () => {
  const total = Money.of(1250).plus(Money.of(640));

  expect(total.cents).toBe(1890);
});

test('subtracts one amount from another', () => {
  expect(Money.of(1250).minus(Money.of(250))).toEqual(Money.of(1000));
});

test('multiplies an amount by a quantity', () => {
  const total = Money.of(1250).times(3);

  expect(total.cents).toBe(3750);
});

test('formats cents as a decimal amount with the currency', () => {
  expect(Money.of(1890).format()).toBe('EUR 18.90');
});

test('two equal amounts are equal values but different objects', () => {
  const a = Money.of(500);
  const b = Money.of(500);

  expect(a).toEqual(b);
  expect(a).not.toBe(b);
});

test('toStrictEqual also checks the type', () => {
  const plain = { cents: 500, currency: 'EUR' };

  expect(Money.of(500)).toEqual(plain);
  expect(Money.of(500)).not.toStrictEqual(plain);
});

test('refuses to combine different currencies', () => {
  const euros = Money.of(100, 'EUR');
  const dollars = Money.of(100, 'USD');

  expect(() => euros.plus(dollars)).toThrow('Cannot combine EUR with USD');
  expect(() => euros.minus(dollars)).toThrow(/EUR with USD/);
});

test('refuses fractions of a cent', () => {
  expect(() => Money.of(12.5)).toThrow('Money needs whole cents, got 12.5');
});

test('floats drift, cents do not', () => {
  expect(0.1 + 0.2).not.toBe(0.3);
  expect(0.1 + 0.2).toBeCloseTo(0.3);
  expect(Money.of(10).plus(Money.of(20)).cents).toBe(30);
});
