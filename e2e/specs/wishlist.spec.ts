import { expect, test } from '../fixtures';
import { ADMIN, KID, MEMBER } from '../support/roles';

const SECRET = 'Hidden behind the boiler AZURE-7';
const MONEY = /\$\d[\d,]*\.\d{2}/;

test.describe('wishlist', () => {
  test('WISH-01 adds a wish by hand to my own list @smoke', async ({ memberPage: page, db }) => {
    await page.goto('/wishlist');
    await page.getByRole('textbox', { name: /^Name/ }).fill('Treehouse');
    await page.getByLabel('Price seen').fill('59.99');
    await page.getByLabel('Notes for gift-givers').fill('the green one');
    await page.getByRole('button', { name: 'Add to my wishlist' }).click();
    await expect(page.getByText('Added to your wishlist.')).toBeVisible();
    const mine = page.getByRole('region', { name: 'My wishlist', exact: true });
    await expect(mine).toContainText('Treehouse');
    await expect(mine).toContainText('$59.99');
    expect(await db.count('audit_log', "entity_type = 'wishlist_item' and action = 'create'")).toBe(
      1,
    );
  });

  test('WISH-02 picking a catalog set prefills the wish and downloads its cover once', async ({
    memberPage: page,
    db,
    rebrickable,
  }) => {
    await db.seedCatalog();
    await page.goto('/wishlist');
    await page.getByLabel('Set number or name').fill('titan');
    await page
      .getByRole('list', { name: 'Catalog matches' })
      .getByRole('button', { name: /Titanic/ })
      .click();
    await expect(page.getByRole('textbox', { name: /^Name/ })).toHaveValue('Titanic');
    await page.getByRole('button', { name: 'Add to my wishlist' }).click();
    await expect(page.getByText('Added to your wishlist.')).toBeVisible();
    expect(rebrickable.count('/media/sets/')).toBe(1);
    const img = page.getByRole('region', { name: 'My wishlist', exact: true }).locator('img');
    await expect(img).toBeVisible();
    const res = await page.request.get((await img.getAttribute('src'))!);
    expect(res.status()).toBe(200);
  });

  test('WISH-03 the catalog search says who already wants a set', async ({ page, db }) => {
    await db.seedCatalog();
    await db.seedWish(MEMBER.email, 'Titanic', { rbSetNum: '10294-1' });
    await page.goto('/wishlist');
    await page.getByLabel('Set number or name').fill('titan');
    await expect(page.getByRole('list', { name: 'Catalog matches' })).toContainText(
      'On Mo Member’s wishlist',
    );
  });

  test('WISH-04 only the owner or an admin can edit or remove a wish; removing is a trash round trip', async ({
    page,
    memberPage,
    db,
  }) => {
    await db.seedWish(MEMBER.email, 'Mo wish');
    await db.seedWish(ADMIN.email, 'Ada wish');
    await memberPage.goto('/wishlist');
    const adas = memberPage.getByRole('region', { name: 'Ada Admin’s wishlist' });
    await expect(adas).toContainText('Ada wish');
    await expect(adas.getByRole('button', { name: 'Edit' })).toHaveCount(0);
    await expect(adas.getByRole('button', { name: 'Remove' })).toHaveCount(0);

    await page.goto('/wishlist');
    const mos = page.getByRole('region', { name: 'Mo Member’s wishlist' });
    await mos.getByRole('button', { name: 'Edit' }).click();
    await page.getByRole('dialog').getByRole('textbox', { name: /^Name/ }).fill('Renamed by Ada');
    await page.getByRole('button', { name: 'Save wish' }).click();
    await expect(mos).toContainText('Renamed by Ada');
    await mos.getByRole('button', { name: 'Remove' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Move to trash' }).click();
    await expect(page.getByText('Renamed by Ada')).toHaveCount(0);
    await page.goto('/settings/trash');
    await expect(page.getByText('Renamed by Ada')).toBeVisible();
  });

  test('WISH-05 "I bought this" is private: only its maker sees it, anywhere @smoke', async ({
    page,
    memberPage,
    kidPage,
    db,
  }) => {
    // Ada buys for Mo. Mo, Kit and every page they can open must never show it.
    await db.seedWish(MEMBER.email, 'Secret gift');
    await page.goto('/wishlist');
    const row = page.getByRole('listitem').filter({ hasText: 'Secret gift' });
    await row.getByRole('button', { name: 'I bought this' }).click();
    await page.getByLabel('Note to yourself').fill(SECRET);
    await page.getByRole('button', { name: 'Mark as bought' }).click();
    await expect(row.getByText(/You bought this on/)).toBeVisible();
    await expect(row).toContainText(SECRET);

    // No audit row beyond nothing, and the mark is one private row.
    expect(await db.count('audit_log', "entity_type = 'wishlist_item'")).toBe(0);
    expect(await db.count('wishlist_purchases')).toBe(1);

    for (const [who, p] of [
      ['requester', memberPage],
      ['kid', kidPage],
    ] as const) {
      for (const url of ['/wishlist', '/settings/activity', '/settings/trash', '/sets']) {
        const res = await p.goto(url);
        const html = res ? await res.text() : '';
        expect(html, `${who} ${url}`).not.toContain('AZURE-7');
        expect(html, `${who} ${url}`).not.toContain('You bought this');
      }
    }
    // Ada's own activity page does not name it either.
    await page.goto('/settings/activity');
    expect(await page.content()).not.toContain('AZURE-7');

    // Undo removes it.
    await page.goto('/wishlist');
    await row.getByRole('button', { name: 'Undo' }).click();
    await expect(row.getByRole('button', { name: 'I bought this' })).toBeVisible();
    expect(await db.count('wishlist_purchases')).toBe(0);
  });

  test('WISH-06 a bought item that is removed shows under "Removed from the list" to its buyer only', async ({
    page,
    memberPage,
    db,
  }) => {
    await db.seedWish(MEMBER.email, 'Vanishing gift');
    await page.goto('/wishlist');
    const row = page.getByRole('listitem').filter({ hasText: 'Vanishing gift' });
    await row.getByRole('button', { name: 'I bought this' }).click();
    await page.getByRole('button', { name: 'Mark as bought' }).click();
    await expect(row.getByText(/You bought this on/)).toBeVisible();

    await memberPage.goto('/wishlist');
    await memberPage
      .getByRole('listitem')
      .filter({ hasText: 'Vanishing gift' })
      .getByRole('button', { name: 'Remove' })
      .click();
    await memberPage.getByRole('dialog').getByRole('button', { name: 'Move to trash' }).click();
    await expect(memberPage.getByText('Vanishing gift')).toHaveCount(0);
    await expect(memberPage.getByRole('heading', { name: 'Removed from the list' })).toHaveCount(0);

    await page.goto('/wishlist');
    const removed = page.getByRole('region', { name: 'Removed from the list' });
    await expect(removed).toContainText('Vanishing gift');
    await removed.getByRole('button', { name: 'Dismiss' }).click();
    await expect(page.getByRole('heading', { name: 'Removed from the list' })).toHaveCount(0);
  });

  test('WISH-07 "We got it" creates the set and copy, carries the cover, deletes marks and can hide it from kids', async ({
    page,
    kidPage,
    db,
    rebrickable,
  }) => {
    await db.seedCatalog();
    await db.seedWish(MEMBER.email, 'Titanic', { rbSetNum: '10294-1' });
    await page.goto('/wishlist');
    const row = page.getByRole('listitem').filter({ hasText: 'Titanic' });
    await row.getByRole('button', { name: 'I bought this' }).click();
    await page.getByRole('button', { name: 'Mark as bought' }).click();
    await expect(row.getByText(/You bought this on/)).toBeVisible();

    await row.getByRole('button', { name: 'We got it' }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toContainText('everyone in the household can see it');
    await dialog.getByLabel('Hide it from kid profiles for now').check();
    await dialog.getByRole('button', { name: 'Add to the collection' }).click();

    await expect(page.getByRole('heading', { name: 'Titanic', level: 1 })).toBeVisible();
    const [set] =
      await db.sql`select hidden_from_restricted, year, piece_count, cover_image from sets`;
    expect(set).toMatchObject({ hidden_from_restricted: true, year: 2021, piece_count: 9092 });
    expect(set!.cover_image).toBeTruthy();
    expect(await db.count('copies')).toBe(1);
    expect(await db.count('wishlist_purchases')).toBe(0);
    expect(rebrickable.count('/media/sets/')).toBe(1);

    await kidPage.goto('/sets');
    await expect(kidPage.getByText('Titanic')).toHaveCount(0);
    await page.goto('/wishlist');
    await expect(page.getByText('Titanic')).toHaveCount(0);
  });

  test('WISH-08 kid profiles see and edit only their own list, with no prices and no buying', async ({
    kidPage,
    page,
    db,
  }) => {
    await db.seedWish(MEMBER.email, 'Grown-up wish', { priceCents: 123_456, notes: 'adult only' });
    await db.seedWish(KID.email, 'Kit wish', { priceCents: 4_000 });
    await kidPage.goto('/wishlist');
    const html = await kidPage.content();
    expect(html).not.toContain('Grown-up wish');
    expect(html).not.toContain('adult only');
    expect(html).not.toMatch(MONEY);
    await expect(kidPage.getByLabel('Price seen')).toHaveCount(0);
    await expect(kidPage.getByRole('button', { name: 'I bought this' })).toHaveCount(0);
    await expect(kidPage.getByRole('button', { name: 'We got it' })).toHaveCount(0);

    await kidPage.getByRole('textbox', { name: /^Name/ }).fill('Dragon');
    await kidPage.getByRole('button', { name: 'Add to my wishlist' }).click();
    await expect(kidPage.getByRole('region', { name: 'My wishlist', exact: true })).toContainText(
      'Dragon',
    );

    // Admins see the kid's list, including the price an adult entered.
    await page.goto('/wishlist');
    await expect(page.getByRole('region', { name: 'Kit Kid’s wishlist' })).toContainText('$40.00');
  });

  test('WISH-09 the cover route follows visibility', async ({ page, kidPage, anonPage, db }) => {
    const id = await db.seedWish(MEMBER.email, 'No cover yet');
    expect((await anonPage.request.get(`/api/wishlist/${id}/cover`)).status()).toBe(401);
    expect((await page.request.get(`/api/wishlist/${id}/cover`)).status()).toBe(404);
    expect((await kidPage.request.get(`/api/wishlist/${id}/cover`)).status()).toBe(404);
    expect((await page.request.get('/api/wishlist/not-an-id/cover')).status()).toBe(404);
  });

  test('WISH-10 an empty list explains itself', async ({ page }) => {
    await page.goto('/wishlist');
    await expect(page.getByText('Nothing on your list yet.')).toBeVisible();
  });
});
