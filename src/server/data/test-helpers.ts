import { createUser, setupHousehold } from '../auth/accounts';
import type { Db } from '../db/client';
import { brands, households, users } from '../db/schema';
import { createTestDb } from '../db/test-db';
import { createContext, type DataContext } from './context';

export interface TestWorld {
  db: Db;
  admin: DataContext;
  member: DataContext;
  kid: DataContext;
  /** An admin of a second household, for isolation tests. */
  other: DataContext;
  legoId: string;
}

/** An in-memory database with one household (admin, member, kid) and a second household. */
export async function createWorld(): Promise<TestWorld> {
  const db = await createTestDb();
  const a = await setupHousehold(db, {
    householdName: 'Home',
    name: 'Ada',
    email: 'ada@example.com',
    password: 'hunter2hunter2',
  });
  const mk = async (name: string, role: 'member' | 'restricted') => {
    const u = await createUser(
      db,
      a.householdId,
      { name, email: `${name.toLowerCase()}@example.com`, password: 'hunter2hunter2', role },
      a.id,
    );
    return createContext(db, a.householdId, { kind: 'user', userId: u.id, role });
  };
  const [h2] = await db.insert(households).values({ name: 'Other' }).returning();
  const [u2] = await db
    .insert(users)
    .values({
      householdId: h2!.id,
      name: 'Oz',
      email: 'oz@example.com',
      passwordHash: 'x',
      role: 'admin',
    })
    .returning();
  const [lego] = await db.select().from(brands);
  return {
    db,
    admin: createContext(db, a.householdId, { kind: 'user', userId: a.id, role: 'admin' }),
    member: await mk('Mia', 'member'),
    kid: await mk('Kit', 'restricted'),
    other: createContext(db, h2!.id, { kind: 'user', userId: u2!.id, role: 'admin' }),
    legoId: lego!.id,
  };
}
