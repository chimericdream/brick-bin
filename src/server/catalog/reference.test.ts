import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import type { Db } from '../db/client';
import { catalogPartImages, rbSets, rbThemes } from '../db/schema';
import { createTestDb } from '../db/test-db';
import { catalogPaths } from './config';
import {
  boxNumber,
  catalogThemeChain,
  getCatalogSet,
  matchCatalogSets,
  resolvePartImage,
  searchCatalogSets,
} from './reference';

let db: Db;
let dir: string;

beforeEach(async () => {
  db = await createTestDb();
  dir = await mkdtemp(path.join(tmpdir(), 'bb-ref-'));
  await db.insert(rbThemes).values([
    { id: 1, name: 'Star Wars', parentId: null },
    { id: 2, name: 'Ultimate Collector Series', parentId: 1 },
    { id: 721, name: 'Icons', parentId: null },
  ]);
  await db.insert(rbSets).values([
    {
      setNum: '10294-1',
      name: 'Titanic',
      year: 2021,
      themeId: 721,
      numParts: 9092,
      imgUrl: 'https://cdn.rebrickable.com/media/sets/10294-1.jpg',
    },
    { setNum: '102940-1', name: 'Something else', year: 2020, themeId: 721, numParts: 10 },
    { setNum: '75192-1', name: 'Millennium Falcon', year: 2017, themeId: 2, numParts: 7541 },
    { setNum: '75257-1', name: 'Millennium Falcon', year: 2019, themeId: 1, numParts: 1351 },
    { setNum: '4000-1', name: 'Titanic Lookalike', year: 1998, themeId: null, numParts: 5 },
  ]);
});
afterEach(async () => {
  await rm(dir, { recursive: true, force: true });
});

describe('searchCatalogSets', () => {
  it('puts set numbers that start with the text first, shortest first', async () => {
    const hits = await searchCatalogSets(db, '10294');
    expect(hits.map((h) => h.setNum)).toEqual(['10294-1', '102940-1']);
    expect(hits[0]).toMatchObject({
      name: 'Titanic',
      themeName: 'Icons',
      year: 2021,
      numParts: 9092,
    });
  });

  it('finds by name, with names that start with the text before ones that contain it', async () => {
    expect((await searchCatalogSets(db, 'titanic')).map((h) => h.setNum)).toEqual([
      '10294-1',
      '4000-1',
    ]);
    expect((await searchCatalogSets(db, 'falcon')).map((h) => h.setNum)).toEqual([
      '75257-1',
      '75192-1',
    ]); // newest first
  });

  it('finds by theme name and ignores short or empty queries', async () => {
    expect((await searchCatalogSets(db, 'icons')).map((h) => h.setNum).toSorted()).toEqual([
      '10294-1',
      '102940-1',
    ]);
    expect(await searchCatalogSets(db, 'a')).toEqual([]);
    expect(await searchCatalogSets(db, '   ')).toEqual([]);
  });

  it('treats % and _ as plain text', async () => {
    expect(await searchCatalogSets(db, '%%')).toEqual([]);
    expect(await searchCatalogSets(db, 'ti_anic')).toEqual([]);
  });

  it('honours the limit', async () => {
    expect(await searchCatalogSets(db, 'falcon', 1)).toHaveLength(1);
  });
});

describe('set lookups', () => {
  it('gets one set and matches candidate numbers in order', async () => {
    expect((await getCatalogSet(db, '10294-1'))?.name).toBe('Titanic');
    expect(await getCatalogSet(db, 'nope-1')).toBeNull();
    expect(
      (await matchCatalogSets(db, ['99999', '75192', '10294-1'])).map((s) => s.setNum),
    ).toEqual(['75192-1', '10294-1']);
    expect(await matchCatalogSets(db, [])).toEqual([]);
  });

  it('builds the theme chain root first', async () => {
    expect((await catalogThemeChain(db, 2)).map((t) => t.name)).toEqual([
      'Star Wars',
      'Ultimate Collector Series',
    ]);
    expect(await catalogThemeChain(db, null)).toEqual([]);
    expect(await catalogThemeChain(db, 12345)).toEqual([]);
  });

  it('strips the version suffix for the number on the box', () => {
    expect(boxNumber('10294-1')).toBe('10294');
    expect(boxNumber('fig-000001')).toBe('fig-000001');
  });
});

describe('resolvePartImage', () => {
  const put = async (color: number, part: string) => {
    const folder = path.join(catalogPaths(dir).ldraw, String(color));
    await mkdir(folder, { recursive: true });
    await writeFile(path.join(folder, `${part}.png`), `png-${color}-${part}`);
    await db.insert(catalogPartImages).values({ partNum: part, colorId: color });
  };

  it('returns the exact colour when it exists', async () => {
    await put(0, '3001');
    await put(15, '3001');
    const img = await resolvePartImage(db, dir, 15, '3001');
    expect(img).toMatchObject({ colorId: 15, exact: true });
    expect(img!.bytes.toString()).toBe('png-15-3001');
  });

  it('falls back to Light Bluish Gray, then the lowest colour, and says so', async () => {
    await put(0, '3023');
    await put(71, '3023');
    await put(5, '3001');
    await put(9, '3001');
    expect(await resolvePartImage(db, dir, 15, '3023')).toMatchObject({
      colorId: 71,
      exact: false,
    });
    expect(await resolvePartImage(db, dir, 15, '3001')).toMatchObject({ colorId: 5, exact: false });
  });

  it('is null when no colour has the part, and refuses odd names', async () => {
    expect(await resolvePartImage(db, dir, 0, 'nothing')).toBeNull();
    await put(0, '3001');
    expect(await resolvePartImage(db, dir, 0, '../3001')).toBeNull();
    expect(await resolvePartImage(db, dir, 0, '3001/../../x')).toBeNull();
    expect(await resolvePartImage(db, dir, Number.NaN, '3001')).toBeNull();
  });

  it('is null when the file is gone from disk', async () => {
    await db.insert(catalogPartImages).values({ partNum: '9999', colorId: 0 });
    expect(await resolvePartImage(db, dir, 0, '9999')).toBeNull();
  });
});
