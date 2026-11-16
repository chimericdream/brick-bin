import { sql } from 'drizzle-orm';

import type { Db } from '../db/client';
import { RB_FILES, parseField, type RbFile } from './files';

/** Rows per INSERT. Postgres allows 65,535 parameters per statement. */
const PARAM_LIMIT = 60_000;

const ident = (name: string) => sql.raw(`"${name}"`);

/** Creates empty staging tables (`rb_x_next`) shaped like the live ones, without indexes (faster loads). */
export async function createStaging(db: Db): Promise<void> {
  for (const f of RB_FILES) {
    await db.execute(sql`drop table if exists ${ident(`${f.table}_next`)}`);
    await db.execute(sql`create table ${ident(`${f.table}_next`)} (like ${ident(f.table)})`);
  }
}

export async function dropStaging(db: Db): Promise<void> {
  for (const f of RB_FILES) await db.execute(sql`drop table if exists ${ident(`${f.table}_next`)}`);
}

/** Maps a CSV header onto the spec's columns. Throws if a column is missing; extra columns are ignored. */
export function mapHeader(spec: RbFile, header: string[]): number[] {
  const clean = header.map((h) => h.trim());
  return spec.columns.map((col) => {
    const at = clean.indexOf(col.csv);
    if (at === -1) {
      throw new Error(
        `${spec.file} is missing the column "${col.csv}". Its header is: ${clean.join(', ').slice(0, 200)}`,
      );
    }
    return at;
  });
}

/**
 * Validates and loads one file into its staging table in batches. Every field is parsed against the
 * column type, and a bad row stops the load with the file name and line number. Returns rows loaded.
 */
export async function loadFile(
  db: Db,
  spec: RbFile,
  rows: AsyncIterable<string[]>,
  onProgress?: (rowsSoFar: number) => void,
): Promise<number> {
  const perBatch = Math.floor(PARAM_LIMIT / spec.columns.length);
  const target = ident(`${spec.table}_next`);
  const cols = sql.join(
    spec.columns.map((c) => ident(c.db)),
    sql`, `,
  );
  let at: number[] | null = null;
  let batch: (number | string | boolean | null)[][] = [];
  let line = 0;
  let total = 0;

  const flush = async () => {
    if (batch.length === 0) return;
    const values = sql.join(
      batch.map(
        (r) =>
          sql`(${sql.join(
            r.map((v) => sql`${v}`),
            sql`, `,
          )})`,
      ),
      sql`, `,
    );
    await db.execute(sql`insert into ${target} (${cols}) values ${values}`);
    total += batch.length;
    batch = [];
    onProgress?.(total);
  };

  for await (const row of rows) {
    line++;
    if (at === null) {
      at = mapHeader(spec, row);
      continue;
    }
    if (row.length < Math.max(...at) + 1) {
      throw new Error(
        `${spec.file} line ${line}: expected ${at.length} fields, found ${row.length}`,
      );
    }
    try {
      batch.push(spec.columns.map((col, i) => parseField(col, row[at![i]!]!)));
    } catch (e) {
      throw new Error(`${spec.file} line ${line}: ${(e as Error).message}`, { cause: e });
    }
    if (batch.length >= perBatch) await flush();
  }
  if (at === null) throw new Error(`${spec.file} is empty`);
  await flush();
  return total;
}

/**
 * Replaces the live catalog with the staged one, all in one transaction. If anything fails
 * (a duplicate key, say) nothing changes and the old catalog stays.
 */
export async function swapStaging(db: Db): Promise<void> {
  await db.transaction(async (tx) => {
    for (const f of RB_FILES) {
      await tx.execute(sql`truncate ${ident(f.table)}`);
      await tx.execute(
        sql`insert into ${ident(f.table)} select * from ${ident(`${f.table}_next`)}`,
      );
    }
  });
  await dropStaging(db);
}
