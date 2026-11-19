import { expect, test } from '../fixtures';

const tile = (page: import('@playwright/test').Page, name: string) =>
  page.getByRole('listitem').filter({ has: page.getByText(name, { exact: true }) });

test.describe('library', () => {
  test('LIB-01 shows owned sets as tiles with badges, and a no-copy hint toggle @smoke', async ({
    page,
    db,
  }) => {
    await db.seedSet({
      name: 'Crane',
      setNumber: '42100',
      year: 2021,
      copies: [{ buildState: 'built' }],
    });
    await db.seedSet({ name: 'Wanted', copies: [] });
    await page.goto('/sets');
    await expect(page.getByText('1 set', { exact: true })).toBeVisible();
    const t = tile(page, 'Crane');
    await expect(t).toBeVisible();
    await expect(t).toContainText('LEGO · 42100 · 2021');
    await expect(t.getByText('Built')).toBeVisible();
    await expect(t.getByText('Not checked')).toBeVisible();
    await expect(page.getByText('Wanted')).toHaveCount(0);

    await page.getByRole('switch', { name: /Include sets with no copies/ }).click();
    await expect(page).toHaveURL(/unowned=1/);
    await expect(page.getByText('Wanted', { exact: true })).toBeVisible();
    await expect(tile(page, 'Wanted')).toContainText('No copies');
  });

  test('LIB-02 copies collapse into one state tag per build state, with a count', async ({
    page,
    db,
  }) => {
    await db.seedSet({
      name: 'Polybag',
      copies: Array.from({ length: 5 }, () => ({ buildState: 'sealed' as const })),
    });
    await db.seedSet({ name: 'Pair', copies: [{ buildState: 'built' }, { buildState: 'opened' }] });
    await db.seedSet({ name: 'Solo', copies: [{ buildState: 'sealed' }] });
    await page.goto('/sets');
    const bag = tile(page, 'Polybag');
    await expect(bag.getByText('Sealed')).toHaveCount(1);
    await expect(bag.getByText('Sealed')).toContainText('×5');
    // Fixed order: opened before built.
    await expect(tile(page, 'Pair').locator('[data-st]')).toHaveText(['Opened', 'Built']);
    await expect(tile(page, 'Solo').getByText('Sealed')).not.toContainText('×');
  });

  test('LIB-03 facet links filter, show counts, and clear', async ({ page, db }) => {
    await db.seedSet({ name: 'L built', copies: [{ buildState: 'built' }] });
    await db.seedSet({ name: 'L sealed', copies: [{ buildState: 'sealed' }] });
    await db.seedSet({ name: 'K built', brand: 'CaDA', copies: [{ buildState: 'built' }] });
    await page.goto('/sets');
    const panel = page.getByRole('complementary', { name: 'Filters' });
    const sorter = page.getByRole('group', { name: 'Filter by build state' });
    await expect(sorter.getByRole('button', { name: /^Built\s*2$/ })).toBeVisible();

    await panel.getByRole('link', { name: /^CaDA/ }).click();
    await expect(page).toHaveURL(/brand=/);
    await expect(page.getByRole('listitem').filter({ hasText: 'K built' })).toBeVisible();
    await expect(page.getByText('L built')).toHaveCount(0);
    // The build-state counts now cover CaDA only; the brand counts still offer LEGO.
    await expect(sorter.getByRole('button', { name: /^Built\s*1$/ })).toBeVisible();
    await expect(panel.getByRole('link', { name: /^LEGO\s*2$/ })).toBeVisible();

    await sorter.getByRole('button', { name: /^Sealed/ }).click();
    await expect(page).toHaveURL(/state=sealed/);
    await expect(sorter.getByRole('button', { name: /^Sealed/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await expect(page.getByText('Nothing in the bin matches that.')).toBeVisible();
    await page.getByRole('link', { name: 'Clear all filters' }).click();
    await expect(page).toHaveURL(/\/sets$/);
    await expect(page.getByText('3 sets', { exact: true })).toBeVisible();
  });

  test('LIB-04 search matches name, number, brand and theme; sort changes the order', async ({
    page,
    db,
  }) => {
    await db.seedSet({ name: 'Zeta Rover', setNumber: '10294', theme: 'Star Wars', year: 2010 });
    await db.seedSet({ name: 'Alpha Tram', setNumber: '75192', brand: 'CaDA', year: 2017 });
    await db.seedSet({ name: 'Mid Crane', setNumber: '7140', year: 2024 });
    await page.goto('/sets');
    // A navigation can land mid-read; poll again rather than fail.
    const order = () =>
      page
        .locator('ul > li h3')
        .allTextContents()
        .then((names) => names.filter(Boolean))
        .catch(() => []);
    await expect.poll(order).toEqual(['Alpha Tram', 'Mid Crane', 'Zeta Rover']);

    await page.getByLabel('Sort').selectOption('number');
    await expect(page).toHaveURL(/sort=number/);
    // Natural order: 7140, 10294, 75192.
    await expect.poll(order).toEqual(['Mid Crane', 'Zeta Rover', 'Alpha Tram']);
    await page.getByLabel('Sort').selectOption('year');
    await expect.poll(order).toEqual(['Mid Crane', 'Alpha Tram', 'Zeta Rover']);

    await page.getByLabel('Search sets').fill('star wars');
    await page.keyboard.press('Enter');
    await expect.poll(order).toEqual(['Zeta Rover']);
    await page.getByLabel('Search sets').fill('cada');
    await page.keyboard.press('Enter');
    await expect.poll(order).toEqual(['Alpha Tram']);
    await page.getByLabel('Search sets').fill('7140');
    await page.keyboard.press('Enter');
    await expect.poll(order).toEqual(['Mid Crane']);
  });

  test('LIB-05 pages through a large library', async ({ page, db }) => {
    await db.seedMany(60);
    await page.goto('/sets');
    await expect(page.getByText('60 sets', { exact: true })).toBeVisible();
    await expect(page.locator('ul > li h3')).toHaveCount(24);
    await expect(page.getByText('1 to 24 of 60 sets')).toBeVisible();
    await page.getByRole('link', { name: 'Next' }).click();
    await expect(page).toHaveURL(/page=2/);
    await page.getByRole('link', { name: 'Next' }).click();
    await expect(page.getByText('49 to 60 of 60 sets')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Next' })).toHaveCount(0);
  });

  test('LIB-06 hostile query strings never break the page', async ({ page, db }) => {
    await db.seedSet({ name: 'Calm' });
    await page.goto('/sets?brand=%27%3B--&state=exploded&page=-1&q=%25_%5C&sort=drop&from=zzz');
    await expect(page.getByRole('heading', { name: 'Library', level: 1 })).toBeVisible();
    await expect(page.getByText('Nothing in the bin matches that.')).toBeVisible();
  });
});

test.describe('library for a kid', () => {
  test('VIS-02 hides hidden sets and everything that would reveal them', async ({
    kidPage,
    db,
  }) => {
    await db.seedSet({ name: 'Open Set', theme: 'Open Theme', tags: ['shared'], pieceCount: 300 });
    await db.seedSet({
      name: 'Secret Present',
      theme: 'Surprise Theme',
      tags: ['secret-tag'],
      hiddenFromRestricted: true,
      brand: 'Hidden Brand',
      pieceCount: 5000,
    });
    await kidPage.goto('/sets');
    await expect(kidPage.getByText('1 set', { exact: true })).toBeVisible();
    const html = await kidPage.content();
    for (const leak of [
      'Secret Present',
      'Surprise Theme',
      'secret-tag',
      'Hidden Brand',
      'Hidden from kids',
    ]) {
      expect(html, `leaked "${leak}"`).not.toContain(leak);
    }
    await expect(kidPage.getByRole('option', { name: 'Estimated value' })).toHaveCount(0);
    await expect(kidPage.getByRole('link', { name: 'Add set' })).toHaveCount(0);
    await kidPage.goto('/sets?q=Secret');
    await expect(kidPage.getByText('Nothing in the bin matches that.')).toBeVisible();
    await kidPage.goto('/sets?sort=value');
    await expect(kidPage.getByText('Open Set')).toBeVisible();
  });

  test('VIS-03 admins see which sets are hidden from kids', async ({ page, db }) => {
    await db.seedSet({ name: 'Secret Present', hiddenFromRestricted: true });
    await page.goto('/sets');
    await expect(page.getByText('Hidden from kids')).toBeVisible();
  });
});

test.describe('library on phones', () => {
  test.use({ viewport: { width: 390, height: 800 } });

  test('LIB-07 sets are rows, the sorter stays in view, and filters open as a sheet', async ({
    page,
    db,
  }) => {
    await db.seedSet({ name: 'One', copies: [{ buildState: 'built' }] });
    await db.seedSet({ name: 'Two', brand: 'CaDA', copies: [{ buildState: 'sealed' }] });
    await page.goto('/sets');
    const a = await tile(page, 'One').boundingBox();
    const b = await tile(page, 'Two').boundingBox();
    expect(b!.y).toBeGreaterThan(a!.y + a!.height - 4); // one row per set
    await expect(page.getByRole('link', { name: /^CaDA/ })).toBeHidden();
    await page.getByRole('button', { name: 'Filters' }).click();
    const sheet = page.getByRole('dialog', { name: 'Filters' });
    await expect(sheet.getByRole('link', { name: /^CaDA\s*1$/ })).toBeVisible();
    await sheet.getByRole('link', { name: /^CaDA\s*1$/ }).click();
    await expect(page).toHaveURL(/brand=/);
    await sheet.getByRole('button', { name: 'Show 1 set' }).click();
    await expect(sheet).toBeHidden();
    await page.getByRole('button', { name: /^Built\s*0$/ }).click();
    await expect(page).toHaveURL(/state=built/);
  });

  test('LIB-08 extra-small phones get a single column of larger boxes', async ({ page, db }) => {
    await page.setViewportSize({ width: 320, height: 700 });
    await db.seedSet({ name: 'One' });
    await db.seedSet({ name: 'Two' });
    await page.goto('/sets');
    const a = await tile(page, 'One').boundingBox();
    const b = await tile(page, 'Two').boundingBox();
    expect(b!.y).toBeGreaterThan(a!.y + a!.height - 4); // stacked
    expect(a!.width).toBeGreaterThan(250);
  });
});
