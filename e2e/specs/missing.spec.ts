import { expect, test } from '../fixtures';

type Page = import('@playwright/test').Page;

/** A linked set with one built copy, on its missing-pieces page. */
async function setup(
  db: typeof import('../support/db'),
  over: { buildState?: 'built' | 'sealed' } = {},
) {
  await db.seedCatalog();
  const setId = await db.seedSet({
    name: 'Titanic',
    setNumber: '10294',
    copies: [{ buildState: over.buildState ?? 'built' }],
  });
  await db.linkSet(setId, '10294-1');
  const copyId = await db.firstCopyId(setId);
  return { setId, copyId, url: `/copies/${copyId}/missing` };
}

const tile = (page: Page, name: string, color?: string) =>
  page
    .getByRole('listitem')
    .filter({ hasText: name })
    .filter({ hasText: color ?? '' });
const openList = (page: Page) => page.getByRole('region', { name: /Still missing/ });

test.describe('missing pieces', () => {
  test('MISS-01 adds parts from the set’s own inventory and shows them on the copy and in the library @smoke', async ({
    page,
    db,
  }) => {
    const { setId, url } = await setup(db);
    await page.goto(`/sets/${setId}`);
    await page.getByRole('link', { name: 'Missing pieces' }).click();
    await expect(page).toHaveURL(/\/copies\/[0-9a-f-]{36}\/missing$/);
    await expect(page.getByText('Nothing is listed as missing from this copy.')).toBeVisible();

    await expect(page.getByRole('tab', { name: 'Set parts' })).toBeVisible();
    const plate = tile(page, 'Plate 1 x 2', 'Red');
    await expect(plate).toContainText('In the set: ×2');
    await plate.getByRole('textbox', { name: /^Quantity of/ }).fill('2');
    await plate.getByRole('button', { name: /^Add 2/ }).click();
    await expect(
      page.getByRole('status').filter({ hasText: 'Added 2 × Plate 1 x 2, Red' }),
    ).toBeVisible();
    await expect(openList(page).getByText('Plate 1 x 2')).toBeVisible();
    await expect(openList(page).getByLabel('Quantity 2')).toBeVisible();
    await expect(page.getByText('Missing 2 pieces').first()).toBeVisible();

    await page.goto(`/sets/${setId}`);
    await expect(page.getByRole('link', { name: /Missing 2 pieces/ })).toBeVisible();
    await page.goto('/sets');
    await expect(page.getByText('Missing 2 pieces')).toBeVisible();
    await page.goto(url);
    expect(await db.count('copy_missing_items')).toBe(1);
    expect(await db.count('audit_log', "entity_type = 'missing_item' and action = 'create'")).toBe(
      1,
    );
  });

  test('MISS-02 adding the same part and colour again raises the quantity of one row', async ({
    page,
    db,
  }) => {
    const { url } = await setup(db);
    await page.goto(url);
    const brick = tile(page, 'Brick 2 x 4', 'Black');
    await brick.getByRole('button', { name: /^Add 1/ }).click();
    await expect(openList(page).getByLabel('Quantity 1')).toBeVisible();
    await brick.getByRole('button', { name: /^Add 1/ }).click();
    await expect(openList(page).getByLabel('Quantity 2')).toBeVisible();
    expect(await db.count('copy_missing_items')).toBe(1);
  });

  test('MISS-03 spare parts are hidden until asked for, and going over the set’s count warns but is allowed', async ({
    page,
    db,
  }) => {
    const { url } = await setup(db);
    await page.goto(url);
    await expect(page.getByText(/^3 parts/)).toBeVisible();
    await expect(page.getByText('spare', { exact: true })).toHaveCount(0);
    await page.getByLabel(/Show spare parts/).check();
    await expect(page.getByText(/^4 parts/)).toBeVisible();
    await expect(page.getByText('spare', { exact: true })).toBeVisible();

    const brick = tile(page, 'Brick 2 x 4', 'Black');
    await brick.getByRole('textbox', { name: /^Quantity of/ }).fill('9');
    await expect(brick.getByText('More than the set has')).toBeVisible();
    await brick.getByRole('button', { name: /^Add 9/ }).click();
    await expect(openList(page).getByLabel('Quantity 9')).toBeVisible();
  });

  test('MISS-04 search, colour and category narrow the grid, and their counts follow the other filters', async ({
    page,
    db,
  }) => {
    const { url } = await setup(db);
    await page.goto(url);
    await page.getByLabel('Search the set’s parts').fill('plate');
    await expect(page.getByText(/^2 parts/)).toBeVisible();
    await expect(tile(page, 'Brick 2 x 4')).toHaveCount(0);

    await page.getByRole('combobox', { name: 'Category' }).click();
    await expect(page.getByRole('option', { name: 'Plates (2)' })).toBeVisible();
    await page.keyboard.press('Escape');
    await page.getByRole('combobox', { name: 'Color' }).click();
    await page.getByRole('option', { name: 'Red (1)' }).click();
    await expect(page.getByText(/^1 part/)).toBeVisible();
    await expect(tile(page, 'Plate 1 x 2', 'Red')).toBeVisible();
    await expect(tile(page, 'Plate 2 x 4')).toHaveCount(0);
  });

  test('MISS-05 found 2 of 3 lowers the open quantity and records the found ones', async ({
    page,
    db,
  }) => {
    const { url } = await setup(db);
    await page.goto(url);
    const brick = tile(page, 'Brick 2 x 4', 'Black');
    await brick.getByRole('textbox', { name: /^Quantity of/ }).fill('3');
    await brick.getByRole('button', { name: /^Add 3/ }).click();
    await expect(openList(page).getByLabel('Quantity 3')).toBeVisible();

    await openList(page)
      .getByRole('button', { name: /^Found: Brick 2 x 4/ })
      .click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('How many?').fill('2');
    await dialog.getByRole('button', { name: 'Found' }).click();
    await expect(dialog).toBeHidden();
    await expect(openList(page).getByLabel('Quantity 1')).toBeVisible();
    await page.getByText('Resolved (1)').click();
    await expect(page.locator('details').getByText('Found', { exact: true })).toBeVisible();
    const rows =
      await db.sql`select quantity, resolution from copy_missing_items order by resolved_at nulls first`;
    expect(rows.map((r) => [r.quantity, r.resolution])).toEqual([
      [1, null],
      [2, 'found'],
    ]);

    // A single piece resolves straight away, with no dialog.
    await openList(page)
      .getByRole('button', { name: /^Bought: Brick 2 x 4/ })
      .click();
    await expect(page.getByText('Nothing is listed as missing from this copy.')).toBeVisible();
    await expect(page.getByText('Resolved (2)')).toBeVisible();
  });

  test('MISS-06 removing a row is a real delete with an audit entry', async ({ page, db }) => {
    const { url } = await setup(db);
    await page.goto(url);
    await tile(page, 'Plate 1 x 2', 'Red')
      .getByRole('button', { name: /^Add 1/ })
      .click();
    await expect(openList(page).getByText('Plate 1 x 2')).toBeVisible();
    await openList(page).getByRole('button', { name: 'Remove', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Remove' }).click();
    await expect(page.getByText('Nothing is listed as missing from this copy.')).toBeVisible();
    expect(await db.count('copy_missing_items')).toBe(0);
    expect(await db.count('audit_log', "entity_type = 'missing_item' and action = 'delete'")).toBe(
      1,
    );
  });

  test('MISS-07 minifigs, the whole catalog (with colours known first) and free-text pieces', async ({
    page,
    db,
  }) => {
    const { url } = await setup(db);
    await page.goto(url);

    await page.getByRole('tab', { name: 'Minifigs' }).click();
    await expect(page.getByText('In the set: ×3')).toBeVisible();
    await page.getByRole('button', { name: 'Add Captain' }).click();
    await expect(openList(page).getByText('Captain')).toBeVisible();

    await page.getByRole('tab', { name: 'Whole catalog' }).click();
    await page.getByLabel('Search parts').fill('clip');
    await page
      .getByRole('list', { name: 'Part matches' })
      .getByRole('button', { name: /Plate, Modified 1 x 1 with Clip/ })
      .click();
    await page.getByRole('combobox', { name: 'Color' }).click();
    await page.getByRole('option', { name: /^Black/ }).click();
    await page.getByLabel('How many?').fill('4');
    await page.getByRole('button', { name: 'Add to missing' }).click();
    await expect(
      page
        .getByRole('status')
        .filter({ hasText: 'Added 4 × Plate, Modified 1 x 1 with Clip, Black' }),
    ).toBeVisible();

    // Parts known in some colours list them first.
    await page.getByLabel('Search parts').fill('3001');
    await page
      .getByRole('list', { name: 'Part matches' })
      .getByRole('button', { name: /Brick 2 x 4/ })
      .click();
    await page.getByRole('combobox', { name: 'Color' }).click();
    await expect(page.getByRole('option').first()).toContainText('Black');
    await expect(
      page.getByRole('option', { name: /White \(not seen in this part\)/ }),
    ).toBeVisible();
    await page.keyboard.press('Escape');

    await page.getByRole('tab', { name: 'Other' }).click();
    await page.getByLabel('What is missing?').fill('Sticker sheet');
    await page.getByRole('button', { name: 'Add to missing' }).click();
    await expect(openList(page).getByText('Sticker sheet')).toBeVisible();
    const kinds =
      await db.sql`select kind, from_inventory from copy_missing_items order by created_at`;
    expect(kinds.map((k) => [k.kind, k.from_inventory])).toEqual([
      ['minifig', true],
      ['part', false],
      ['other', false],
    ]);
  });

  test('MISS-08 "Everything else is here" marks the pieces checked today, in the viewer’s own day', async ({
    page,
    db,
  }) => {
    const { url } = await setup(db);
    await page.goto(url);
    await expect(page.getByText('Not checked')).toBeVisible();
    await page.getByRole('button', { name: 'Everything else is here' }).click();
    const local = await page.evaluate(() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    });
    await expect(page.getByText(`Pieces last checked ${local}.`)).toBeVisible();
    await expect(page.getByText(/Complete \(checked/)).toBeVisible();
    const [copy] = await db.sql`select pieces_checked_on::text as d from copies`;
    expect(copy!.d).toBe(local);
  });

  test('MISS-09 a sealed copy says so, and still reads Sealed in the library', async ({
    page,
    db,
  }) => {
    const { url } = await setup(db, { buildState: 'sealed' });
    await page.goto(url);
    await expect(page.getByText(/marked Sealed/)).toBeVisible();
    await tile(page, 'Plate 1 x 2', 'Red')
      .getByRole('button', { name: /^Add 1/ })
      .click();
    await expect(openList(page).getByText('Plate 1 x 2')).toBeVisible();
    await page.goto('/sets');
    await expect(
      page.getByRole('listitem').filter({ hasText: 'Titanic' }).getByText('Sealed'),
    ).toBeVisible();
    await expect(page.getByText(/^Missing \d/)).toHaveCount(0);
  });

  test('MISS-10 kids can read the list but not change it, and hidden sets look unknown', async ({
    kidPage,
    page,
    db,
  }) => {
    const { setId, copyId, url } = await setup(db);
    await page.goto(url);
    await tile(page, 'Plate 1 x 2', 'Red')
      .getByRole('button', { name: /^Add 1/ })
      .click();
    await expect(openList(page).getByText('Plate 1 x 2')).toBeVisible();

    await kidPage.goto(`/sets/${setId}`);
    await kidPage.getByRole('link', { name: /Missing 1 piece/ }).click();
    await expect(kidPage.getByRole('heading', { name: 'Missing pieces', level: 1 })).toBeVisible();
    await expect(kidPage.getByText('Plate 1 x 2')).toBeVisible();
    for (const name of ['Found', 'Bought', 'Substituted', 'Remove', 'Everything else is here']) {
      await expect(kidPage.getByRole('button', { name: new RegExp(`^${name}`) })).toHaveCount(0);
    }
    await expect(kidPage.getByRole('heading', { name: 'Add missing pieces' })).toHaveCount(0);
    expect((await kidPage.request.get(`/api/copies/${copyId}/inventory`)).status()).toBe(403);
    expect((await kidPage.request.get('/api/parts/search?q=plate')).status()).toBe(403);

    await db.sql`update sets set hidden_from_restricted = true where id = ${setId}`;
    await kidPage.goto(url);
    await expect(kidPage.getByText('not in the bin')).toBeVisible();
    expect((await kidPage.request.get(`/api/copies/${copyId}/inventory`)).status()).toBe(403);
  });

  test('MISS-11 sets without a catalog link only offer the whole catalog and Other; a trashed copy is gone', async ({
    page,
    db,
  }) => {
    await db.seedCatalog();
    const id = await db.seedSet({
      name: 'Crane',
      brand: 'Mould King',
      copies: [{ buildState: 'built' }],
    });
    const copyId = await db.firstCopyId(id);
    await page.goto(`/copies/${copyId}/missing`);
    await expect(page.getByRole('tab', { name: 'Set parts' })).toHaveCount(0);
    await expect(page.getByRole('tab', { name: 'Whole catalog' })).toBeVisible();
    await expect(page.getByText(/Most off-brand parts follow the same shapes/)).toBeVisible();

    await db.sql`update copies set deleted_at = now() where id = ${copyId}`;
    await page.goto(`/copies/${copyId}/missing`);
    await expect(page.getByText('not in the bin')).toBeVisible();
    await page.goto('/copies/not-a-uuid/missing');
    await expect(page.getByText('not in the bin')).toBeVisible();
  });

  test('MISS-12 part pictures come from the app, labelled when shown in another colour', async ({
    page,
    db,
  }) => {
    const { url } = await setup(db);
    await db.seedPartImage(4, '3001'); // Red brick image only
    await db.seedPartImage(0, '3023'); // Black plate image only
    await page.goto(url);
    const black = tile(page, 'Brick 2 x 4', 'Black');
    await expect(black).toContainText('Picture is in another color'); // shown in Red
    await expect(black.locator('img')).toHaveAttribute('src', '/api/part-image/4/3001');
    const red = tile(page, 'Plate 1 x 2', 'Red');
    await expect(red.locator('img')).toHaveAttribute('src', '/api/part-image/0/3023');
    // No third-party image is ever requested by the browser.
    const hosts = await page.evaluate(() => [...document.images].map((i) => new URL(i.src).host));
    expect(new Set(hosts)).toEqual(new Set([new URL(page.url()).host]));
  });
});
