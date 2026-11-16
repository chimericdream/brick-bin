import { fixtureColors } from '../../src/server/catalog/fixtures';
import { expect, test } from '../fixtures';

const paste = async (page: import('@playwright/test').Page, html: string) => {
  await page.getByLabel('Rebrickable downloads page source').fill(html);
  await page.getByRole('button', { name: 'Check the page' }).click();
};

test.describe('Settings > Catalog', () => {
  test('CAT-01 shows "Never imported" and the first-run warning; only admins see the tab @smoke', async ({
    page,
    memberPage,
    kidPage,
  }) => {
    await page.goto('/settings/catalog');
    await expect(page.getByRole('heading', { name: 'Never imported' })).toBeVisible();
    await expect(page.getByText('Set lookup and part picking need the catalog.')).toBeVisible();
    await expect(page.getByText(/about 6 GB of part images/)).toBeVisible();
    await expect(page.getByText(/free to use with credit/)).toBeVisible();
    await expect(
      page.getByRole('navigation', { name: 'Settings' }).getByRole('link', { name: 'Catalog' }),
    ).toBeVisible();

    await memberPage.goto('/settings/catalog');
    await expect(memberPage.getByText('not in the bin')).toBeVisible();
    await memberPage.goto('/settings/places');
    await expect(
      memberPage
        .getByRole('navigation', { name: 'Settings' })
        .getByRole('link', { name: 'Catalog' }),
    ).toHaveCount(0);
    await kidPage.goto('/settings/catalog');
    await expect(kidPage.getByText('not in the bin')).toBeVisible();
  });

  test('CAT-02 an incomplete or unrelated paste is refused and nothing is downloaded', async ({
    page,
    rebrickable,
  }) => {
    await page.goto('/settings/catalog');
    await paste(page, rebrickable.page({ colors: fixtureColors(30) }));
    const alert = page.getByRole('alert').filter({ hasText: /\S/ });
    await expect(alert).toContainText('does not look like the whole Rebrickable downloads page');
    await expect(alert).toContainText('Only 30 LDraw image links');
    await expect(alert).toContainText('Did the whole page get copied?');

    await paste(page, '<html><body><h1>Some other page</h1></body></html>');
    await expect(alert).toContainText('all_downloads.zip');
    expect(rebrickable.requests.filter((r) => r.path !== '/__health')).toEqual([]);
  });

  test('CAT-03 previews, imports, shows progress and the summary, then locks for 48 hours @smoke', async ({
    page,
    db,
    rebrickable,
  }) => {
    rebrickable.ldrawDelayMs = 25; // slow enough to see the progress bar
    await page.goto('/settings/catalog');
    await paste(page, rebrickable.page());
    await expect(page.getByRole('status').filter({ hasText: 'This will download' })).toContainText(
      '120 of 120',
    );
    await page.getByRole('button', { name: 'Import catalog' }).click();

    await expect(page.getByText(/Import running/)).toBeVisible();
    await expect(page.getByRole('progressbar', { name: 'Import progress' })).toBeVisible();

    await expect(page.getByRole('heading', { name: /^Last imported/ })).toBeVisible({
      timeout: 60_000,
    });
    await expect(page.getByText(/Available again/)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Check the page' })).toBeDisabled();
    await expect(page.getByRole('cell', { name: 'Succeeded' })).toBeVisible();
    await expect(page.getByRole('cell', { name: 'Pasted page' })).toBeVisible();
    await expect(page.getByText('122 downloaded, 0 unchanged')).toBeVisible();
    await expect(page.getByText(/do not match a part number/)).toBeVisible();

    expect(await db.count('rb_sets')).toBe(2);
    expect(await db.count('rb_parts')).toBe(3);
    expect(await db.count('catalog_part_images')).toBe(120 * 3);
    // One archive, one diagram, one request per colour: nothing else, and the page itself never.
    expect(rebrickable.count('all_downloads.zip')).toBe(1);
    expect(rebrickable.count('downloads_schema')).toBe(1);
    expect(rebrickable.count('/ldraw/')).toBe(120);
    expect(rebrickable.requests.filter((r) => r.path === '/downloads/')).toEqual([]);
    expect(rebrickable.requests.every((r) => r.userAgent?.startsWith('BrickBin/'))).toBe(true);
  });

  test('CAT-04 the server enforces the lock whatever the page shows', async ({
    page,
    db,
    rebrickable,
  }) => {
    await page.goto('/settings/catalog');
    await paste(page, rebrickable.page());
    await page.getByRole('button', { name: 'Import catalog' }).click();
    await expect(page.getByRole('heading', { name: /^Last imported/ })).toBeVisible({
      timeout: 60_000,
    });

    const before = rebrickable.requests.length;
    const preview = await page.request.post('/api/catalog/preview', { data: rebrickable.page() });
    const start = await page.request.post('/api/catalog/import', { data: rebrickable.page() });
    expect(preview.status()).toBe(409);
    expect(start.status()).toBe(409);
    expect((await start.json()).code).toBe('unavailable');
    expect(rebrickable.requests.length).toBe(before);
    expect(await db.count('catalog_runs')).toBe(1);
  });

  test('CAT-05 only admins can call the import API', async ({
    memberPage,
    kidPage,
    anonPage,
    rebrickable,
  }) => {
    for (const [who, p] of [
      ['member', memberPage],
      ['kid', kidPage],
    ] as const) {
      for (const url of ['/api/catalog/preview', '/api/catalog/import']) {
        const res = await p.request.post(url, { data: rebrickable.page() });
        expect(res.status(), `${who} ${url}`).toBe(403);
      }
      expect((await p.request.get('/api/catalog/status')).status()).toBe(403);
    }
    expect(
      (await anonPage.request.post('/api/catalog/import', { data: rebrickable.page() })).status(),
    ).toBe(401);
    expect(rebrickable.requests.filter((r) => r.path !== '/__health')).toEqual([]);
  });

  test('CAT-06 a 429 stops the run; the button stays available and a retry reuses the saved archive', async ({
    page,
    rebrickable,
  }) => {
    rebrickable.ldrawStatus = 429;
    await page.goto('/settings/catalog');
    await paste(page, rebrickable.page());
    await page.getByRole('button', { name: 'Import catalog' }).click();
    await expect(page.getByRole('alert').filter({ hasText: /\S/ })).toContainText(
      'The last import failed',
      {
        timeout: 60_000,
      },
    );
    await expect(page.getByRole('alert').filter({ hasText: /\S/ })).toContainText('429');
    await expect(page.getByRole('cell', { name: 'Failed' })).toBeVisible();
    expect(rebrickable.count('/ldraw/')).toBe(1); // it stopped at the first one
    expect(rebrickable.count('all_downloads.zip')).toBe(1);

    // A failed run does not lock the button. The retry reads the archive from disk.
    rebrickable.ldrawStatus = null;
    await paste(page, rebrickable.page());
    await page.getByRole('button', { name: 'Import catalog' }).click();
    await expect(page.getByRole('heading', { name: /^Last imported/ })).toBeVisible({
      timeout: 60_000,
    });
    expect(rebrickable.count('all_downloads.zip')).toBe(1);
    expect(rebrickable.count('downloads_schema')).toBe(1);
  });

  test('CAT-07 links to other sites on a pasted page are ignored and reported', async ({
    page,
    rebrickable,
  }) => {
    await page.goto('/settings/catalog');
    const extra = `<a href="https://evil.example/media/downloads/ldraw/parts_9999.zip">x</a>
      <a href="https://evil.example/media/downloads/all_downloads.zip">y</a>`;
    await paste(page, rebrickable.page({ extra }));
    await expect(page.getByText('2 links to other sites were ignored.')).toBeVisible();
    await page.getByRole('button', { name: 'Import catalog' }).click();
    await expect(page.getByRole('heading', { name: /^Last imported/ })).toBeVisible({
      timeout: 60_000,
    });
    expect(rebrickable.requests.some((r) => r.path.includes('9999'))).toBe(false);
  });

  test('CAT-08 the saved diagram is served sandboxed to signed-in people only', async ({
    page,
    memberPage,
    anonPage,
    rebrickable,
  }) => {
    expect((await page.request.get('/api/catalog/schema.svg')).status()).toBe(404); // not imported yet
    await page.goto('/settings/catalog');
    await paste(page, rebrickable.page());
    await page.getByRole('button', { name: 'Import catalog' }).click();
    await expect(page.getByRole('heading', { name: /^Last imported/ })).toBeVisible({
      timeout: 60_000,
    });

    const res = await memberPage.request.get('/api/catalog/schema.svg');
    expect(res.status()).toBe(200);
    expect(res.headers()['content-type']).toBe('image/svg+xml');
    expect(res.headers()['content-security-policy']).toBe('sandbox');
    expect(await res.text()).toContain('<svg');
    expect((await anonPage.request.get('/api/catalog/schema.svg')).status()).toBe(401);
  });
});
