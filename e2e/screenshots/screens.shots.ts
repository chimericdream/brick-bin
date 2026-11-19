// Reference screenshots of the real app, written to the gitignored screenshots/ folder, with an
// INDEX.md that says what each file shows. Run with: pnpm shots
// (builds the app, seeds an invented household, then captures every screen).
//
// Most screens are captured at 1440 and 390 px in light. The core screens (library, set detail,
// shopping list, collection, wishlist) also get dark. Everything is best effort: a state that
// can't be reached is skipped with a message, so one UI change never loses the whole run.
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import type { BrowserContext, Page } from '@playwright/test';

import { expect, test } from '../fixtures';
import { coverPng, partPng } from '../support/images';
import { ADMIN, KID, MEMBER } from '../support/roles';

const OUT = path.resolve('screenshots');
mkdirSync(OUT, { recursive: true });
const BASE = 'http://127.0.0.1:3100';

const SIZES = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
] as const;
type Size = (typeof SIZES)[number];
const SCHEMES = ['light', 'dark'] as const;
type Scheme = (typeof SCHEMES)[number];

interface Entry {
  route: string;
  description: string;
  files: Set<string>;
}
const index = new Map<string, Entry>();
const skipped: string[] = [];

test.describe.configure({ mode: 'serial' });

test('capture the app screens', async ({ browser, db, rebrickable }) => {
  test.setTimeout(600_000);
  rebrickable.coverImage = (p) => coverPng(p);

  // --- an invented household ------------------------------------------------------------------
  const hh = await db.householdId();
  await db.sql`update households set name = 'Hartley House' where id = ${hh}`;
  await db.seedCatalog();
  await db.seedBrickLinkMappings();
  for (const [colour, part, hex] of [
    [0, '3001', '05131D'],
    [4, '3001', 'C91A09'],
    [4, '3023', 'C91A09'],
    [15, '3020', 'F2F3F2'],
    [71, '4081', 'A0A5A9'],
  ] as const) {
    await db.seedPartImage(colour, part, partPng(hex));
  }

  const attic = await db.seedLocation('Attic');
  const shelf1 = await db.seedLocation('Shelf 1', attic);
  const shelf2 = await db.seedLocation('Shelf 2', attic);
  const living = await db.seedLocation('Living room');
  const cabinet = await db.seedLocation('Display cabinet', living);
  const basement = await db.seedLocation('Basement');
  const tote = await db.seedLocation('Tote 3', basement);

  const ada = ADMIN.email;
  const mo = MEMBER.email;
  const kit = KID.email;
  const ids: Record<string, string> = {};
  const add = async (
    key: string,
    s: Parameters<typeof db.seedSet>[0],
    rb?: string,
  ): Promise<string> => {
    const id = await db.seedSet({ ...s, cover: false });
    await db.seedCover(id, undefined, coverPng(s.name));
    if (rb) await db.linkSet(id, rb);
    ids[key] = id;
    return id;
  };

  await add('dune', {
    name: 'Dune Rover 4x4',
    setNumber: '42188',
    theme: 'Technic',
    year: 2023,
    pieceCount: 1078,
    retailPriceCents: 11999,
    tags: ['Christmas 2025'],
    copies: [
      {
        buildState: 'built',
        ownerEmail: mo,
        locationId: shelf1,
        pricePaidCents: 10999,
        estimatedValueCents: 12900,
        piecesCheckedOn: '2026-09-12',
      },
      { buildState: 'sealed', locationId: shelf1, conditionNotes: 'Box corner dented, 1 cm.' },
    ],
  });
  await add(
    'titanic',
    {
      name: 'Titanic',
      setNumber: '10294',
      theme: 'Icons',
      year: 2021,
      pieceCount: 9092,
      retailPriceCents: 67999,
      tags: ['Gift'],
      copies: [
        {
          buildState: 'built',
          ownerEmail: ada,
          locationId: cabinet,
          pricePaidCents: 59999,
          estimatedValueCents: 75000,
        },
        {
          buildState: 'sealed',
          locationId: tote,
          pricePaidCents: 61000,
          estimatedValueCents: 72000,
        },
      ],
    },
    '10294-1',
  );
  await add(
    'falcon',
    {
      name: 'Millennium Falcon',
      setNumber: '75192',
      theme: 'Star Wars',
      year: 2017,
      pieceCount: 7541,
      retailPriceCents: 79999,
      copies: [
        {
          buildState: 'built',
          ownerEmail: mo,
          locationId: cabinet,
          pricePaidCents: 69900,
          estimatedValueCents: 83000,
        },
      ],
    },
    '75192-1',
  );
  await add('crane', {
    name: 'Crawler Crane',
    brand: 'Mould King',
    setNumber: '13124',
    theme: 'Technic',
    year: 2022,
    pieceCount: 4000,
    copies: [
      { buildState: 'built', locationId: shelf2, pricePaidCents: 8900, estimatedValueCents: 9000 },
    ],
  });
  await add('lighthouse', {
    name: 'Harbour Lighthouse',
    setNumber: '60460',
    theme: 'City',
    year: 2022,
    pieceCount: 602,
    retailPriceCents: 7999,
    copies: [{ buildState: 'opened', ownerEmail: kit, locationId: shelf1 }],
  });
  await add('tram', {
    name: 'Heritage Tram',
    brand: 'CaDA',
    setNumber: 'C61011W',
    theme: 'Vehicles',
    year: 2022,
    pieceCount: 1250,
    copies: [{ buildState: 'in_progress', ownerEmail: kit, locationId: shelf2 }],
  });
  await add('lamp', {
    name: 'Orchid Lamp',
    brand: 'Lumibricks',
    setNumber: 'LB-3072',
    theme: 'Botanical',
    year: 2023,
    pieceCount: 780,
    copies: [{ buildState: 'disassembled', locationId: tote, pricePaidCents: 4500 }],
  });
  await add('tank', {
    name: 'Sherman Tank',
    brand: 'COBI',
    setNumber: '2551',
    theme: 'Historical',
    year: 2021,
    pieceCount: 800,
    copies: [
      { buildState: 'sealed', locationId: tote, pricePaidCents: 3500 },
      { buildState: 'sealed', locationId: tote, pricePaidCents: 3500 },
      { buildState: 'built', ownerEmail: mo, locationId: shelf2, pricePaidCents: 3500 },
    ],
  });
  await add('cabin', {
    name: 'Cabin in the Pines',
    brand: 'BlueBrixx',
    setNumber: '107861',
    theme: 'Buildings',
    year: 2024,
    pieceCount: 1330,
    copies: [{ buildState: 'sealed', locationId: tote, pricePaidCents: 6900 }],
  });
  await add('bonsai', {
    name: 'Bonsai Tree',
    setNumber: '10281',
    theme: 'Icons',
    year: 2021,
    pieceCount: 878,
    retailPriceCents: 4999,
    copies: [
      {
        buildState: 'built',
        ownerEmail: ada,
        locationId: cabinet,
        pricePaidCents: 4999,
        estimatedValueCents: 6500,
      },
    ],
  });
  await add('digger', {
    name: 'Mini Excavator',
    setNumber: '30620',
    theme: 'City',
    year: 2024,
    pieceCount: 71,
    copies: Array.from({ length: 5 }, () => ({
      buildState: 'sealed' as const,
      locationId: tote,
      pricePaidCents: 499,
    })),
  });
  await add('shuttle', {
    name: 'Space Shuttle Discovery',
    setNumber: '10283',
    theme: 'Icons',
    year: 2021,
    pieceCount: 2354,
    retailPriceCents: 19999,
    copies: [{ buildState: 'in_progress', ownerEmail: ada, locationId: shelf1 }],
  });
  await add('radio', {
    name: 'Retro Radio',
    brand: 'Mould King',
    setNumber: '10052',
    theme: 'Buildings',
    year: 2023,
    pieceCount: 1100,
    copies: [{ buildState: 'mixed', locationId: tote, pricePaidCents: 5200 }],
  });
  await add('observatory', {
    name: 'Winter Observatory',
    setNumber: '10340',
    theme: 'Icons',
    year: 2025,
    pieceCount: 1200,
    hiddenFromRestricted: true,
    copies: [{ buildState: 'sealed', locationId: tote, pricePaidCents: 11999 }],
  });

  // A few missing pieces, so the badges, picker and shopping list have something to show.
  const titanicCopy = await db.firstCopyId(ids.titanic!);
  await db.seedMissing(titanicCopy, { partNum: '3023', colorId: 4, quantity: 2, ageMinutes: 600 });
  await db.seedMissing(titanicCopy, { partNum: '3001', colorId: 0, quantity: 4, ageMinutes: 590 });
  await db.seedMissing(titanicCopy, { partNum: '3020', colorId: 15, quantity: 6, ageMinutes: 580 });
  await db.seedMissing(await db.firstCopyId(ids.falcon!), {
    partNum: '3001',
    colorId: 4,
    quantity: 3,
    ageMinutes: 300,
  });
  await db.seedMissing(await db.firstCopyId(ids.dune!), {
    partNum: '3023',
    colorId: 4,
    quantity: 1,
    ageMinutes: 100,
  });

  // Valuations: most recent, one over a year old.
  await db.sql`update copies set valued_on = current_date - 40 where estimated_value_cents is not null`;
  await db.sql`update copies set valued_on = current_date - 500 where set_id = ${ids.bonsai!}`;

  // Wishlists.
  await db.seedWish(ada, 'Hogwarts Castle', { priceCents: 46999, notes: 'The big one. Birthday?' });
  await db.seedWish(ada, 'Millennium Falcon (2019)', { rbSetNum: '75257-1', priceCents: 15999 });
  await db.seedWish(mo, 'Titanic Lifeboat Display', { priceCents: 3999, notes: 'Any colour.' });
  await db.seedWish(kit, 'Pirate Ship', { priceCents: 4000, notes: 'Please.' });
  await db.seedWish(kit, 'Space Shuttle Discovery', { rbSetNum: '75192-1' });

  // A short activity trail and a finished catalog import.
  const adaId = await db.userId(ada);
  const moId = await db.userId(mo);
  const trail: [string, string, string, string, Record<string, [unknown, unknown]>, string][] = [
    [adaId, 'set', ids.shuttle!, 'create', { name: [null, 'Space Shuttle Discovery'] }, '2 hours'],
    [moId, 'copy', titanicCopy, 'update', { buildState: ['sealed', 'built'] }, '1 day'],
    [adaId, 'missing_item', titanicCopy, 'create', { name: [null, 'Plate 1 x 2'] }, '1 day'],
    [adaId, 'set', ids.cabin!, 'create', { name: [null, 'Cabin in the Pines'] }, '3 days'],
    [moId, 'copy', ids.dune!, 'update', { locationId: [null, 'Shelf 1'] }, '4 days'],
    [adaId, 'brand', ids.crane!, 'create', { name: [null, 'Mould King'] }, '9 days'],
  ];
  for (const [actor, type, entity, action, changes, ago] of trail) {
    await db.sql`
      insert into audit_log (household_id, actor_user_id, entity_type, entity_id, action, changes, at)
      values (${hh}, ${actor}, ${type}, ${entity}, ${action}, ${db.sql.json(changes as never)},
              now() - ${ago}::interval)`;
  }
  await db.sql`
    insert into catalog_runs (started_at, finished_at, status, started_by_user_id, source, files_done,
                              files_total, files_downloaded, files_skipped, bytes_downloaded, rows_loaded)
    values (now() - interval '20 days', now() - interval '20 days' + interval '14 minutes', 'succeeded',
            ${adaId}, 'pasted', 196, 196, 196, 0, 6100000000, 3100000)`;

  // --- capture ------------------------------------------------------------------------------
  const settle = async (p: Page) => {
    await p.waitForLoadState('load');
    await p.waitForTimeout(600);
  };
  const record = (name: string, route: string, description: string, file: string) => {
    const entry = index.get(name) ?? { route, description, files: new Set<string>() };
    entry.files.add(file);
    index.set(name, entry);
  };
  const snap = async (
    p: Page,
    name: string,
    route: string,
    description: string,
    size: Size,
    scheme: Scheme,
    fullPage = true,
  ) => {
    const file = `${name}-${size.name}-${scheme}.png`;
    await p.screenshot({ path: path.join(OUT, file), fullPage });
    record(name, route, description, file);
  };
  /** Opens a route and captures it. */
  const shot = async (
    p: Page,
    size: Size,
    scheme: Scheme,
    name: string,
    route: string,
    description: string,
  ) => {
    try {
      await p.goto(`${BASE}${route}`);
      await settle(p);
      await snap(p, name, route, description, size, scheme);
    } catch (e) {
      skipped.push(`${name} ${size.name} ${scheme}: ${String(e).split('\n')[0]}`);
    }
  };
  /** A state reached by interaction; a failure skips it instead of failing the run. */
  const state = async (
    p: Page,
    size: Size,
    scheme: Scheme,
    name: string,
    route: string,
    description: string,
    act: () => Promise<void>,
    fullPage = false,
  ) => {
    try {
      await p.goto(`${BASE}${route}`);
      await settle(p);
      await act();
      await p.waitForTimeout(500);
      await snap(p, name, route, description, size, scheme, fullPage);
    } catch (e) {
      skipped.push(`${name} ${size.name} ${scheme}: ${String(e).split('\n')[0]}`);
    }
  };
  const open = async (storageState: string | undefined, size: Size, scheme: Scheme) => {
    const context = await browser.newContext({
      viewport: { width: size.width, height: size.height },
      colorScheme: scheme,
      storageState,
    });
    const page = await context.newPage();
    page.setDefaultTimeout(8000);
    return { context, page };
  };
  const close = (c: BrowserContext) => c.close();

  try {
    for (const scheme of SCHEMES) {
      for (const size of SIZES) {
        const { context, page: p } = await open(ADMIN.storageState, size, scheme);
        const light = scheme === 'light';

        // Core screens: light and dark.
        await shot(
          p,
          size,
          scheme,
          'library',
          '/sets',
          'Library: the grid of sets with the facet filters and per-copy build-state badges.',
        );
        await shot(
          p,
          size,
          scheme,
          'set',
          `/sets/${ids.dune}`,
          'Set detail with two copies (one built, one sealed), tags and prices.',
        );
        await shot(
          p,
          size,
          scheme,
          'set-missing',
          `/sets/${ids.titanic}`,
          'Set detail for a set with a copy that is missing pieces (catalog-linked).',
        );
        await shot(
          p,
          size,
          scheme,
          'shopping-list',
          '/missing',
          'Shopping list: missing pieces grouped by part and colour, with export links.',
        );
        await shot(
          p,
          size,
          scheme,
          'collection',
          '/collection',
          'Collection: totals, paid versus estimated value, by brand, theme and build state, stale values.',
        );
        await shot(
          p,
          size,
          scheme,
          'wishlist',
          '/wishlist',
          "Wishlist as the admin sees it: everyone's lists, with the 'I bought this' and 'We got it' actions.",
        );
        if (!light) {
          await close(context);
          continue;
        }

        // The rest: light only.
        await shot(
          p,
          size,
          scheme,
          'more',
          '/more',
          'Phone "More" tab: Collection, Import, Settings and Sign out.',
        );
        await shot(
          p,
          size,
          scheme,
          'add-set',
          '/sets/new',
          'Add a set: catalog lookup and the manual form.',
        );
        await shot(p, size, scheme, 'edit-set', `/sets/${ids.dune}/edit`, 'Edit a set.');
        await shot(
          p,
          size,
          scheme,
          'missing-picker',
          `/copies/${titanicCopy}/missing`,
          "Record missing pieces: the picker for one copy, with the set's own parts and the list so far.",
        );
        await shot(
          p,
          size,
          scheme,
          'shopping-trip',
          '/missing?trip=1',
          'Shopping list in store-trip mode (tick parts off as they go in the basket).',
        );
        await shot(p, size, scheme, 'import', '/import', 'Import sets from a CSV file.');
        await shot(p, size, scheme, 'settings', '/settings', 'Settings home.');
        await shot(
          p,
          size,
          scheme,
          'settings-people',
          '/settings/people',
          'Settings: people and roles (admin, member, kid).',
        );
        await shot(
          p,
          size,
          scheme,
          'settings-places',
          '/settings/places',
          'Settings: places where sets are kept, as a tree.',
        );
        await shot(
          p,
          size,
          scheme,
          'settings-brands',
          '/settings/brands',
          'Settings: brands and themes.',
        );
        await shot(
          p,
          size,
          scheme,
          'settings-catalog',
          '/settings/catalog',
          'Settings: the LEGO catalog import (admin only), after a finished run.',
        );
        await shot(
          p,
          size,
          scheme,
          'settings-activity',
          '/settings/activity',
          'Settings: the activity trail.',
        );
        await shot(
          p,
          size,
          scheme,
          'settings-trash',
          '/settings/trash',
          'Settings: trash with restore.',
        );
        await shot(
          p,
          size,
          scheme,
          'not-found',
          '/this-page-does-not-exist',
          'The not-found page.',
        );

        // Interaction states.
        await state(
          p,
          size,
          scheme,
          'library-search',
          '/sets?q=crane',
          'Library with a search typed in.',
          async () => {
            await p
              .getByPlaceholder(/Search/)
              .first()
              .fill('crane');
            await p.keyboard.press('Enter');
            await p.waitForLoadState('load');
          },
          true,
        );
        if (size.width > 600) {
          await state(
            p,
            size,
            scheme,
            'library-filtered',
            '/sets',
            'Library with a build state and a brand filter on.',
            async () => {
              await p.getByRole('button', { name: /^Sealed/ }).click();
              await p.waitForURL(/state=sealed/);
              await p
                .getByRole('complementary', { name: 'Filters' })
                .getByRole('link', { name: /^LEGO/ })
                .click();
              await p.waitForURL(/brand=/);
              await settle(p);
            },
            true,
          );
        } else {
          await state(
            p,
            size,
            scheme,
            'library-filters-sheet',
            '/sets',
            'Phone: the filters sheet opened from the library toolbar.',
            async () => {
              await p
                .getByRole('button', { name: /Filters/ })
                .first()
                .click();
            },
          );
        }
        await state(
          p,
          size,
          scheme,
          'set-build-menu',
          `/sets/${ids.dune}`,
          'The one-tap build-state menu on a copy.',
          async () => {
            await p
              .getByRole('button', { name: /Build state of copy \d: Built/ })
              .first()
              .click();
          },
        );
        await state(
          p,
          size,
          scheme,
          'set-edit-copy',
          `/sets/${ids.dune}`,
          'The edit-copy dialog: owner, place, date, prices, condition notes.',
          async () => {
            await p
              .getByRole('button', { name: /Edit copy/ })
              .first()
              .click();
            await expect(p.getByRole('dialog')).toBeVisible();
          },
        );
        await state(
          p,
          size,
          scheme,
          'set-remove-copy',
          `/sets/${ids.dune}`,
          'The confirm dialog shown before anything is deleted.',
          async () => {
            await p.getByRole('button', { name: 'Remove copy' }).first().click();
            await expect(p.getByRole('dialog')).toBeVisible();
          },
        );
        await state(
          p,
          size,
          scheme,
          'add-set-lookup',
          '/sets/new',
          'Add a set: catalog lookup showing matches as you type.',
          async () => {
            await p.getByLabel('Set number or name').fill('millen');
            await expect(p.getByRole('list', { name: 'Catalog matches' })).toBeVisible();
          },
        );
        await state(
          p,
          size,
          scheme,
          'add-set-picked',
          '/sets/new',
          'Add a set: a catalog match picked, the form filled in from it.',
          async () => {
            await p.getByLabel('Set number or name').fill('titan');
            await p
              .getByRole('list', { name: 'Catalog matches' })
              .getByRole('button', { name: /Titanic/ })
              .click();
          },
          true,
        );
        await state(
          p,
          size,
          scheme,
          'missing-picker-search',
          `/copies/${titanicCopy}/missing`,
          "Missing pieces: the 'Search the whole catalog' tab.",
          async () => {
            await p.getByRole('tab').nth(1).click();
          },
        );
        await state(
          p,
          size,
          scheme,
          'wishlist-bought',
          '/wishlist',
          "The private 'I bought this' dialog.",
          async () => {
            await p.getByRole('button', { name: 'I bought this' }).first().click();
            await expect(p.getByRole('dialog')).toBeVisible();
          },
        );
        await state(
          p,
          size,
          scheme,
          'wishlist-we-got-it',
          '/wishlist',
          "The 'We got it' dialog that turns a wish into a set.",
          async () => {
            await p.getByRole('button', { name: 'We got it' }).first().click();
            await expect(p.getByRole('dialog')).toBeVisible();
          },
        );
        await close(context);

        // Signed out.
        const anon = await open(undefined, size, scheme);
        await shot(anon.page, size, scheme, 'login', '/login', 'Sign in.');
        await state(
          anon.page,
          size,
          scheme,
          'login-error',
          '/login',
          'Sign in after a wrong password.',
          async () => {
            await anon.page.getByLabel(/Email/).fill(ADMIN.email);
            await anon.page.getByLabel(/Password/).fill('wrong-password');
            await anon.page.getByRole('button', { name: /Sign in/ }).click();
            await anon.page.waitForTimeout(800);
          },
          true,
        );
        await close(anon.context);

        // A kid profile: no prices, no shopping list, hidden sets absent.
        const kid = await open(KID.storageState, size, scheme);
        await shot(
          kid.page,
          size,
          scheme,
          'kid-library',
          '/sets',
          'Library as a kid profile sees it: no prices or shopping list, hidden sets absent.',
        );
        await shot(
          kid.page,
          size,
          scheme,
          'kid-set',
          `/sets/${ids.dune}`,
          'Set detail as a kid profile sees it: read-only, no prices.',
        );
        await shot(
          kid.page,
          size,
          scheme,
          'kid-wishlist',
          '/wishlist',
          "A kid's own wishlist: they can add and edit, with no price or purchase actions.",
        );
        await close(kid.context);
      }
    }
  } finally {
    // --- index --------------------------------------------------------------------------------
    const rows = [...index.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([name, e]) => {
        const files = [...e.files].sort().join('<br>');
        return `| ${name} | \`${e.route}\` | ${e.description} | ${files} |`;
      });
    const notes = [
      '# Brick Bin app screenshots',
      '',
      'Reference captures of the current app. Every household, set, price and person is invented.',
      'Files are `<screen>-<width>-<theme>.png`: 1440 is desktop, 390 is phone. Full-page unless the',
      'description says it is a dialog or menu, which is a viewport capture.',
      '',
      '- Set covers are generated stand-ins (a coloured panel with a banner), and part pictures are drawn',
      '  stand-ins on white. Real box art and real part renders will look different, so do not design',
      '  around these exact images.',
      '- On phone full-page captures the fixed bottom tab bar can appear in the middle of the page. In use',
      '  it sits at the bottom of the screen.',
      '- Not captured: the first-run setup page (it shares the sign-in layout and asks for a household name,',
      '  your name, email and password), the catalog import while running, and the instructions panel with',
      '  uploaded PDFs.',
      '',
      '| Screen | URL path | What it shows | Files |',
      '| --- | --- | --- | --- |',
      ...rows,
      '',
    ];
    if (skipped.length) {
      notes.push('## Skipped in this run', '', ...skipped.map((s) => `- ${s}`), '');
    }
    writeFileSync(path.join(OUT, 'INDEX.md'), notes.join('\n'));
    if (skipped.length) console.log(`Skipped states:\n${skipped.join('\n')}`);
  }
});
