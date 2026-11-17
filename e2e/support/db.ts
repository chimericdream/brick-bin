// Direct SQL access to the e2e database. Used to seed data quickly and to do things the UI
// cannot (create a second household, inspect stored rows).
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import postgres from 'postgres';

import { DATABASE_URL, DATA_DIR, MOCK_URL } from './env';
import { TINY_PNG } from './images';
import { ACCOUNTS, ADMIN } from './roles';

export const sql = postgres(DATABASE_URL, { max: 3, onnotice: () => {} });

export type BuildState = 'sealed' | 'opened' | 'in_progress' | 'built' | 'disassembled' | 'mixed';

export interface SeedCopy {
  buildState?: BuildState;
  ownerEmail?: string | null;
  locationId?: string | null;
  piecesCheckedOn?: string | null;
  pricePaidCents?: number | null;
  estimatedValueCents?: number | null;
  conditionNotes?: string | null;
}

export interface SeedSet {
  name: string;
  /** Brand name; created on demand. Defaults to LEGO. */
  brand?: string;
  setNumber?: string | null;
  theme?: string | null;
  year?: number | null;
  pieceCount?: number | null;
  retailPriceCents?: number | null;
  hiddenFromRestricted?: boolean;
  tags?: string[];
  cover?: boolean;
  /** Copies seeded in the same call. Defaults to one sealed copy; pass `[]` for none. */
  copies?: SeedCopy[];
  householdId?: string;
}

const roleEmails = ACCOUNTS.map((a) => a.email);

export async function householdId(): Promise<string> {
  const [row] = await sql`select household_id as id from users where email = ${ADMIN.email}`;
  if (!row) throw new Error('Admin account not created yet (the setup project has not run)');
  return row.id as string;
}

export async function userId(email: string): Promise<string> {
  const [row] = await sql`select id from users where email = ${email}`;
  if (!row) throw new Error(`No user ${email}`);
  return row.id as string;
}

/** Clears everything tests create, keeping the role accounts, their sessions and the LEGO brand. */
export async function resetCatalog(): Promise<void> {
  const hh = await householdId().catch(() => null);
  if (!hh) return;
  await sql`delete from households where id <> ${hh}`;
  await sql`delete from users where household_id = ${hh} and email <> all(${roleEmails})`;
  await sql`truncate sets, tags, themes, locations restart identity cascade`;
  await sql`delete from brands where household_id = ${hh} and is_lego = false`;
  await sql`truncate audit_log`;
  // The reference catalog and the import history are global, so they reset too.
  await sql`truncate catalog_runs, catalog_files, catalog_part_images, rb_themes, rb_colors, rb_part_categories, rb_parts, rb_part_relationships, rb_elements, rb_sets, rb_minifigs, rb_inventories, rb_inventory_parts, rb_inventory_minifigs, rb_inventory_sets, rb_color_mappings, rb_part_mappings, rb_set_mappings`;
  for (const dir of ['catalog', 'instructions', 'covers']) {
    rmSync(path.join(DATA_DIR, dir), { recursive: true, force: true });
  }
}

export async function brandId(name: string, hhId?: string): Promise<string> {
  const hh = hhId ?? (await householdId());
  const [found] =
    await sql`select id from brands where household_id = ${hh} and lower(name) = ${name.toLowerCase()}`;
  if (found) return found.id as string;
  const [row] =
    await sql`insert into brands (household_id, name) values (${hh}, ${name}) returning id`;
  return row!.id as string;
}

export async function seedLocation(name: string, parentId: string | null = null): Promise<string> {
  const hh = await householdId();
  const [row] = await sql`
    insert into locations (household_id, name, parent_id) values (${hh}, ${name}, ${parentId}) returning id`;
  return row!.id as string;
}

export async function seedTheme(name: string, parentId: string | null = null): Promise<string> {
  const hh = await householdId();
  const [row] = await sql`
    insert into themes (household_id, name, parent_id) values (${hh}, ${name}, ${parentId}) returning id`;
  return row!.id as string;
}

export async function seedCopy(setId: string, c: SeedCopy = {}, hhId?: string): Promise<string> {
  const hh = hhId ?? (await householdId());
  const owner = c.ownerEmail ? await userId(c.ownerEmail) : null;
  const [row] = await sql`
    insert into copies (household_id, set_id, owner_user_id, location_id, build_state, pieces_checked_on,
                        price_paid_cents, estimated_value_cents, condition_notes)
    values (${hh}, ${setId}, ${owner}, ${c.locationId ?? null}, ${c.buildState ?? 'sealed'},
            ${c.piecesCheckedOn ?? null}, ${c.pricePaidCents ?? null}, ${c.estimatedValueCents ?? null},
            ${c.conditionNotes ?? null})
    returning id`;
  return row!.id as string;
}

let seq = 1000;

export async function seedSet(s: SeedSet): Promise<string> {
  const hh = s.householdId ?? (await householdId());
  const brand = await brandId(s.brand ?? 'LEGO', hh);
  let theme: string | null = null;
  if (s.theme) {
    const [found] =
      await sql`select id from themes where household_id = ${hh} and name = ${s.theme}`;
    theme = (found?.id as string | undefined) ?? (await seedTheme(s.theme));
  }
  const number = s.setNumber === undefined ? String(seq++) : s.setNumber;
  const [row] = await sql`
    insert into sets (household_id, brand_id, set_number, name, theme_id, year, piece_count,
                      retail_price_cents, hidden_from_restricted)
    values (${hh}, ${brand}, ${number}, ${s.name}, ${theme}, ${s.year ?? null},
            ${s.pieceCount ?? null}, ${s.retailPriceCents ?? null}, ${s.hiddenFromRestricted ?? false})
    returning id`;
  const id = row!.id as string;
  for (const name of s.tags ?? []) {
    const [existing] =
      await sql`select id from tags where household_id = ${hh} and lower(name) = ${name.toLowerCase()}`;
    const tagId =
      (existing?.id as string | undefined) ??
      ((await sql`insert into tags (household_id, name) values (${hh}, ${name}) returning id`)[0]!
        .id as string);
    await sql`insert into set_tags (household_id, set_id, tag_id) values (${hh}, ${id}, ${tagId})`;
  }
  // The library lists owned sets (those with a copy) by default.
  for (const c of s.copies ?? [{}]) await seedCopy(id, c, hh);
  if (s.cover) await seedCover(id, hh);
  return id;
}

/** Writes a real PNG into DATA_DIR and points the set at it. Returns the relative path. */
export async function seedCover(setId: string, hhId?: string, image: Buffer = TINY_PNG) {
  const hh = hhId ?? (await householdId());
  const rel = path.posix.join('covers', hh, `${setId}-seed.png`);
  const abs = path.join(DATA_DIR, rel);
  mkdirSync(path.dirname(abs), { recursive: true });
  writeFileSync(abs, image);
  await sql`update sets set cover_image = ${rel} where id = ${setId}`;
  return rel;
}

export async function seedMany(total: number, prefix = 'Bulk Set'): Promise<void> {
  const hh = await householdId();
  const brand = await brandId('LEGO', hh);
  await sql`
    insert into sets (household_id, brand_id, set_number, name, year, piece_count)
    select ${hh}::uuid, ${brand}::uuid, (20000 + n)::text,
           ${prefix}::text || ' ' || lpad(n::text, 4, '0'), 2000 + (n % 25), 100 + n
    from generate_series(1, ${total}::int) n`;
  await sql`
    insert into copies (household_id, set_id)
    select household_id, id from sets where household_id = ${hh}::uuid and name like ${prefix + ' %'}`;
}

/** A completely separate household with one set, to prove tenant isolation. */
export async function seedOtherHousehold(): Promise<{
  householdId: string;
  setId: string;
  name: string;
}> {
  const [hh] = await sql`insert into households (name) values ('Other family') returning id`;
  const name = 'Other Family Secret Set';
  const setId = await seedSet({
    name,
    householdId: hh!.id as string,
    cover: true,
    tags: ['otherfam'],
    copies: [{ pricePaidCents: 999 }],
  });
  return { householdId: hh!.id as string, setId, name };
}

export async function count(table: string, where = 'true'): Promise<number> {
  const [row] = await sql.unsafe(`select count(*)::int as n from ${table} where ${where}`);
  return row!.n as number;
}

export async function setIdByName(name: string): Promise<string> {
  const [row] = await sql`select id from sets where name = ${name}`;
  if (!row) throw new Error(`No set named ${name}`);
  return row.id as string;
}

/** A small reference catalog, with set covers on the mock server. */
export async function seedCatalog(): Promise<void> {
  await sql`insert into rb_themes (id, name, parent_id) values (1, 'Star Wars', null), (2, 'Ultimate Collector Series', 1), (721, 'Icons', null)`;
  await sql`
    insert into rb_sets (set_num, name, year, theme_id, num_parts, img_url) values
      ('10294-1', 'Titanic', 2021, 721, 9092, ${MOCK_URL + '/media/sets/10294-1.jpg'}),
      ('75192-1', 'Millennium Falcon', 2017, 2, 7541, ${MOCK_URL + '/media/sets/75192-1.jpg'}),
      ('75257-1', 'Millennium Falcon', 2019, 1, 1351, ${MOCK_URL + '/media/sets/75257-1.jpg'})`;
  await sql`insert into rb_colors (id, name, rgb, is_trans) values (0, 'Black', '05131D', false), (4, 'Red', 'C91A09', false), (15, 'White', 'FFFFFF', false), (71, 'Light Bluish Gray', 'A0A5A9', false)`;
  await sql`insert into rb_part_categories (id, name) values (11, 'Bricks'), (14, 'Plates')`;
  await sql`insert into rb_parts (part_num, name, part_cat_id) values ('3001', 'Brick 2 x 4', 11), ('3023', 'Plate 1 x 2', 14), ('3020', 'Plate 2 x 4', 14), ('4081', 'Plate, Modified 1 x 1 with Clip', 14)`;
  await sql`insert into rb_inventories (id, version, set_num) values (1, 1, '10294-1'), (2, 1, '75192-1')`;
  await sql`
    insert into rb_inventory_parts (inventory_id, part_num, color_id, quantity, is_spare) values
      (1, '3001', 0, 4, false), (1, '3023', 4, 2, false), (1, '3023', 4, 1, true), (1, '3020', 15, 6, false), (2, '3001', 4, 9, false)`;
  await sql`insert into rb_minifigs (fig_num, name) values ('fig-000001', 'Captain'), ('fig-000002', 'Deckhand')`;
  await sql`insert into rb_inventory_minifigs (inventory_id, fig_num, quantity) values (1, 'fig-000001', 1), (1, 'fig-000002', 3)`;
  await sql`insert into rb_elements (element_id, part_num, color_id) values ('300126', '3001', 0), ('300121', '3001', 4)`;
}

/** Puts a real PNG where the part-image route looks, and records it in the index. */
export async function seedPartImage(colorId: number, partNum: string): Promise<void> {
  const folder = path.join(DATA_DIR, 'catalog', 'ldraw', String(colorId));
  mkdirSync(folder, { recursive: true });
  writeFileSync(path.join(folder, `${partNum}.png`), TINY_PNG);
  await sql`insert into catalog_part_images (part_num, color_id) values (${partNum}, ${colorId}) on conflict do nothing`;
}

export function coverPath(rel: string): string {
  return path.join(DATA_DIR, rel);
}

/** Links a set to a catalog set (as picking it from the lookup would). */
export async function linkSet(setId: string, rbSetNum: string): Promise<void> {
  await sql`update sets set rb_set_num = ${rbSetNum} where id = ${setId}`;
}

/** The first copy id of a set. */
export async function firstCopyId(setId: string): Promise<string> {
  const [row] =
    await sql`select id from copies where set_id = ${setId} order by created_at limit 1`;
  if (!row) throw new Error('The set has no copy');
  return row.id as string;
}
