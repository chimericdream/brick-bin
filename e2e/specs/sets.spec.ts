import { choose, formWith, label } from '../support/mantine';
import { expect, test } from '../fixtures';
import { KID, MEMBER } from '../support/roles';

test.describe('adding sets', () => {
  test('SET-01 adds a LEGO set with three copies at once @smoke', async ({ page, db }) => {
    await page.goto('/sets/new');
    await page.getByLabel(label('Name')).fill('Titanic');
    await page.getByLabel('Set number').fill('10294');
    await page.getByLabel(label('Pieces')).fill('9090');
    await page.getByLabel('How many?').fill('3');
    await page.getByRole('button', { name: 'Add set' }).click();

    await expect(page).toHaveURL(/\/sets\/[0-9a-f-]{36}$/);
    await expect(page.getByRole('heading', { name: 'Titanic', level: 1 })).toBeVisible();
    await expect(page.getByRole('heading', { name: /^Copies\s*3$/ })).toBeVisible();
    await expect(page.getByText('copy 1 of 3')).toBeVisible();
    expect(await db.count('copies')).toBe(3);
    expect(await db.count('audit_log', "entity_type = 'copy' and action = 'create'")).toBe(3);
  });

  test('SET-02 adds an off-brand set with a new brand and no copy', async ({ page, db }) => {
    await page.goto('/sets/new');
    await page.getByRole('button', { name: '+ New brand' }).click();
    await page.getByLabel(label('New brand')).fill('Mould King');
    await page.getByLabel(label('Name')).fill('Crawler Crane');
    await page.getByLabel('Add a copy I own').uncheck();
    await page.getByRole('button', { name: 'Add set' }).click();

    await expect(page.getByRole('heading', { name: 'Crawler Crane', level: 1 })).toBeVisible();
    await expect(page.getByText('No copies of this set.')).toBeVisible();
    const [brand] = await db.sql`select name, is_lego from brands where name = 'Mould King'`;
    expect(brand!.is_lego).toBe(false);
  });

  test('SET-03 a duplicate brand and number links to the existing set', async ({ page, db }) => {
    const id = await db.seedSet({ name: 'Existing', setNumber: '42188' });
    await page.goto('/sets/new');
    await page.getByLabel(label('Name')).fill('Same number');
    await page.getByLabel('Set number').fill('42188');
    await page.getByRole('button', { name: 'Add set' }).click();
    await expect(page.getByRole('alert').filter({ hasText: /./ })).toContainText(
      'already have a set',
    );
    await page.getByRole('link', { name: 'Open it to add another copy' }).click();
    await expect(page).toHaveURL(new RegExp(`/sets/${id}$`));
    expect(await db.count('sets')).toBe(1);
  });

  test('SET-04 rejects a bad price and keeps nothing', async ({ page, db }) => {
    await page.goto('/sets/new');
    await page.getByLabel(label('Name')).fill('Pricey');
    await page.getByLabel('Retail price').fill('lots');
    await page.getByRole('button', { name: 'Add set' }).click();
    await expect(page.getByRole('alert').filter({ hasText: /./ })).toContainText('retail price');
    expect(await db.count('sets')).toBe(0);
  });
});

test.describe('set detail and copies', () => {
  test('COPY-01 the build-state menu changes a copy and is audited @smoke', async ({
    page,
    db,
  }) => {
    const id = await db.seedSet({ name: 'Harbour Lighthouse', copies: [{ buildState: 'sealed' }] });
    await page.goto(`/sets/${id}`);
    await page.getByRole('button', { name: /Build state of copy 1: Sealed/ }).click();
    await page.getByRole('menuitemradio', { name: /Built/ }).click();
    await expect(page.getByRole('button', { name: /Build state of copy 1: Built/ })).toBeVisible();
    await expect(page.getByText('Copy 1 is now Built.')).toBeVisible();
    const [row] =
      await db.sql`select changes from audit_log where entity_type = 'copy' and action = 'update'`;
    expect(row!.changes).toEqual({ buildState: ['sealed', 'built'] });
  });

  test('COPY-02 edits a copy with owner, place and money', async ({ page, db }) => {
    const shelf = await db.seedLocation('Attic');
    const id = await db.seedSet({ name: 'Orchid Lamp', copies: [{}] });
    await page.goto(`/sets/${id}`);
    await page.getByRole('button', { name: 'Edit copy' }).click();
    const dialog = page.getByRole('dialog');
    await choose(page, dialog, 'Owner', MEMBER.name);
    await choose(page, dialog, 'Place', 'Attic');
    await dialog.getByLabel('Price paid').fill('89.99');
    await dialog.getByLabel('Estimated value').fill('120');
    await dialog.getByLabel('Condition notes').fill('Box corner dented');
    await dialog.getByRole('button', { name: 'Save copy' }).click();

    await expect(dialog).toBeHidden();
    await expect(page.getByText(`${MEMBER.name}’s copy`)).toBeVisible();
    await expect(page.getByText('Attic', { exact: true })).toBeVisible();
    await expect(page.getByText('$89.99 / $120.00')).toBeVisible();
    await expect(page.getByText('Box corner dented')).toBeVisible();
    const [copy] = await db.sql`select location_id, price_paid_cents, valued_on from copies`;
    expect(copy!.location_id).toBe(shelf);
    expect(copy!.price_paid_cents).toBe(8999);
    expect(copy!.valued_on).not.toBeNull();
  });

  test('COPY-03 adds several copies from the set page', async ({ page, db }) => {
    const id = await db.seedSet({ name: 'Polybag', copies: [] });
    await page.goto(`/sets/${id}`);
    await page.getByRole('button', { name: 'Add copy' }).first().click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('How many?').fill('5');
    await dialog.getByRole('button', { name: 'Add copy' }).click();
    await expect(page.getByRole('heading', { name: /^Copies\s*5$/ })).toBeVisible();
  });

  test('COPY-04 a set with copies cannot be deleted; without them it goes to the trash and back', async ({
    page,
    db,
  }) => {
    const id = await db.seedSet({ name: 'Doomed' });
    await page.goto(`/sets/${id}`);
    await page.getByRole('button', { name: 'Delete set' }).click();
    await expect(page.getByRole('dialog')).toContainText('still has 1 copy');
    await expect(page.getByRole('button', { name: 'Move to trash' })).toBeDisabled();
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: 'Remove copy' }).click();
    await page.getByRole('button', { name: 'Move to trash' }).click();
    await expect(page.getByText('No copies of this set.')).toBeVisible();

    await page.getByRole('button', { name: 'Delete set' }).click();
    await page.getByRole('button', { name: 'Move to trash' }).click();
    await expect(page).toHaveURL(/\/sets$/);
    await page.goto(`/sets/${id}`);
    await expect(page.getByText('not in the bin')).toBeVisible();

    await page.goto('/settings/trash');
    await expect(page.getByText('Doomed').first()).toBeVisible();
    // The copy cannot come back before its set.
    const copyRow = page.getByRole('listitem').filter({ hasText: 'Copy' });
    await copyRow.getByRole('button', { name: 'Restore' }).click();
    await expect(page.getByRole('alert').filter({ hasText: /./ })).toContainText(
      'Restore the set first',
    );
    const setRow = page.getByRole('listitem').filter({ hasText: /Set \d+/ });
    await setRow.getByRole('button', { name: 'Restore' }).click();
    await expect(setRow).toHaveCount(0);
    await page.goto(`/sets/${id}`);
    await expect(page.getByRole('heading', { name: 'Doomed', level: 1 })).toBeVisible();
  });
});

test.describe('kid profile', () => {
  test('VIS-01 a kid cannot add or edit, sees no prices, and hidden sets look unknown', async ({
    kidPage,
    db,
  }) => {
    const shown = await db.seedSet({
      name: 'Shown Set',
      retailPriceCents: 9999,
      copies: [{ pricePaidCents: 5000, estimatedValueCents: 7000 }],
    });
    const hidden = await db.seedSet({ name: 'Secret Present', hiddenFromRestricted: true });

    await kidPage.goto(`/sets/${shown}`);
    await expect(kidPage.getByRole('heading', { name: 'Shown Set', level: 1 })).toBeVisible();
    await expect(kidPage.getByText('$')).toHaveCount(0);
    await expect(kidPage.getByRole('button', { name: /Edit|Add copy|Delete|Remove/ })).toHaveCount(
      0,
    );
    await expect(kidPage.getByRole('link', { name: 'Edit set' })).toHaveCount(0);

    for (const url of [`/sets/${hidden}`, '/sets/new', `/sets/${shown}/edit`, '/settings/places']) {
      await kidPage.goto(url);
      await expect(kidPage.getByText('not in the bin')).toBeVisible();
    }
    await kidPage.goto('/sets');
    await expect(kidPage.getByText('Shown Set')).toBeVisible();
    await expect(kidPage.getByText('Secret Present')).toHaveCount(0);
    const cover = await kidPage.request.get(`/api/sets/${hidden}/cover`);
    expect(cover.status()).toBe(404);
    await expect(kidPage.getByRole('link', { name: 'Shopping list' })).toHaveCount(0);
    await expect(kidPage.getByRole('link', { name: 'Collection' })).toHaveCount(0);
    expect(KID.role).toBe('restricted');
  });
});

test.describe('settings', () => {
  test('PLACE-01 creates nested places and guards deleting one that holds copies', async ({
    page,
    db,
  }) => {
    await page.goto('/settings/places');
    let form = formWith(page, 'Add place');
    await form.getByLabel('New place').fill('Attic');
    await form.getByRole('button', { name: 'Add place' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Attic' })).toBeVisible();

    form = formWith(page, 'Add place');
    await form.getByLabel('New place').fill('Shelf 1');
    await choose(page, form, 'Inside', 'Attic');
    await form.getByRole('button', { name: 'Add place' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'Shelf 1' })).toBeVisible();

    const [shelf] = await db.sql`select id from locations where name = 'Shelf 1'`;
    await db.seedSet({ name: 'Kept here', copies: [{ locationId: shelf!.id as string }] });
    await page.reload();
    await expect(page.getByText('1 here')).toBeVisible();
    await page
      .getByRole('listitem')
      .filter({ hasText: 'Shelf 1' })
      .getByRole('button', { name: 'Delete' })
      .click();
    await page.getByRole('button', { name: 'Move to trash' }).click();
    await expect(page.getByRole('dialog')).toContainText('1 copies are kept here');
  });

  test('BRAND-01 adds a brand and refuses to delete one that has sets', async ({ page, db }) => {
    await db.seedSet({ name: 'Cada Thing', brand: 'CaDA' });
    await page.goto('/settings/brands');
    const form = formWith(page, 'Add brand');
    await form.getByLabel('New brand').fill('BlueBrixx');
    await form.getByRole('button', { name: 'Add brand' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'BlueBrixx' })).toBeVisible();

    await page
      .getByRole('listitem')
      .filter({ hasText: 'CaDA' })
      .getByRole('button', { name: 'Delete' })
      .click();
    await page.getByRole('button', { name: 'Delete brand' }).click();
    await expect(page.getByRole('dialog')).toContainText('1 sets use this brand');
    await page.keyboard.press('Escape');

    await page
      .getByRole('listitem')
      .filter({ hasText: 'BlueBrixx' })
      .getByRole('button', { name: 'Delete' })
      .click();
    await page.getByRole('button', { name: 'Delete brand' }).click();
    await expect(page.getByRole('listitem').filter({ hasText: 'BlueBrixx' })).toHaveCount(0);
  });

  test('ACT-01 activity names who did what', async ({ page, db }) => {
    await db.seedSet({ name: 'Seeded' });
    await page.goto('/sets/new');
    await page.getByLabel(label('Name')).fill('Via the form');
    await page.getByRole('button', { name: 'Add set' }).click();
    await expect(page).toHaveURL(/\/sets\/[0-9a-f-]{36}$/);
    await page.goto('/settings/activity');
    await expect(page.getByText(/added the set Via the form/)).toBeVisible();
  });
});
