const { LineItem } = require('./line-item');
const { Money } = require('./money');
const { TaxCalculator } = require('./tax-calculator');

const taxes = new TaxCalculator();

describe.each([
  ['DE', 19, 1900],
  ['FR', 20, 2000],
  ['NL', 21, 2100],
  ['CH', 8.1, 810],
])('tax in %s', (country, rate, taxOnHundredEuros) => {
  test(`uses the ${rate}% rate`, () => {
    expect(taxes.rateFor(country)).toBe(rate);
  });

  test(`charges ${taxOnHundredEuros} cents on EUR 100.00`, () => {
    expect(taxes.taxOn(Money.of(10000), country)).toEqual(Money.of(taxOnHundredEuros));
  });
});

describe('rounding', () => {
  const threeCheapLines = ['A', 'B', 'C'].map(
    (sku) => new LineItem({ sku, description: sku, unitPrice: Money.of(30), quantity: 1 }),
  );

  test('per invoice rounds once: 19% of 90 cents is 17 cents', () => {
    expect(taxes.taxOn(Money.of(90), 'DE')).toEqual(Money.of(17));
  });

  test('per line rounds three times: 3 x 6 cents is 18 cents', () => {
    expect(taxes.taxPerLine(threeCheapLines, 'DE')).toEqual(Money.of(18));
  });

  test('returns zero tax for an invoice with no lines', () => {
    expect(taxes.taxPerLine([], 'DE')).toEqual(Money.of(0));
  });
});

test('refuses a country it does not know', () => {
  expect(() => taxes.rateFor('XX')).toThrow('No tax rate for country XX');
});
