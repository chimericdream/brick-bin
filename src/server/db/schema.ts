import { sql } from 'drizzle-orm';
import { index, jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Every household table carries `householdId`. See AGENTS.md: all reads and writes go through
 * the data-access layer in `src/server/data/`, which requires a household context. The only
 * exception is the global `rb_*` reference catalog (docs/PLAN.md section 2).
 */

export const userRole = pgEnum('user_role', ['admin', 'member', 'restricted']);

export const households = pgTable('households', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    email: text('email').notNull().unique(),
    passwordHash: text('password_hash').notNull(),
    /** `restricted` is the kid profile: read-only, except for its own wishlist. */
    role: userRole('role').notNull().default('member'),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('users_household_idx').on(t.householdId)],
);

export const sessions = pgTable(
  'sessions',
  {
    /** SHA-256 hash of the cookie token; the raw token is never stored. */
    id: text('id').primaryKey(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index('sessions_user_idx').on(t.userId)],
);

/** Who created or last changed a row. Nullable so deleting a user never deletes history. */
export const authorship = () => ({
  createdByUserId: uuid('created_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  updatedByUserId: uuid('updated_by_user_id').references(() => users.id, { onDelete: 'set null' }),
});

/**
 * Soft delete. A row with `deletedAt` set is in the trash: hidden everywhere, but kept so it can be
 * restored until it is permanently deleted (by an admin, or automatically after the retention period).
 */
export const trashable = () => ({
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
  deletedByUserId: uuid('deleted_by_user_id').references(() => users.id, { onDelete: 'set null' }),
});

export const stamps = () => ({
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditAction = pgEnum('audit_action', ['create', 'update', 'delete']);

/**
 * One row per change, written in the same transaction as the change. `changes` maps a field
 * name to `[before, after]`; it never contains secrets such as password hashes.
 */
export const auditLog = pgTable(
  'audit_log',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    actorUserId: uuid('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    entityType: text('entity_type').notNull(),
    entityId: uuid('entity_id').notNull(),
    action: auditAction('action').notNull(),
    changes: jsonb('changes').$type<Record<string, [unknown, unknown]>>().notNull().default({}),
    // clock_timestamp(), not now(): entries in one transaction still get distinct, ordered times.
    at: timestamp('at', { withTimezone: true })
      .notNull()
      .default(sql`clock_timestamp()`),
  },
  (t) => [
    index('audit_entity_idx').on(t.householdId, t.entityType, t.entityId, t.at),
    index('audit_household_at_idx').on(t.householdId, t.at),
  ],
);
