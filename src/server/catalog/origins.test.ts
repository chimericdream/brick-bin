import { describe, expect, it } from 'vitest';

import { isAllowedUrl } from './origins';

const prod = ['https://rebrickable.com', 'https://cdn.rebrickable.com'];

describe('isAllowedUrl', () => {
  it('accepts https on a listed origin only', () => {
    expect(isAllowedUrl(new URL('https://cdn.rebrickable.com/a.zip'), prod)).toBe(true);
    expect(isAllowedUrl(new URL('https://evil.example/a.zip'), prod)).toBe(false);
    expect(isAllowedUrl(new URL('https://cdn.rebrickable.com.evil.example/a'), prod)).toBe(false);
    expect(isAllowedUrl(new URL('https://cdn.rebrickable.com:8443/a'), prod)).toBe(false);
  });

  it('refuses plain http for real hosts, even when listed', () => {
    expect(isAllowedUrl(new URL('http://cdn.rebrickable.com/a'), prod)).toBe(false);
    expect(
      isAllowedUrl(new URL('http://cdn.rebrickable.com/a'), ['http://cdn.rebrickable.com']),
    ).toBe(false);
    expect(isAllowedUrl(new URL('http://192.168.1.5/a'), ['http://192.168.1.5'])).toBe(false);
  });

  it('allows http to a loopback address only when that origin is listed', () => {
    const mock = ['http://127.0.0.1:4010'];
    expect(isAllowedUrl(new URL('http://127.0.0.1:4010/x.zip'), mock)).toBe(true);
    expect(isAllowedUrl(new URL('http://127.0.0.1:4011/x.zip'), mock)).toBe(false);
    expect(isAllowedUrl(new URL('http://127.0.0.1:4010/x.zip'), prod)).toBe(false);
    expect(isAllowedUrl(new URL('http://localhost:4010/x.zip'), ['http://localhost:4010'])).toBe(
      true,
    );
  });
});
