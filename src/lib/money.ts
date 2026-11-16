/**
 * Every amount in the app goes through these two functions. USD only in v1; making the currency
 * configurable later is a change to this module alone (docs/PLAN.md section 6.6).
 */
const CURRENCY = 'USD';
const LOCALE = 'en-US';

const formatter = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });

/** `14999` becomes `$149.99`. Null or undefined becomes an empty string. */
export function formatMoney(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '';
  return formatter.format(cents / 100);
}

/**
 * Parses what a person types ("149.99", "$1,249", " 12 ") into integer cents. Returns null for
 * blank input and NaN-free `undefined` for anything that is not a plain non-negative amount.
 */
export function parseMoney(input: string | null | undefined): number | null | undefined {
  const raw = (input ?? '').trim().replace(/^\$/, '').replaceAll(',', '').trim();
  if (raw === '') return null;
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return undefined;
  const [whole, frac = ''] = raw.split('.');
  return Number(whole) * 100 + Number(frac.padEnd(2, '0'));
}

/** Cents as the plain number a form field shows: `14999` becomes `149.99`. */
export function centsToInput(cents: number | null | undefined): string {
  if (cents === null || cents === undefined) return '';
  return (cents / 100).toFixed(2);
}
