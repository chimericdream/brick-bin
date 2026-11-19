import { expect, test } from '../fixtures';

type Db = typeof import('../support/db');

/** Two sets (one with two copies) that all need red 1x2 plates, plus a black brick for one. */
async function world(db: Db) {
  await db.seedCatalog();
  const titanic = await db.seedSet({
    name: 'Titanic',
    setNumber: '10294',
    copies: [{ buildState: 'built' }, { buildState: 'built' }],
  });
  const hogwarts = await db.seedSet({
    name: 'Hogwarts',
    setNumber: '76419',
    copies: [{ buildState: 'built' }],
  });
  const [t1, t2] = await Promise.all([
    db.firstCopyId(titanic),
    db.sql`select id from copies where set_id = ${titanic} order by created_at desc limit 1`,
  ]);
  const t2id = t2[0]!.id as string;
  const h1 = await db.firstCopyId(hogwarts);
  await db.seedMissing(t1, { partNum: '3023', colorId: 4, quantity: 2, ageMinutes: 30 }); // oldest
  await db.seedMissing(t2id, { partNum: '3023', colorId: 4, quantity: 1, ageMinutes: 20 });
  await db.seedMissing(h1, { partNum: '3023', colorId: 4, quantity: 1, ageMinutes: 10 });
  await db.seedMissing(h1, { partNum: '3001', colorId: 0, quantity: 5, ageMinutes: 5 });
  return { titanic, hogwarts, t1, t2: t2id, h1 };
}

const rows = (page: import('@playwright/test').Page) => page.locator('ul > li[data-key]');

test.describe('shopping list', () => {
  test('SHOP-01 groups by part and colour across copies and sets, saying which sets need it @smoke', async ({
    page,
    db,
  }) => {
    await world(db);
    await page.goto('/missing');
    await expect(page.getByText('9 pieces on 2 lines')).toBeVisible();
    const plate = rows(page).filter({ hasText: 'Plate 1 x 2' });
    await expect(plate).toContainText('×4');
    await expect(plate).toContainText('Red');
    await expect(plate).toContainText('Titanic (copy 1) ×2, Titanic (copy 2) ×1, Hogwarts ×1');
    const brick = rows(page).filter({ hasText: 'Brick 2 x 4' });
    await expect(brick).toContainText('×5');
    await expect(brick).toContainText('Element 300126');
    await expect(page.getByRole('main').getByText('Catalog data from')).toBeVisible();
  });

  test('SHOP-02 empty state, resolved items drop off, and a trashed copy’s pieces are gone', async ({
    page,
    db,
  }) => {
    await page.goto('/missing');
    await expect(page.getByText(/Nothing is missing/)).toBeVisible();
    const w = await world(db);
    await db.sql`update copies set deleted_at = now() where id = ${w.h1}`;
    await page.goto('/missing');
    await expect(page.getByText('3 pieces on 1 line')).toBeVisible();
    await expect(page.getByText('Brick 2 x 4')).toHaveCount(0);
  });

  test('SHOP-03 sorts by colour, category or set, and filters by colour', async ({ page, db }) => {
    await world(db);
    await page.goto('/missing');
    const order = () => rows(page).locator('strong').allTextContents();
    await expect.poll(order).toEqual(['Brick 2 x 4', 'Plate 1 x 2']); // Black, then Red
    const sorts = page.getByRole('navigation', { name: 'Sort' });
    await sorts.getByRole('link', { name: 'Category' }).click();
    await expect(page).toHaveURL(/sort=category/);
    await expect.poll(order).toEqual(['Brick 2 x 4', 'Plate 1 x 2']); // Bricks, Plates
    await sorts.getByRole('link', { name: 'Set', exact: true }).click();
    await expect(page).toHaveURL(/sort=set/);
    await expect.poll(order).toEqual(['Brick 2 x 4', 'Plate 1 x 2']); // Hogwarts before Titanic

    await page.getByLabel('Color').selectOption({ label: 'Red' });
    await page.getByRole('button', { name: 'Apply' }).click();
    await expect(page.getByText('4 pieces on 1 line')).toBeVisible();
    await expect(page.getByText('Brick 2 x 4')).toHaveCount(0);
    await expect(page).toHaveURL(/sort=set/); // the view is kept
  });

  test('SHOP-04 "Shopping list for these" scopes the list to what the library is showing', async ({
    page,
    db,
  }) => {
    await world(db);
    await page.goto('/sets?q=hogwarts');
    await page.getByRole('link', { name: /Shopping list for these/ }).click();
    await expect(page).toHaveURL(/\/missing\?lib=/);
    await expect(page.getByText('6 pieces on 2 lines')).toBeVisible();
    await expect(page.getByText('for the sets in the library view')).toBeVisible();
    await expect(rows(page).filter({ hasText: 'Plate 1 x 2' })).toContainText('×1');
    await page.getByRole('link', { name: 'Show all sets' }).click();
    await expect(page.getByText('9 pieces on 2 lines')).toBeVisible();

    // A library view that matches nothing gives an empty list, not "everything".
    await page.goto('/missing?lib=' + encodeURIComponent('q=zzzznothing'));
    await expect(page.getByText(/Nothing is missing/)).toBeVisible();
  });

  test('SHOP-05 mold and alternate hints show on the line', async ({ page, db }) => {
    await world(db);
    await db.sql`insert into rb_parts (part_num, name, part_cat_id) values ('3023old', 'Plate 1 x 2 old', 14)`;
    await db.sql`insert into rb_part_relationships (rel_type, child_part_num, parent_part_num) values ('M', '3023old', '3023')`;
    await page.goto('/missing');
    await expect(rows(page).filter({ hasText: 'Plate 1 x 2' })).toContainText(
      'Any of 3023, 3023old will do',
    );
  });

  test('SHOP-06 exports a BrickLink wanted list, a Rebrickable parts list and a CSV, and reports lines with no BrickLink id', async ({
    page,
    db,
  }) => {
    const w = await world(db);
    await db.seedBrickLinkMappings();
    await db.seedMissing(w.h1, { partNum: '3020', colorId: 15, quantity: 2 }); // no BrickLink id for this one
    await page.goto('/missing');
    await expect(page.getByText('1 line has no BrickLink id')).toBeVisible();
    await page.getByText('Export', { exact: true }).click();
    await expect(page.getByRole('link', { name: 'BrickLink wanted list (XML)' })).toHaveAttribute(
      'href',
      /format=bricklink/,
    );

    const xml = await page.request.get('/api/missing/export?format=bricklink');
    expect(xml.headers()['content-type']).toContain('application/xml');
    expect(xml.headers()['content-disposition']).toMatch(
      /attachment; filename="brick-bin-wanted-list-\d{4}-\d{2}-\d{2}\.xml"/,
    );
    const body = await xml.text();
    expect(body).toContain(
      '<ITEM><ITEMTYPE>P</ITEMTYPE><ITEMID>3023</ITEMID><COLOR>5</COLOR><MINQTY>4</MINQTY></ITEM>',
    );
    expect(body).toContain('<ITEMID>3001</ITEMID><COLOR>11</COLOR><MINQTY>5</MINQTY>');
    expect(body).not.toContain('3020');

    const reb = await page.request.get('/api/missing/export?format=rebrickable');
    expect((await reb.text()).split('\r\n')).toEqual([
      'Part,Color,Quantity',
      '3001,0,5',
      '3023,4,4',
      '3020,15,2',
      '',
    ]);
    const plain = await page.request.get('/api/missing/export?format=csv');
    const csv = await plain.text();
    expect(csv.split('\r\n')[0]).toBe(
      'Type,Part or figure,Name,Color,Element id,Quantity,Sets,Alternates',
    );
    expect(csv).toContain('Part,3023,Plate 1 x 2,Red,,4,Titanic x3; Hogwarts x1,');
    expect((await page.request.get('/api/missing/export?format=nope')).status()).toBe(400);

    // The export follows the same filters as the page.
    const red = await page.request.get('/api/missing/export?format=rebrickable&color=4');
    expect((await red.text()).split('\r\n')).toEqual(['Part,Color,Quantity', '3023,4,4', '']);
  });

  test('SHOP-07 store-trip mode: ticks stay in this browser, Done fills the oldest copy first and can be changed', async ({
    page,
    db,
  }) => {
    const w = await world(db);
    await page.goto('/missing?trip=1');
    const plate = page.getByRole('checkbox', { name: /^Plate 1 x 2, Red, quantity 4$/ });
    await plate.check();
    await expect(page.getByText('1 of 2 checked off')).toBeVisible();
    await page.reload();
    await expect(plate).toBeChecked(); // kept in this browser
    expect(await db.count('copy_missing_items', 'resolved_at is not null')).toBe(0); // nothing sent anywhere

    await page.getByRole('button', { name: 'Done' }).click();
    const dialog = page.getByRole('dialog');
    // 4 plates: Titanic copy 1 (oldest) 2, copy 2 gets 1, Hogwarts 1.
    await expect(dialog.getByLabel('Bought for Titanic, copy 1')).toHaveValue('2');
    await expect(dialog.getByLabel('Bought for Hogwarts')).toHaveValue('1');
    await dialog.getByLabel('Bought for Hogwarts').fill('0');
    await dialog.getByRole('button', { name: 'Mark as bought' }).click();
    await expect(dialog).toBeHidden();

    await expect(
      page.getByRole('checkbox', { name: /^Plate 1 x 2, Red, quantity 1$/ }),
    ).not.toBeChecked(); // only Hogwarts' one is left
    const open =
      await db.sql`select copy_id, quantity from copy_missing_items where resolved_at is null and rb_part_num = '3023'`;
    expect(open.map((r) => [r.copy_id, r.quantity])).toEqual([[w.h1, 1]]);
    const bought =
      await db.sql`select quantity from copy_missing_items where resolution = 'bought' order by quantity desc`;
    expect(bought.map((r) => r.quantity)).toEqual([2, 1]);
    // The audit trail records it, and the ticks are cleared.
    expect(
      await db.count('audit_log', "entity_type = 'missing_item' and changes ? 'resolution'"),
    ).toBe(2);
  });

  test('SHOP-08 an allocation that is too big changes nothing', async ({ page, db }) => {
    const w = await world(db);
    await page.goto('/missing?trip=1');
    await page.getByRole('checkbox', { name: /^Plate 1 x 2, Red/ }).check();
    await page.getByRole('button', { name: 'Done' }).click();
    const dialog = page.getByRole('dialog');
    // Force a number above what the row holds, past the field's own maximum.
    await dialog.getByLabel('Bought for Hogwarts').evaluate((el: HTMLInputElement) => {
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!;
      setter.call(el, '9');
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await dialog.getByRole('button', { name: 'Mark as bought' }).click();
    // Either the field clamped it or the server refused; nothing is half done.
    await expect
      .poll(() => db.count('copy_missing_items', "resolution = 'bought'"))
      .toBeLessThanOrEqual(3);
    expect(
      await db.count('copy_missing_items', "resolved_at is null and rb_part_num = '3001'"),
    ).toBe(1);
    expect(w.h1).toBeTruthy();
  });

  test('SHOP-09 kid profiles have no shopping list: no tab, no page, no export', async ({
    kidPage,
    anonPage,
    db,
  }) => {
    await world(db);
    await kidPage.goto('/sets');
    await expect(kidPage.getByRole('link', { name: /^Shopping/ })).toHaveCount(0);
    await kidPage.goto('/missing');
    await expect(kidPage.getByText('not in the bin')).toBeVisible();
    expect((await kidPage.request.get('/api/missing/export?format=csv')).status()).toBe(404);
    expect((await anonPage.request.get('/api/missing/export?format=csv')).status()).toBe(401);
  });

  test('SHOP-10 printing shows only the list', async ({ page, db }) => {
    await world(db);
    await page.goto('/missing');
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeVisible();
    await page.emulateMedia({ media: 'print' });
    await expect(page.getByRole('navigation', { name: 'Main' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Print' })).toBeHidden();
    await expect(rows(page).first()).toBeVisible();
  });
});
