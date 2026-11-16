import { describe, expect, it } from 'vitest';

import { centsToInput, formatMoney, parseMoney } from './money';

describe('money', () => {
  it('formats cents as USD', () => {
    expect(formatMoney(14999)).toBe('$149.99');
    expect(formatMoney(0)).toBe('$0.00');
    expect(formatMoney(123456789)).toBe('$1,234,567.89');
    expect(formatMoney(null)).toBe('');
  });

  it('parses typed amounts into cents without floating-point drift', () => {
    expect(parseMoney('149.99')).toBe(14999);
    expect(parseMoney('$1,249')).toBe(124900);
    expect(parseMoney(' 12.5 ')).toBe(1250);
    expect(parseMoney('0.07')).toBe(7);
    expect(parseMoney('19.99')).toBe(1999);
  });

  it('treats blank as null and junk as undefined', () => {
    expect(parseMoney('')).toBeNull();
    expect(parseMoney(null)).toBeNull();
    expect(parseMoney('abc')).toBeUndefined();
    expect(parseMoney('-5')).toBeUndefined();
    expect(parseMoney('1.999')).toBeUndefined();
  });

  it('round-trips through the form field format', () => {
    expect(centsToInput(14999)).toBe('149.99');
    expect(parseMoney(centsToInput(14999))).toBe(14999);
    expect(centsToInput(null)).toBe('');
  });
});
