import { sql } from 'drizzle-orm';
import {
  type AnyPgColumn,
  bigint,
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

// ---------------------------------------------------------------------------
// Reference catalog (global): Rebrickable CSVs. Written only by the catalog import; no household_id.
// Household rows point at these by natural keys (set_num, part_num, color_id, fig_num), never by
// foreign key, so replacing the catalog cannot break or cascade into household data.
// ---------------------------------------------------------------------------

export const rbThemes = pgTable('rb_themes', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  parentId: integer('parent_id'),
});

export const rbColors = pgTable('rb_colors', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
  rgb: text('rgb').notNull(),
  isTrans: boolean('is_trans').notNull(),
  numParts: integer('num_parts'),
  numSets: integer('num_sets'),
  y1: integer('y1'),
  y2: integer('y2'),
});

export const rbPartCategories = pgTable('rb_part_categories', {
  id: integer('id').primaryKey(),
  name: text('name').notNull(),
});

export const rbParts = pgTable(
  'rb_parts',
  {
    partNum: text('part_num').primaryKey(),
    name: text('name').notNull(),
    partCatId: integer('part_cat_id'),
    partMaterial: text('part_material'),
  },
  (t) => [
    index('rb_parts_name_idx').on(sql`lower(${t.name})`),
    index('rb_parts_cat_idx').on(t.partCatId),
  ],
);

export const rbPartRelationships = pgTable(
  'rb_part_relationships',
  {
    relType: text('rel_type').notNull(),
    childPartNum: text('child_part_num').notNull(),
    parentPartNum: text('parent_part_num').notNull(),
  },
  (t) => [
    index('rb_part_rel_parent_idx').on(t.parentPartNum),
    index('rb_part_rel_child_idx').on(t.childPartNum),
  ],
);

export const rbElements = pgTable(
  'rb_elements',
  {
    elementId: text('element_id').notNull(),
    partNum: text('part_num').notNull(),
    colorId: integer('color_id').notNull(),
    designId: text('design_id'),
  },
  (t) => [index('rb_elements_part_color_idx').on(t.partNum, t.colorId)],
);

export const rbSets = pgTable(
  'rb_sets',
  {
    setNum: text('set_num').primaryKey(),
    name: text('name').notNull(),
    year: integer('year'),
    themeId: integer('theme_id'),
    numParts: integer('num_parts'),
    imgUrl: text('img_url'),
  },
  (t) => [index('rb_sets_name_idx').on(sql`lower(${t.name})`)],
);

export const rbMinifigs = pgTable('rb_minifigs', {
  figNum: text('fig_num').primaryKey(),
  name: text('name').notNull(),
  numParts: integer('num_parts'),
  imgUrl: text('img_url'),
});

export const rbInventories = pgTable(
  'rb_inventories',
  {
    id: integer('id').primaryKey(),
    version: integer('version').notNull(),
    setNum: text('set_num').notNull(),
  },
  (t) => [index('rb_inventories_set_idx').on(t.setNum)],
);

export const rbInventoryParts = pgTable(
  'rb_inventory_parts',
  {
    inventoryId: integer('inventory_id').notNull(),
    partNum: text('part_num').notNull(),
    colorId: integer('color_id').notNull(),
    quantity: integer('quantity').notNull(),
    isSpare: boolean('is_spare').notNull(),
    imgUrl: text('img_url'),
  },
  (t) => [index('rb_inventory_parts_inv_idx').on(t.inventoryId)],
);

export const rbInventoryMinifigs = pgTable(
  'rb_inventory_minifigs',
  {
    inventoryId: integer('inventory_id').notNull(),
    figNum: text('fig_num').notNull(),
    quantity: integer('quantity').notNull(),
  },
  (t) => [index('rb_inventory_minifigs_inv_idx').on(t.inventoryId)],
);

export const rbInventorySets = pgTable(
  'rb_inventory_sets',
  {
    inventoryId: integer('inventory_id').notNull(),
    setNum: text('set_num').notNull(),
    quantity: integer('quantity').notNull(),
  },
  (t) => [index('rb_inventory_sets_inv_idx').on(t.inventoryId)],
);

export const rbColorMappings = pgTable('rb_color_mappings', {
  id: integer('id').notNull(),
  extSystem: text('ext_system').notNull(),
  extId: text('ext_id').notNull(),
  extDescr: text('ext_descr'),
  isExportId: boolean('is_export_id').notNull(),
  isImportId: boolean('is_import_id').notNull(),
});

export const rbPartMappings = pgTable(
  'rb_part_mappings',
  {
    partNum: text('part_num').notNull(),
    extSystem: text('ext_system').notNull(),
    extId: text('ext_id').notNull(),
    isExportId: boolean('is_export_id').notNull(),
    isImportId: boolean('is_import_id').notNull(),
  },
  (t) => [index('rb_part_mappings_part_idx').on(t.partNum)],
);

export const rbSetMappings = pgTable(
  'rb_set_mappings',
  {
    setNum: text('set_num').notNull(),
    extSystem: text('ext_system').notNull(),
    extId: text('ext_id').notNull(),
  },
  (t) => [index('rb_set_mappings_set_idx').on(t.setNum)],
);

// ---------------------------------------------------------------------------
// Catalog import bookkeeping (global)
// ---------------------------------------------------------------------------

export const catalogRunStatus = pgEnum('catalog_run_status', ['running', 'succeeded', 'failed']);

export const catalogRuns = pgTable('catalog_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  startedAt: timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp('finished_at', { withTimezone: true }),
  status: catalogRunStatus('status').notNull().default('running'),
  startedByUserId: uuid('started_by_user_id').references(() => users.id, { onDelete: 'set null' }),
  /** Where the file list came from: the app fetched the page, or an admin pasted it. */
  source: text('source').notNull().default('pasted'),
  error: text('error'),
  /** Current step and progress, shown while running. */
  step: text('step'),
  filesDone: integer('files_done').notNull().default(0),
  filesTotal: integer('files_total').notNull().default(0),
  bytesDownloaded: bigint('bytes_downloaded', { mode: 'number' }).notNull().default(0),
  filesDownloaded: integer('files_downloaded').notNull().default(0),
  filesSkipped: integer('files_skipped').notNull().default(0),
  rowsLoaded: bigint('rows_loaded', { mode: 'number' }).notNull().default(0),
  /** Notes for the run summary (dropped links, colour name mismatches, and so on). */
  notes: jsonb('notes').$type<string[]>().notNull().default([]),
});

export const catalogFileKind = pgEnum('catalog_file_kind', [
  'csv_archive',
  'ldraw_zip',
  'schema_svg',
  'downloads_page',
]);

/** One row per remote file. Drives "only changed files" and the once-a-day-per-URL rule. */
export const catalogFiles = pgTable('catalog_files', {
  url: text('url').primaryKey(),
  kind: catalogFileKind('kind').notNull(),
  /** LDraw files only. */
  colorId: integer('color_id'),
  colorName: text('color_name'),
  /** The date the downloads page shows for the file. */
  remoteDate: timestamp('remote_date', { withTimezone: true }),
  etag: text('etag'),
  lastModified: text('last_modified'),
  bytes: bigint('bytes', { mode: 'number' }),
  fetchedAt: timestamp('fetched_at', { withTimezone: true }),
  extractedAt: timestamp('extracted_at', { withTimezone: true }),
});

/** Which colours each part has an LDraw image in; rebuilt by each run. Used for fallback images. */
export const catalogPartImages = pgTable(
  'catalog_part_images',
  {
    partNum: text('part_num').notNull(),
    colorId: integer('color_id').notNull(),
  },
  (t) => [primaryKey({ columns: [t.partNum, t.colorId] })],
);
