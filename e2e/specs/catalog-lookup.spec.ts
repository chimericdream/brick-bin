import { existsSync } from 'node:fs';

import { choose, label } from '../support/mantine';
import { coverPath } from '../support/db';
import { expect, test } from '../fixtures';

const lookup = (page: import('@playwright/test').Page) => page.getByLabel('Set number or name');

test.describe('LEGO catalog lookup', () => {
  test('CATL-01 explains that lookup is off until the catalog is imported', async ({
    page,
    memberPage,
  }) => {
    await page.goto('/sets/new');
    await expect(page.getByText('The catalog has not been imported yet')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Import it in Settings' })).toBeVisible();
    // The manual form still works underneath.
    await expect(page.getByLabel(label('Name'))).toBeVisible();
    await memberPage.goto('/sets/new');
    await expect(memberPage.getByText('Ask an admin to import it.')).toBeVisible();
  });

  test('CATL-02 picking a result prefills the form; saving links the set, adds the theme and downloads the cover once @smoke', async ({
    page,
    db,
    rebrickable,
  }) => {
    await db.seedCatalog();
    await page.goto('/sets/new');
    await lookup(page).fill('titan');
    const list = page.getByRole('list', { name: 'Catalog matches' });
    await expect(list.getByRole('button', { name: /Titanic/ })).toBeVisible();
    // Typing alone fetched no image.
    expect(rebrickable.count('/media/sets/')).toBe(0);

    await list.getByRole('button', { name: /Titanic/ }).click();
    await expect(page.getByText('Linked to Rebrickable set 10294-1')).toBeVisible();
    await expect(page.getByLabel(label('Name'))).toHaveValue('Titanic');
    await expect(page.getByLabel('Set number', { exact: true })).toHaveValue('10294');
    await expect(page.getByLabel(label('Year'))).toHaveValue('2021');
    await expect(page.getByLabel(label('Pieces'))).toHaveValue('9,092');
    await page.getByLabel('Add a copy I own').uncheck();
    await page.getByRole('button', { name: 'Add set' }).click();

    await expect(page.getByRole('heading', { name: 'Titanic', level: 1 })).toBeVisible();
    await expect(page.getByText('Linked to Rebrickable 10294-1')).toBeVisible();
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Icons');

    const [set] = await db.sql`select rb_set_num, cover_image, theme_id, set_number from sets`;
    expect(set).toMatchObject({ rb_set_num: '10294-1', set_number: '10294' });
    expect(existsSync(coverPath(set!.cover_image as string))).toBe(true);
    const [theme] = await db.sql`select name, rb_theme_id from themes where id = ${set!.theme_id}`;
    expect(theme).toMatchObject({ name: 'Icons', rb_theme_id: 721 });
    expect(rebrickable.count('/media/sets/')).toBe(1);
    expect(rebrickable.requests.find((r) => r.path.includes('/media/sets/'))?.userAgent).toMatch(
      /^BrickBin\//,
    );
  });

  test('CATL-03 a set under a child theme creates the whole theme chain, once', async ({
    page,
    db,
  }) => {
    await db.seedCatalog();
    for (const n of [1, 2]) {
      await page.goto('/sets/new');
      await lookup(page).fill('75192');
      await page.getByRole('button', { name: /Millennium Falcon/ }).click();
      await page.getByLabel('Set number', { exact: true }).fill(n === 1 ? '75192' : '75192b');
      await page.getByLabel('Add a copy I own').uncheck();
      await page.getByRole('button', { name: 'Add set' }).click();
      await expect(
        page.getByRole('heading', { name: 'Millennium Falcon', level: 1 }),
      ).toBeVisible();
    }
    const themes =
      await db.sql`select name, parent_id is not null as nested from themes order by name`;
    expect(themes.map((t) => [t.name, t.nested])).toEqual([
      ['Star Wars', false],
      ['Ultimate Collector Series', true],
    ]);
  });

  test('CATL-04 reports no match, and a missing cover never stops a set from saving', async ({
    page,
    db,
    rebrickable,
  }) => {
    await db.seedCatalog();
    rebrickable.coverStatus = 404;
    await page.goto('/sets/new');
    await lookup(page).fill('zzzzzz');
    await expect(page.getByText('No match in the catalog')).toBeVisible();

    await lookup(page).fill('titanic');
    await page.getByRole('button', { name: /Titanic/ }).click();
    await page.getByLabel('Add a copy I own').uncheck();
    await page.getByRole('button', { name: 'Add set' }).click();
    await expect(page.getByRole('heading', { name: 'Titanic', level: 1 })).toBeVisible();
    const [set] = await db.sql`select cover_image from sets`;
    expect(set!.cover_image).toBeNull();
  });

  test('CATL-05 an uploaded cover wins over the catalog one, which is then never downloaded', async ({
    page,
    db,
    rebrickable,
  }) => {
    await db.seedCatalog();
    await page.goto('/sets/new');
    await lookup(page).fill('titanic');
    await page.getByRole('button', { name: /Titanic/ }).click();
    await page.locator('input[type=file][name=cover]').setInputFiles({
      name: 'mine.png',
      mimeType: 'image/png',
      buffer: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR4nGP4z8DwHwAFAAH/q842iQAAAABJRU5ErkJggg==',
        'base64',
      ),
    });
    await page.getByLabel('Add a copy I own').uncheck();
    await page.getByRole('button', { name: 'Add set' }).click();
    await expect(page.getByRole('heading', { name: 'Titanic', level: 1 })).toBeVisible();
    expect(rebrickable.count('/media/sets/')).toBe(0);
    const [set] = await db.sql`select cover_image from sets`;
    expect(set!.cover_image).not.toBeNull();
  });

  test('CATL-06 re-sync shows a diff, updates only what is ticked, and keeps a chosen cover unless told otherwise', async ({
    page,
    db,
    rebrickable,
  }) => {
    await db.seedCatalog();
    const id = await db.seedSet({
      name: 'Old name',
      setNumber: '10294',
      year: 2020,
      pieceCount: 100,
      cover: true,
    });
    await db.sql`update sets set rb_set_num = '10294-1' where id = ${id}`;
    const before = (await db.sql`select cover_image from sets where id = ${id}`)[0]!.cover_image;

    await page.goto(`/sets/${id}`);
    await page.getByRole('button', { name: 'Re-sync from catalog' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog.getByText('Old name → Titanic')).toBeVisible();
    await expect(dialog.getByText('2020 → 2021')).toBeVisible();
    await expect(dialog.getByText('100 → 9092')).toBeVisible();
    await expect(dialog.getByText('empty → Icons')).toBeVisible();

    await dialog.getByLabel(/Year/).uncheck();
    await dialog.getByLabel('Also download the catalog cover').check();
    await dialog.getByRole('button', { name: 'Update' }).click();
    await expect(dialog.getByText('Updated from the catalog.')).toBeVisible();

    const [row] =
      await db.sql`select name, year, piece_count, cover_image from sets where id = ${id}`;
    expect(row).toMatchObject({ name: 'Titanic', year: 2020, piece_count: 9092 });
    // The existing cover was not replaced without an explicit yes.
    expect(row!.cover_image).toBe(before);
    expect(rebrickable.count('/media/sets/')).toBe(0);
  });

  test('CATL-07 a barcode finds the set, and kid profiles cannot use the lookup', async ({
    page,
    kidPage,
    db,
  }) => {
    await db.seedCatalog();
    const hit = await page.request.get('/api/lookup/upc?code=5702017189000');
    expect(await hit.json()).toMatchObject({
      title: 'LEGO Icons Titanic 10294 Building Kit',
      matches: [{ setNum: '10294-1', number: '10294', name: 'Titanic', year: 2021 }],
    });
    const none = await page.request.get('/api/lookup/upc?code=0000000000000');
    expect(await none.json()).toEqual({ title: null, matches: [] });
    expect((await kidPage.request.get('/api/lookup/upc?code=5702017189000')).status()).toBe(403);
  });

  test('CATL-08 part images use the exact colour, fall back with a label header, and need a session', async ({
    page,
    anonPage,
    db,
  }) => {
    await db.seedPartImage(15, '3001');
    await db.seedPartImage(71, '3023');
    const exact = await page.request.get('/api/part-image/15/3001');
    expect(exact.status()).toBe(200);
    expect(exact.headers()['content-type']).toBe('image/png');
    expect(exact.headers()['x-part-image-exact']).toBe('1');
    const fallback = await page.request.get('/api/part-image/0/3023');
    expect(fallback.headers()['x-part-image-color']).toBe('71');
    expect(fallback.headers()['x-part-image-exact']).toBe('0');
    expect((await page.request.get('/api/part-image/0/nothing')).status()).toBe(404);
    expect((await page.request.get('/api/part-image/abc/3001')).status()).toBe(404);
    expect((await page.request.get('/api/part-image/0/..%2F3001')).status()).toBe(404);
    expect((await anonPage.request.get('/api/part-image/15/3001')).status()).toBe(401);
  });

  test('CATL-09 off-brand sets never get a catalog link', async ({ page, db }) => {
    await db.seedCatalog();
    await page.goto('/sets/new');
    await expect(page.getByRole('list', { name: 'Catalog matches' })).toHaveCount(0);
    await page.getByRole('button', { name: 'New brand' }).click();
    await page.getByLabel(label('New brand')).fill('Mould King');
    await page.getByLabel(label('Name')).fill('Crawler Crane');
    await page.getByLabel('Add a copy I own').uncheck();
    await page.getByRole('button', { name: 'Add set' }).click();
    await expect(page.getByRole('heading', { name: 'Crawler Crane', level: 1 })).toBeVisible();
    const [set] = await db.sql`select rb_set_num from sets`;
    expect(set!.rb_set_num).toBeNull();
    expect(choose).toBeDefined();
  });
});
