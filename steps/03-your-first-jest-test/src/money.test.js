const { Money } = require('./money');

test('adds two amounts', () => {
  const total = Money.of(1250).plus(Money.of(640));

  expect(total.cents).toBe(1890);
});

test('multiplies an amount by a quantity', () => {
  const total = Money.of(1250).times(3);

  expect(total.cents).toBe(3750);
});

test('formats cents as a decimal amount with the currency', () => {
  expect(Money.of(1890).format()).toBe('EUR 18.90');
});
