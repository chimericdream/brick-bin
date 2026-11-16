import { describe, expect, it } from 'vitest';

import type { AuditEntry } from '@/server/data/audit';

import { describeEntry } from './activity';

const entry = (over: Partial<AuditEntry>): AuditEntry => ({
  id: '1',
  entityType: 'set',
  entityId: 'x',
  action: 'update',
  changes: {},
  at: new Date(),
  actorName: 'Ada',
  ...over,
});

describe('describeEntry', () => {
  it('names created rows', () => {
    expect(describeEntry(entry({ action: 'create', changes: { name: [null, 'Titanic'] } }))).toBe(
      'added the set Titanic',
    );
  });

  it('reads build state changes in words', () => {
    expect(
      describeEntry(
        entry({ entityType: 'copy', changes: { buildState: ['in_progress', 'built'] } }),
      ),
    ).toBe('changed a copy from In progress to Built');
  });

  it('describes trash, restore and permanent deletes', () => {
    const name = { name: ['Titanic', 'Titanic'] as [unknown, unknown] };
    expect(
      describeEntry(entry({ action: 'delete', changes: { ...name, deletedAt: [null, 'now'] } })),
    ).toBe('moved the set Titanic to the trash');
    expect(
      describeEntry(
        entry({ action: 'update', changes: { ...name, deletedAt: ['trashed', null] } }),
      ),
    ).toBe('restored the set Titanic');
    expect(
      describeEntry(entry({ action: 'delete', changes: { ...name, permanent: [null, true] } })),
    ).toBe('deleted the set Titanic for good');
  });

  it('lists changed fields and trims long lists', () => {
    expect(describeEntry(entry({ changes: { year: [1, 2], notes: ['a', 'b'] } }))).toBe(
      'changed the year, notes of the set',
    );
    expect(
      describeEntry(
        entry({ changes: { year: [1, 2], notes: [1, 2], name: [1, 2], designer: [1, 2] } }),
      ),
    ).toContain('and more');
  });
});
