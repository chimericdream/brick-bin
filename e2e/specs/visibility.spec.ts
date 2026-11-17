import type { Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { MEMBER } from '../support/roles';

/** Distinctive enough that Next's own payload can never contain it by accident. */
const LEAKS = [
  'ZZSECRET',
  'zzsecret',
  '99999',
  '4321',
  '7777',
  '77.77',
  '88.88',
  'Hidden from kids',
];

const pdf = Buffer.concat([
  Buffer.from('%PDF-1.4\n'),
  Buffer.from('z'.repeat(200)),
  Buffer.from('\n%%EOF\n'),
]);

async function seedHiddenWorld(db: typeof import('../support/db'), adminPage: Page) {
  await db.seedCatalog();
  await db.seedBrickLinkMappings();
  await db.seedSet({
    name: 'Open Set',
    theme: 'Open Theme',
    tags: ['open-tag'],
    pieceCount: 300,
    copies: [{ buildState: 'built' }],
  });
  const shelf = await db.seedLocation('ZZSECRET Shelf');
  const hidden = await db.seedSet({
    name: 'ZZSECRET Present',
    brand: 'ZZSECRET Brand',
    theme: 'ZZSECRET Theme',
    tags: ['zzsecret-tag'],
    setNumber: '99999',
    pieceCount: 4321,
    retailPriceCents: 7777,
    hiddenFromRestricted: true,
    cover: true,
    copies: [
      {
        buildState: 'sealed',
        locationId: shelf,
        pricePaidCents: 7777,
        estimatedValueCents: 8888,
        conditionNotes: 'ZZSECRET dent',
        ownerEmail: MEMBER.email,
      },
    ],
  });
  await db.linkSet(hidden, '10294-1');
  const copyId = await db.firstCopyId(hidden);
  await db.seedMissing(copyId, { partNum: '3001', colorId: 0, quantity: 2 });
  const upload = await adminPage.request.post('/api/instructions/upload', {
    headers: { 'x-set-id': hidden, 'x-label': 'ZZSECRET Book', 'content-type': 'application/pdf' },
    data: pdf,
  });
  const ins = (await upload.json()) as { id: string };
  const hiddenWish = await db.seedWish(MEMBER.email, 'ZZSECRET Wish', {
    priceCents: 7777,
    rbSetNum: '10294-1',
  });
  return { hidden, copyId, instructionId: ins.id, hiddenWish };
}

test.describe('kid profile leak audit', () => {
  test('VIS-04 no page a kid can open reveals a hidden set, in HTML or counts @smoke', async ({
    kidPage,
    page,
    db,
  }) => {
    const w = await seedHiddenWorld(db, page);
    const brandId = (await db.sql`select id from brands where name = 'ZZSECRET Brand'`)[0]!
      .id as string;
    const themeId = (await db.sql`select id from themes where name = 'ZZSECRET Theme'`)[0]!
      .id as string;
    const shelfId = (await db.sql`select id from locations where name = 'ZZSECRET Shelf'`)[0]!
      .id as string;
    const urls = [
      '/sets',
      `/sets?brand=${brandId}`,
      `/sets?theme=${themeId}`,
      `/sets?place=${shelfId}`,
      '/sets?state=sealed',
      '/sets?unowned=1',
      '/sets?ins=1',
      '/sets?sort=value',
      '/sets?sort=pieces',
      '/sets?pieces=xl',
      '/wishlist',
      '/',
    ];
    for (const url of urls) {
      const res = await kidPage.goto(url);
      expect(res?.status(), url).toBeLessThan(500);
      const html = await kidPage.content();
      for (const leak of LEAKS) expect(html, `${url} leaked "${leak}"`).not.toContain(leak);
    }
    // Searching for the hidden set by name, number or tag finds nothing (the page echoes the query,
    // so these are asserted on the result, not scanned).
    for (const url of [
      '/sets?q=ZZSECRET',
      '/sets?q=99999',
      '/sets?q=7777',
      '/sets?tag=zzsecret-tag',
    ]) {
      await kidPage.goto(url);
      await expect(kidPage.getByText('No sets match these filters.'), url).toBeVisible();
      await expect(kidPage.getByText('ZZSECRET Present'), url).toHaveCount(0);
    }
    // The only visible set is still counted exactly.
    await kidPage.goto('/sets');
    await expect(kidPage.getByText('1 set', { exact: true })).toBeVisible();
    void w;
  });

  test('VIS-05 every page and API that would expose a hidden set answers like an unknown one', async ({
    kidPage,
    page,
    db,
  }) => {
    const w = await seedHiddenWorld(db, page);
    const gone = [
      `/sets/${w.hidden}`,
      `/sets/${w.hidden}/edit`,
      `/copies/${w.copyId}/missing`,
      '/sets/new',
      '/missing',
      '/collection',
      '/settings',
      '/settings/activity',
      '/settings/trash',
      '/settings/people',
      '/settings/places',
      '/settings/brands',
      '/settings/catalog',
    ];
    for (const url of gone) {
      const res = await kidPage.goto(url);
      expect(res?.status(), url).toBe(404);
      const html = await kidPage.content();
      for (const leak of LEAKS) expect(html, `${url} leaked "${leak}"`).not.toContain(leak);
    }
    const api: [string, number][] = [
      [`/api/sets/${w.hidden}/cover`, 404],
      [`/api/instructions/${w.instructionId}`, 404],
      [`/api/copies/${w.copyId}/inventory`, 403],
      [`/api/wishlist/${w.hiddenWish}/cover`, 404],
      ['/api/missing/export?format=csv', 404],
      ['/api/missing/export?format=bricklink', 404],
      ['/api/parts/search?q=3001', 403],
      ['/api/parts/colors?part=3001', 403],
      ['/api/lookup/upc?code=5702017189000', 403],
      ['/api/catalog/status', 403],
    ];
    for (const [url, status] of api) {
      const res = await kidPage.request.get(url);
      expect(res.status(), url).toBe(status);
      const text = await res.text();
      for (const leak of LEAKS) expect(text, `${url} leaked "${leak}"`).not.toContain(leak);
    }
    // Writes are refused as well.
    for (const [url, body] of [
      ['/api/catalog/import', { html: 'x' }],
      ['/api/catalog/preview', { html: 'x' }],
      [
        '/api/instructions/save-link',
        { setId: w.hidden, label: 'x', url: 'https://example.com/a.pdf' },
      ],
    ] as const) {
      const res = await kidPage.request.post(url, { data: body });
      expect([401, 403, 404], url).toContain(res.status());
    }
  });

  test('VIS-06 catalog search never names who wants a set to a kid, and shows no household data', async ({
    kidPage,
    page,
    db,
  }) => {
    await seedHiddenWorld(db, page);
    const res = await kidPage.request.get('/api/catalog/search?q=titan');
    expect(res.status()).toBe(200);
    const hits = (await res.json()).hits as { name: string; wishers: string[] }[];
    expect(hits.map((h) => h.name)).toContain('Titanic');
    expect(hits.every((h) => h.wishers.length === 0)).toBe(true);
    const text = JSON.stringify(hits);
    for (const leak of LEAKS) expect(text).not.toContain(leak);
    // A member does get the badge.
    const asAdmin = await page.request.get('/api/catalog/search?q=titan');
    const adminHits = (await asAdmin.json()).hits as { wishers: string[] }[];
    expect(adminHits.flatMap((h) => h.wishers)).toContain('Mo Member');
  });

  test('VIS-07 a kid cannot replay write actions: nothing changes', async ({
    kidPage,
    page,
    db,
  }) => {
    const w = await seedHiddenWorld(db, page);
    const before = {
      sets: await db.count('sets'),
      copies: await db.count('copies'),
      audit: await db.count('audit_log'),
      missing: await db.count('copy_missing_items'),
    };
    // Server actions are POSTs to the page they live on; the data layer must refuse them
    // regardless. Replay as many as can be reached by plain HTTP.
    for (const url of ['/sets/new', `/sets/${w.hidden}/edit`, `/copies/${w.copyId}/missing`]) {
      const res = await kidPage.request.post(url, {
        headers: { 'next-action': '00', 'content-type': 'text/plain;charset=UTF-8' },
        data: '[]',
      });
      expect(res.status(), url).toBeGreaterThanOrEqual(400);
    }
    expect({
      sets: await db.count('sets'),
      copies: await db.count('copies'),
      audit: await db.count('audit_log'),
      missing: await db.count('copy_missing_items'),
    }).toEqual(before);
  });
});

test.describe('household isolation', () => {
  test('VIS-08 another household’s data is invisible on every page and API', async ({
    page,
    memberPage,
    db,
  }) => {
    const other = await db.seedOtherHousehold();
    await db.seedCatalog();
    const [otherCopy] =
      await db.sql`select id from copies where household_id = ${other.householdId}`;
    const leaks = ['Other Family', 'otherfam', 'Other family'];
    const pages = [
      '/sets',
      '/sets?q=Other',
      '/missing',
      '/collection',
      '/wishlist',
      '/settings/activity',
      '/settings/trash',
      '/settings/people',
      '/settings/places',
      '/settings/brands',
    ];
    for (const p of [page, memberPage]) {
      for (const url of pages) {
        const res = await p.goto(url);
        if (res?.status() === 404) continue; // member has no settings pages
        const html = await p.content();
        for (const leak of leaks) expect(html, `${url} leaked "${leak}"`).not.toContain(leak);
      }
      for (const url of [
        `/sets/${other.setId}`,
        `/sets/${other.setId}/edit`,
        `/copies/${otherCopy!.id}/missing`,
      ]) {
        expect((await p.goto(url))?.status(), url).toBe(404);
      }
      for (const url of [
        `/api/sets/${other.setId}/cover`,
        `/api/copies/${otherCopy!.id}/inventory`,
      ]) {
        expect([403, 404], url).toContain((await p.request.get(url)).status());
      }
    }
  });

  test('VIS-09 every route needs a session', async ({ anonPage, db }) => {
    const id = await db.seedSet({ name: 'Anyone?' });
    for (const url of [
      '/sets',
      `/sets/${id}`,
      '/wishlist',
      '/missing',
      '/collection',
      '/settings',
    ]) {
      await anonPage.goto(url);
      await expect(anonPage, url).toHaveURL(/\/(login|setup)/);
    }
    for (const url of [
      `/api/sets/${id}/cover`,
      '/api/catalog/search?q=ti',
      '/api/catalog/status',
      '/api/missing/export?format=csv',
      '/api/parts/search?q=3001',
      '/api/part-image/0/3001',
    ]) {
      expect([401, 403], url).toContain((await anonPage.request.get(url)).status());
    }
    expect((await anonPage.request.get('/healthz')).status()).toBe(200);
  });
});
