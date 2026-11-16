import { describe, expect, it } from 'vitest';

import { DEFAULT_RETENTION_DAYS, purgeDate, retentionDays } from './trash';

describe('trash retention', () => {
  it('defaults to 30 days and accepts a whole number', () => {
    expect(retentionDays({})).toBe(DEFAULT_RETENTION_DAYS);
    expect(retentionDays({ TRASH_RETENTION_DAYS: '7' })).toBe(7);
  });

  it('falls back to the default for junk and keeps 0 as "never purge"', () => {
    expect(retentionDays({ TRASH_RETENTION_DAYS: 'abc' })).toBe(DEFAULT_RETENTION_DAYS);
    expect(retentionDays({ TRASH_RETENTION_DAYS: '-2' })).toBe(DEFAULT_RETENTION_DAYS);
    expect(retentionDays({ TRASH_RETENTION_DAYS: '0' })).toBe(0);
  });

  it('computes the purge date, or null when purging is off', () => {
    const at = new Date('2026-01-01T00:00:00Z');
    expect(purgeDate(at, 30)?.toISOString()).toBe('2026-01-31T00:00:00.000Z');
    expect(purgeDate(at, 0)).toBeNull();
  });
});
