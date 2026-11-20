// Turns what a person types as a price ("12.50", "7", "0.5") into whole cents,
// without going through a float. Returns undefined for anything else.
export function parsePriceToCents(text: string): number | undefined {
  const match = /^(\d+)(?:\.(\d{1,2}))?$/.exec(text.trim());
  if (!match) {
    return undefined;
  }
  const [, euros, cents = ''] = match;
  return Number(euros) * 100 + Number(cents.padEnd(2, '0'));
}
