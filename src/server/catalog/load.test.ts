import { getTableColumns, getTableName, is, sql } from 'drizzle-orm';
import { PgTable } from 'drizzle-orm/pg-core';
import { beforeEach, describe, expect, it } from 'vitest';

import type { Db } from '../db/client';
import * as schema from '../db/schema';
import { createTestDb } from '../db/test-db';
import { parseCsv } from './csv-stream';
import { RB_FILES, fileSpec, parseField } from './files';
import { createStaging, loadFile, mapHeader, swapStaging } from './load';

async function* rows(csv: string) {
  yield csv;
}
const stream = (csv: string) => parseCsv(rows(csv));

let db: Db;
beforeEach(async () => {
  db = await createTestDb();
});

const count = async (table: string) => {
  const r = await db.execute<{ n: number }>(sql.raw(`select count(*)::int as n from "${table}"`));
  const list = Array.isArray(r) ? r : (r as unknown as { rows: { n: number }[] }).rows;
  return list[0]!.n;
};

describe('file specs', () => {
  it('match the Drizzle tables column for column', () => {
    const tables = Object.values(schema).filter((t) => is(t, PgTable)) as unknown as PgTable[];
    for (const f of RB_FILES) {
      const table = tables.find((t) => getTableName(t) === f.table);
      expect(table, `${f.table} exists in the schema`).toBeDefined();
      expect(Object.values(getTableColumns(table!)).map((c) => c.name)).toEqual(
        f.columns.map((c) => c.db),
      );
    }
  });
});

describe('parseField', () => {
  const cols = fileSpec('colors.csv')!.columns;
  it('parses ints, text and booleans, and turns optional empties into null', () => {
    expect(parseField(cols[0]!, '-1')).toBe(-1);
    expect(parseField(cols[3]!, 'True')).toBe(true);
    expect(parseField(cols[3]!, 'False')).toBe(false);
    expect(parseField(cols[4]!, '')).toBeNull();
    expect(parseField(cols[1]!, '')).toBe('');
  });

  it('rejects junk with a message naming the column', () => {
    expect(() => parseField(cols[0]!, 'abc')).toThrow(/id is not a whole number/);
    expect(() => parseField(cols[3]!, 'yes')).toThrow(/is_trans/);
    expect(() => parseField(cols[0]!, '')).toThrow(/id is empty/);
  });
});

describe('mapHeader', () => {
  it('finds columns in any order and ignores extras', () => {
    const spec = fileSpec('themes.csv')!;
    expect(mapHeader(spec, ['parent_id', 'extra', 'id', 'name'])).toEqual([2, 3, 0]);
  });
  it('names the missing column', () => {
    expect(() => mapHeader(fileSpec('themes.csv')!, ['id', 'name'])).toThrow(
      /missing the column "parent_id"/,
    );
  });
});

describe('loading and swapping', () => {
  it('loads a file into staging and swaps it in, replacing the old catalog', async () => {
    await db.insert(schema.rbThemes).values({ id: 99, name: 'Old', parentId: null });
    await createStaging(db);
    const n = await loadFile(
      db,
      fileSpec('themes.csv')!,
      stream('id,name,parent_id\n1,Technic,\n2,"Star Wars, the saga",\n3,Sub,2\n'),
    );
    expect(n).toBe(3);
    expect(await count('rb_themes')).toBe(1); // live table is untouched until the swap
    // Empty tables for the other files let the swap run.
    await swapStaging(db);
    const live = await db.select().from(schema.rbThemes).orderBy(schema.rbThemes.id);
    expect(live).toEqual([
      { id: 1, name: 'Technic', parentId: null },
      { id: 2, name: 'Star Wars, the saga', parentId: null },
      { id: 3, name: 'Sub', parentId: 2 },
    ]);
    expect(await count('rb_themes_next').catch(() => -1)).toBe(-1); // staging dropped
  });

  it('a failed swap leaves the old catalog in place', async () => {
    await db.insert(schema.rbParts).values({ partNum: '3001', name: 'Brick 2 x 4' });
    await createStaging(db);
    // A duplicate primary key in the staged data makes the swap fail.
    await loadFile(
      db,
      fileSpec('parts.csv')!,
      stream(
        'part_num,name,part_cat_id,part_material\n3023,Plate,14,Plastic\n3023,Plate again,14,Plastic\n',
      ),
    );
    await expect(swapStaging(db)).rejects.toThrow();
    const live = await db.select().from(schema.rbParts);
    expect(live.map((p) => p.partNum)).toEqual(['3001']);
  });

  it('stops on a bad row with the file name and line number, loading nothing from that batch', async () => {
    await createStaging(db);
    await expect(
      loadFile(db, fileSpec('themes.csv')!, stream('id,name,parent_id\n1,A,\nx,B,\n')),
    ).rejects.toThrow(/themes\.csv line 3: id is not a whole number/);
    await expect(
      loadFile(db, fileSpec('themes.csv')!, stream('id,name,parent_id\n1,A\n')),
    ).rejects.toThrow(/line 2: expected 3 fields/);
    await expect(loadFile(db, fileSpec('themes.csv')!, stream(''))).rejects.toThrow(/is empty/);
  });

  it('loads in several batches when there are many rows, with progress', async () => {
    await createStaging(db);
    const lines = Array.from({ length: 25_000 }, (_, i) => `${i},Theme ${i},`).join('\n');
    const seen: number[] = [];
    const n = await loadFile(
      db,
      fileSpec('themes.csv')!,
      stream(`id,name,parent_id\n${lines}\n`),
      (c) => seen.push(c),
    );
    expect(n).toBe(25_000);
    expect(seen.length).toBeGreaterThan(1);
    expect(seen.at(-1)).toBe(25_000);
  });
});
