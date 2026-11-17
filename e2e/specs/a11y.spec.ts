import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { MEMBER } from '../support/roles';

async function scan(page: Page, label: string) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
    .analyze();
  const bad = results.violations.map((v) => ({
    rule: v.id,
    impact: v.impact,
    nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ') + ' :: ' + (n.any[0]?.message ?? '')),
  }));
  expect(bad, `${label}: accessibility violations`).toEqual([]);
}

async function seed(db: typeof import('../support/db')) {
  await db.seedCatalog();
  const id = await db.seedSet({
    name: 'Titanic',
    theme: 'Icons',
    tags: ['display'],
    cover: true,
    copies: [{ buildState: 'built', pricePaidCents: 5000, estimatedValueCents: 7000 }, {}],
  });
  await db.linkSet(id, '10294-1');
  await db.seedMissing(await db.firstCopyId(id), { partNum: '3001', colorId: 0, quantity: 2 });
  await db.seedWish(MEMBER.email, 'Falcon', { rbSetNum: '75192-1', priceCents: 1000 });
  return id;
}

for (const scheme of ['light', 'dark'] as const) {
  test.describe(`accessibility (${scheme})`, () => {
    test.use({ colorScheme: scheme });

    test(`A11Y-01 admin pages have no axe violations @smoke`, async ({ page, db }) => {
      const id = await seed(db);
      for (const url of [
        '/sets',
        `/sets/${id}`,
        `/sets/${id}/edit`,
        '/sets/new',
        '/missing',
        '/collection',
        '/import',
        '/wishlist',
        '/settings/places',
        '/settings/brands',
        '/settings/people',
        '/settings/catalog',
        '/settings/activity',
        '/settings/trash',
      ]) {
        await page.goto(url);
        await expect(page.locator('main, h1').first()).toBeVisible();
        await scan(page, `${scheme} ${url}`);
      }
    });

    test(`A11Y-02 kid pages have no axe violations`, async ({ kidPage, db }) => {
      const id = await seed(db);
      for (const url of ['/sets', `/sets/${id}`, '/wishlist']) {
        await kidPage.goto(url);
        await expect(kidPage.locator('main, h1').first()).toBeVisible();
        await scan(kidPage, `${scheme} kid ${url}`);
      }
    });
  });
}
