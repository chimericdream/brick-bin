import { readFile } from 'node:fs/promises';

import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { choose } from '../support/mantine';

const REBRICKABLE = `Set Number,Quantity,Includes Spares,Inventory Ver
10294-1,2,True,1
75192-1,1,True,1
99999-1,1,True,1
`;

const BRICKSET = `Number,NumberVariant,SetName,Year,Theme,Pieces,QtyOwned,Wanted
10294,1,Titanic,2021,Icons,9090,1,false
75192,1,Millennium Falcon,2017,Star Wars,7541,0,true
`;

const GENERIC = `Title,Maker,Ref,How many,Paid
Crane,Mould King,13124,2,59.99
Tower,Mould King,13125,1,
`;

const pick = async (page: Page, name: string, content: string) => {
  await page.goto('/import');
  await page.locator('input[type=file]').setInputFiles({
    name,
    mimeType: 'text/csv',
    buffer: Buffer.from(content),
  });
};

test.describe('csv import', () => {
  test('IMP-01 a Rebrickable set list is previewed, reports the row it cannot match, and imports @smoke', async ({
    page,
    db,
  }) => {
    await db.seedCatalog();
    await pick(page, 'sets.csv', REBRICKABLE);
    const preview = page
      .getByRole('region', { name: 'Preview' })
      .or(page.locator('h2:has-text("Preview")').locator('..'));
    await expect(page.getByText('2 new sets')).toBeVisible();
    await expect(page.getByText('3 copies in all')).toBeVisible();
    await expect(page.getByText('1 row cannot be imported')).toBeVisible();
    await expect(page.getByText('Not found in the catalog')).toBeVisible();
    await expect(page.getByText('Detected from the column names.')).toBeVisible();
    void preview;
    // Nothing is written by a preview.
    expect(await db.count('sets')).toBe(0);

    // The failed rows can be downloaded and keep the original columns plus the reason.
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.getByRole('button', { name: 'Download the rows that cannot be imported' }).click(),
    ]);
    const text = await readFile((await download.path())!, 'utf8');
    expect(text.split('\r\n')[0]).toBe(
      'Set Number,Quantity,Includes Spares,Inventory Ver,Import problem',
    );
    expect(text).toContain('99999-1,1,True,1,Not found in the catalog');

    await page.getByRole('button', { name: 'Import', exact: true }).click();
    await expect(page.getByText('Import finished')).toBeVisible();
    await expect(page.getByText('2 new sets, 3 copies added')).toBeVisible();
    expect(await db.count('sets')).toBe(2);
    expect(await db.count('copies')).toBe(3);
    expect(await db.count('audit_log', "entity_type = 'copy' and action = 'create'")).toBe(3);
    const [titanic] =
      await db.sql`select year, piece_count, rb_set_num, cover_image from sets where name = 'Titanic'`;
    expect(titanic).toMatchObject({
      year: 2021,
      piece_count: 9092,
      rb_set_num: '10294-1',
      cover_image: null,
    });
    // The theme chain from the catalog came along.
    expect(
      await db.count('themes', "name in ('Star Wars', 'Ultimate Collector Series', 'Icons')"),
    ).toBe(3);

    await page.getByRole('link', { name: 'Open the library' }).click();
    await expect(page.getByText('2 sets', { exact: true })).toBeVisible();
  });

  test('IMP-02 a Brickset export sends wanted sets to the importer’s wishlist', async ({
    page,
    db,
  }) => {
    await db.seedCatalog();
    await pick(page, 'brickset.csv', BRICKSET);
    await expect(page.getByText('1 new sets')).toBeVisible();
    await expect(page.getByText('1 wishlist entries')).toBeVisible();
    await page.getByRole('button', { name: 'Import', exact: true }).click();
    await expect(page.getByText(/1 on your wishlist/)).toBeVisible();
    await page.goto('/wishlist');
    await expect(page.getByRole('region', { name: 'My wishlist', exact: true })).toContainText(
      'Millennium Falcon',
    );
  });

  test('IMP-03 any other CSV: choose the columns, add a new brand, set the build state', async ({
    page,
    db,
  }) => {
    await pick(page, 'mine.csv', GENERIC);
    await expect(page.getByText('The file looks like')).toHaveCount(0);
    // Nothing is mapped that the headers do not name, so say what each column is.
    await choose(page, page, 'File format', 'Other CSV (choose the columns)');
    await choose(page, page, 'Set number', 'Ref');
    await choose(page, page, 'Name', 'Title');
    await choose(page, page, 'Brand', 'Maker');
    await choose(page, page, 'Copies owned', 'How many');
    await choose(page, page, 'Price paid', 'Paid');
    await expect(page.getByText('New brands: Mould King')).toBeVisible();
    await expect(page.getByText('2 new sets')).toBeVisible();
    await choose(page, page, 'Build state for the copies', 'Built');
    await page.getByRole('button', { name: 'Import', exact: true }).click();
    await expect(page.getByText('2 new sets, 3 copies added, 1 new brand')).toBeVisible();
    const copies =
      await db.sql`select build_state, price_paid_cents from copies order by price_paid_cents nulls last`;
    expect(copies.map((c) => c.build_state)).toEqual(['built', 'built', 'built']);
    expect(copies.map((c) => c.price_paid_cents)).toEqual([5999, 5999, null]);
    expect(await db.count('brands', "name = 'Mould King'")).toBe(1);
  });

  test('IMP-04 importing again adds copies to the sets you already have', async ({ page, db }) => {
    await db.seedCatalog();
    for (const round of [1, 2]) {
      await pick(page, 'sets.csv', 'Set Number,Quantity,Includes Spares\n10294-1,1,True\n');
      await expect(page.getByText(round === 1 ? '1 new sets' : '0 new sets')).toBeVisible();
      await page.getByRole('button', { name: 'Import', exact: true }).click();
      await expect(page.getByText('Import finished')).toBeVisible();
    }
    expect(await db.count('sets')).toBe(1);
    expect(await db.count('copies')).toBe(2);
  });

  test('IMP-05 empty and oversized files, and a file with nothing importable, say what is wrong', async ({
    page,
    db,
  }) => {
    await db.seedCatalog();
    await pick(page, 'empty.csv', 'Set Number,Quantity,Includes Spares\n');
    await expect(page.getByText('The file has no rows')).toBeVisible();
    await page.locator('input[type=file]').setInputFiles({
      name: 'big.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('a,b\n' + 'x,y\n'.repeat(600_000)),
    });
    await expect(page.getByText('over 2 MB')).toBeVisible();
    await page.locator('input[type=file]').setInputFiles({
      name: 'none.csv',
      mimeType: 'text/csv',
      buffer: Buffer.from('Set Number,Quantity,Includes Spares\n99999-1,1,True\n'),
    });
    await expect(page.getByText('1 row cannot be imported')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Import', exact: true })).toBeDisabled();
    expect(await db.count('sets')).toBe(0);
  });

  test('IMP-06 members can import; kid profiles have no page and no link', async ({
    memberPage,
    kidPage,
  }) => {
    await memberPage.goto('/import');
    await expect(memberPage.getByRole('heading', { name: 'Import', level: 1 })).toBeVisible();
    expect((await kidPage.goto('/import'))?.status()).toBe(404);
    await kidPage.goto('/sets');
    await expect(kidPage.getByRole('link', { name: 'Import' })).toHaveCount(0);
  });

  test('IMP-07 a failed write rolls everything back', async ({ page, db }) => {
    // A 300-character name passes the preview's checks but not the data layer's.
    const long = 'x'.repeat(300);
    await pick(page, 'bad.csv', `Name,Brand,Set #\nFine,Mould King,1\n${long},Mould King,2\n`);
    await choose(page, page, 'File format', 'Other CSV (choose the columns)');
    await choose(page, page, 'Set number', 'Set #');
    await choose(page, page, 'Name', 'Name');
    await choose(page, page, 'Brand', 'Brand');
    await page.getByRole('button', { name: 'Import', exact: true }).click();
    await expect(page.getByText(/Nothing was imported/)).toBeVisible();
    expect(await db.count('sets')).toBe(0);
    expect(await db.count('brands', "name = 'Mould King'")).toBe(0);
  });
});
