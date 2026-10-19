/**
 * Price formatting. The Arabic UI uses Western numerals (project rule), so we
 * format with a Latin-digit locale and append the currency label.
 */
const priceFmt = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export function formatPrice(value: number, currency: string): string {
  return `${priceFmt.format(value)} ${currency}`;
}
