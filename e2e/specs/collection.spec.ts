import { expect, test } from '../fixtures';

/** Formatted money ($12.34). Next's own payload has markers like $1 and $L2, which are not prices. */
const MONEY = /\$\d[\d,]*\.\d{2}/;

test.describe('collection and value', () => {
  test('VAL-01 totals, differences and breakdowns, formatted as dollars @smoke', async ({
    page,
    db,
  }) => {
    await db.seedSet({
      name: 'Titanic',
      brand: 'LEGO',
      theme: 'Icons',
      pieceCount: 9090,
      copies: [{ buildState: 'built', pricePaidCents: 59_999, estimatedValueCents: 70_000 }],
    });
    await db.seedSet({
      name: 'Crane',
      brand: 'Mould King',
      pieceCount: 1000,
      copies: [
        { buildState: 'sealed', pricePaidCents: 10_000, estimatedValueCents: 9_000 },
        { buildState: 'sealed' },
      ],
    });
    await page.goto('/collection');
    await expect(page.getByText('2 sets · 3 copies · 11,090 pieces')).toBeVisible();
    const stat = (label: string) =>
      page.locator('dl > div').filter({ has: page.getByText(label, { exact: true }) });
    await expect(stat('Paid')).toContainText('$699.99');
    await expect(stat('Paid')).toContainText('2 of 3 copies have a price');
    await expect(stat('Estimated value')).toContainText('$790.00');
    await expect(stat('Difference')).toContainText('+$90.01'); // (700 + 90) - (599.99 + 100)

    const brands = page.getByRole('region', { name: 'By brand' });
    await expect(brands.getByRole('row', { name: /LEGO 1 \$599\.99 \$700\.00/ })).toBeVisible();
    await expect(
      brands.getByRole('row', { name: /Mould King 2 \$100\.00 \$90\.00/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'By theme' }).getByRole('row', { name: /Icons 1/ }),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'By build state' }).getByText('Sealed'),
    ).toBeVisible();
    await expect(
      page.getByRole('region', { name: 'Sealed sets' }).getByRole('link', { name: 'Crane' }),
    ).toBeVisible();
  });

  test('VAL-02 lists copies whose value has not been set in over a year', async ({ page, db }) => {
    const id = await db.seedSet({
      name: 'Old value',
      copies: [{ buildState: 'built', estimatedValueCents: 5_000 }, { buildState: 'built' }],
    });
    await db.sql`update copies set valued_on = '2023-04-01' where set_id = ${id} and estimated_value_cents is not null`;
    await db.seedSet({
      name: 'Fresh',
      copies: [{ buildState: 'built', estimatedValueCents: 100 }],
    });
    await db.sql`update copies set valued_on = current_date where estimated_value_cents = 100`;
    await page.goto('/collection');
    const stale = page.getByRole('region', { name: 'Value not set in over a year' });
    await expect(stale.locator('tbody tr')).toHaveCount(2);
    // A table with Estimate and Last valued columns now, in place of "$50.00 · Apr 2023".
    await expect(stale.getByRole('row', { name: /\$50\.00 Apr 2023/ })).toBeVisible();
    await expect(stale.getByRole('row', { name: /No estimate Never/ })).toBeVisible();
    await expect(stale).not.toContainText('Fresh');
  });

  test('VAL-03 an estimate saved on the copy form stamps the date and shows in the totals', async ({
    page,
    db,
  }) => {
    const id = await db.seedSet({ name: 'Lamp', copies: [{ buildState: 'built' }] });
    await page.goto(`/sets/${id}`);
    await page.getByRole('button', { name: 'Edit copy' }).click();
    const dialog = page.getByRole('dialog');
    await dialog.getByLabel('Price paid').fill('49.50');
    await dialog.getByLabel('Estimated value').fill('80');
    await dialog.getByRole('button', { name: 'Save copy' }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText('$49.50 / $80.00')).toBeVisible();
    await page.goto('/collection');
    await expect(page.locator('dl > div').filter({ hasText: 'Estimated value' })).toContainText(
      '$80.00',
    );
    await expect(page.getByText('Every copy has a recent estimate.')).toBeVisible();
  });

  test('VAL-04 sorts the library by estimated value', async ({ page, db }) => {
    await db.seedSet({ name: 'Cheap', copies: [{ estimatedValueCents: 1_000 }] });
    await db.seedSet({ name: 'Dear', copies: [{ estimatedValueCents: 90_000 }] });
    await db.seedSet({ name: 'Middle', copies: [{ estimatedValueCents: 5_000 }] });
    await page.goto('/sets?sort=value');
    await expect(page.locator('ul > li h3')).toHaveText(['Dear', 'Middle', 'Cheap']);
  });

  test('VAL-05 the empty collection explains itself', async ({ page }) => {
    await page.goto('/collection');
    await expect(page.getByText(/Nothing to total yet/)).toBeVisible();
  });

  test('VAL-06 kid profiles have neither the page nor any prices', async ({ kidPage, db }) => {
    const id = await db.seedSet({
      name: 'Priced',
      retailPriceCents: 9_999,
      copies: [{ pricePaidCents: 5_000, estimatedValueCents: 7_000 }],
    });
    await kidPage.goto('/collection');
    await expect(kidPage.getByText('not in the bin')).toBeVisible();
    await expect(kidPage.getByRole('link', { name: 'Collection' })).toHaveCount(0);
    await kidPage.goto(`/sets/${id}`);
    expect(await kidPage.content()).not.toMatch(MONEY);
    await kidPage.goto('/sets?sort=value');
    await expect(kidPage.getByRole('option', { name: 'Estimated value' })).toHaveCount(0);
    expect(await kidPage.content()).not.toMatch(MONEY);
  });
});
