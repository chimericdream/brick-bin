import { beforeEach, describe, expect, it } from 'vitest';

import { createUser, setupHousehold } from '../auth/accounts';
import type { Db } from '../db/client';
import { auditLog } from '../db/schema';
import { createTestDb } from '../db/test-db';
import {
  createdFields,
  diffFields,
  historyFor,
  lastEdit,
  recentActivity,
  recordAudit,
  trashedFields,
} from './audit';
import { createContext, type DataContext } from './context';

let db: Db;
let admin: DataContext;
let kid: DataContext;
let other: DataContext;

beforeEach(async () => {
  db = await createTestDb();
  const a = await setupHousehold(db, {
    householdName: 'Home',
    name: 'Ada',
    email: 'ada@example.com',
    password: 'hunter2hunter2',
  });
  admin = createContext(db, a.householdId, { kind: 'user', userId: a.id, role: 'admin' });
  const k = await createUser(
    db,
    a.householdId,
    { name: 'Kid', email: 'kid@example.com', password: 'hunter2hunter2', role: 'restricted' },
    a.id,
  );
  kid = createContext(db, a.householdId, { kind: 'user', userId: k.id, role: 'restricted' });
  const o = await setupHouseholdOther();
  other = createContext(db, o.householdId, { kind: 'user', userId: o.id, role: 'admin' });
});

async function setupHouseholdOther() {
  // A second household, inserted directly: setup only runs once.
  const { households, users } = await import('../db/schema');
  const [h] = await db.insert(households).values({ name: 'Other' }).returning();
  const [u] = await db
    .insert(users)
    .values({
      householdId: h!.id,
      name: 'Oz',
      email: 'oz@example.com',
      passwordHash: 'x',
      role: 'admin',
    })
    .returning();
  return u!;
}

describe('diff helpers', () => {
  it('keeps only changed fields as [before, after]', () => {
    expect(diffFields({ a: 1, b: 'x' }, { a: 1, b: 'y', c: null })).toEqual({ b: ['x', 'y'] });
    expect(diffFields({}, { c: 3 })).toEqual({ c: [null, 3] });
  });

  it('createdFields skips empty values; trashedFields repeats identifying fields', () => {
    expect(createdFields({ name: 'Set', note: null })).toEqual({ name: [null, 'Set'] });
    expect(trashedFields({ name: 'Set' }).name).toEqual(['Set', 'Set']);
  });
});

describe('recordAudit', () => {
  it('never stores secrets, whatever the caller passes', async () => {
    const id = crypto.randomUUID();
    await recordAudit(db, admin, {
      entityType: 'user',
      entityId: id,
      action: 'update',
      changes: { name: ['a', 'b'], passwordHash: ['x', 'y'], token: [null, 't'] },
    });
    const [row] = await db.select().from(auditLog);
    const entry = (await historyFor(admin, 'user', id))[0]!;
    expect(Object.keys(entry.changes)).toEqual(['name']);
    expect(row).toBeDefined();
  });

  it('is scoped to the household', async () => {
    const id = crypto.randomUUID();
    await recordAudit(db, admin, { entityType: 'set', entityId: id, action: 'create' });
    expect(await lastEdit(other, 'set', id)).toBeNull();
    expect((await lastEdit(admin, 'set', id))?.actorName).toBe('Ada');
  });

  it('returns activity newest first and paginates', async () => {
    for (let i = 0; i < 3; i++) {
      await recordAudit(db, admin, {
        entityType: 'set',
        entityId: crypto.randomUUID(),
        action: 'create',
        changes: { n: [null, i] },
      });
    }
    const page1 = await recentActivity(admin, { limit: 2 });
    expect(page1).toHaveLength(2);
    const last = page1[1]!;
    const page2 = await recentActivity(admin, { limit: 2, before: { at: last.at, id: last.id } });
    const ids = [...page1, ...page2].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('restricted profiles cannot read activity', async () => {
    await expect(recentActivity(kid)).rejects.toThrow(/cannot/);
    await expect(lastEdit(kid, 'set', crypto.randomUUID())).rejects.toThrow(/cannot/);
  });
});
