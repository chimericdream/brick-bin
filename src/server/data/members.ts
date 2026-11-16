import { asc, eq, sql } from 'drizzle-orm';

import { users } from '../db/schema';
import type { DataContext } from './context';

/** The household's accounts, for owner pickers. Names and roles only: never emails or hashes. */
export async function listMembers(ctx: DataContext) {
  return ctx.db
    .select({ id: users.id, name: users.name, role: users.role })
    .from(users)
    .where(eq(users.householdId, ctx.householdId))
    .orderBy(asc(sql`lower(${users.name})`));
}
