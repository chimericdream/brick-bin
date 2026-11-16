import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

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

// ---------------------------------------------------------------------------
// Catalog (household): brands, themes, sets, copies, places, tags
// ---------------------------------------------------------------------------

export const buildState = pgEnum('build_state', [
  'sealed',
  'opened',
  'in_progress',
  'built',
  'disassembled',
  'mixed',
]);

export const brands = pgTable(
  'brands',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    /** True for the seeded LEGO row: enables catalog lookup and LEGO.com instruction links. */
    isLego: boolean('is_lego').notNull().default(false),
    websiteUrl: text('website_url'),
    notes: text('notes'),
    ...authorship(),
    ...stamps(),
  },
  (t) => [
    index('brands_household_idx').on(t.householdId),
    uniqueIndex('brands_name_unique').on(t.householdId, sql`lower(${t.name})`),
  ],
);

export const themes = pgTable(
  'themes',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    parentId: uuid('parent_id').references((): AnyPgColumn => themes.id, { onDelete: 'set null' }),
    /** Null means any brand. */
    brandId: uuid('brand_id').references(() => brands.id, { onDelete: 'set null' }),
    /** Rebrickable theme id; null for themes you made yourself. */
    rbThemeId: integer('rb_theme_id'),
    ...authorship(),
    ...stamps(),
  },
  (t) => [index('themes_household_idx').on(t.householdId)],
);

export const locations = pgTable(
  'locations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    parentId: uuid('parent_id').references((): AnyPgColumn => locations.id, {
      onDelete: 'set null',
    }),
    ...trashable(),
    ...authorship(),
    ...stamps(),
  },
  (t) => [index('locations_household_idx').on(t.householdId)],
);

/** The design: a set number from a brand. What we physically own lives in `copies`. */
export const sets = pgTable(
  'sets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    brandId: uuid('brand_id')
      .notNull()
      .references(() => brands.id),
    /** As printed on the box (`10294`, `10294-1`, `C61042W`). Optional for unnumbered kits. */
    setNumber: text('set_number'),
    name: text('name').notNull(),
    themeId: uuid('theme_id').references(() => themes.id, { onDelete: 'set null' }),
    year: integer('year'),
    pieceCount: integer('piece_count'),
    minifigCount: integer('minifig_count'),
    minAge: integer('min_age'),
    description: text('description'),
    /** Original retail price in cents. Hidden from restricted profiles. */
    retailPriceCents: integer('retail_price_cents'),
    /** Relative path under DATA_DIR. */
    coverImage: text('cover_image'),
    /** Rebrickable id when linked (`10294-1`); drives re-sync and the set's part inventory. */
    rbSetNum: text('rb_set_num'),
    rbInventoryVersion: integer('rb_inventory_version'),
    designer: text('designer'),
    hiddenFromRestricted: boolean('hidden_from_restricted').notNull().default(false),
    notes: text('notes'),
    ...trashable(),
    ...authorship(),
    ...stamps(),
  },
  (t) => [
    index('sets_household_idx').on(t.householdId),
    index('sets_brand_idx').on(t.brandId),
    uniqueIndex('sets_number_unique')
      .on(t.householdId, t.brandId, sql`lower(${t.setNumber})`)
      .where(sql`${t.deletedAt} is null and ${t.setNumber} is not null`),
  ],
);

/** A physical box someone owns, with its own build state, place, value and (later) missing pieces. */
export const copies = pgTable(
  'copies',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    setId: uuid('set_id')
      .notNull()
      .references(() => sets.id, { onDelete: 'cascade' }),
    /** Null means "ours". */
    ownerUserId: uuid('owner_user_id').references(() => users.id, { onDelete: 'set null' }),
    locationId: uuid('location_id').references(() => locations.id, { onDelete: 'set null' }),
    buildState: buildState('build_state').notNull().default('sealed'),
    /** Date of the last full piece check; null means never checked. */
    piecesCheckedOn: date('pieces_checked_on', { mode: 'string' }),
    hasBox: boolean('has_box').notNull().default(true),
    hasInstructions: boolean('has_instructions').notNull().default(true),
    conditionNotes: text('condition_notes'),
    acquiredOn: date('acquired_on', { mode: 'string' }),
    pricePaidCents: integer('price_paid_cents'),
    estimatedValueCents: integer('estimated_value_cents'),
    valuedOn: date('valued_on', { mode: 'string' }),
    notes: text('notes'),
    ...trashable(),
    ...authorship(),
    ...stamps(),
  },
  (t) => [
    index('copies_household_idx').on(t.householdId),
    index('copies_set_idx').on(t.setId),
    index('copies_location_idx').on(t.locationId),
  ],
);

export const tags = pgTable(
  'tags',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
  },
  (t) => [
    index('tags_household_idx').on(t.householdId),
    uniqueIndex('tags_name_unique').on(t.householdId, sql`lower(${t.name})`),
  ],
);

export const setTags = pgTable(
  'set_tags',
  {
    householdId: uuid('household_id')
      .notNull()
      .references(() => households.id, { onDelete: 'cascade' }),
    setId: uuid('set_id')
      .notNull()
      .references(() => sets.id, { onDelete: 'cascade' }),
    tagId: uuid('tag_id')
      .notNull()
      .references(() => tags.id, { onDelete: 'cascade' }),
  },
  (t) => [primaryKey({ columns: [t.setId, t.tagId] })],
);
