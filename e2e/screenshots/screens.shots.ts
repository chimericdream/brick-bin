// Reference screenshots of the real app, written to the gitignored screenshots/ folder.
// Run with: pnpm shots   (builds the app, then seeds demo data and captures each screen)
import { mkdirSync } from 'node:fs';
import path from 'node:path';

import { expect, test } from '../fixtures';
import { KID } from '../support/roles';

const OUT = path.resolve('screenshots');
mkdirSync(OUT, { recursive: true });

const SIZES = [
  { name: '1440', width: 1440, height: 900 },
  { name: '390', width: 390, height: 844 },
] as const;
const SCHEMES = ['light', 'dark'] as const;

test.describe.configure({ mode: 'serial' });

test('capture the main screens', async ({ browser, db }) => {
  test.setTimeout(180_000);
  const attic = await db.seedLocation('Attic');
  const shelf = await db.seedLocation('Shelf 1', attic);
  const first = await db.seedSet({
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
        ownerEmail: 'member@e2e.test',
        locationId: shelf,
        pricePaidCents: 10999,
      },
      { buildState: 'sealed', locationId: shelf, conditionNotes: 'Box corner dented, 1 cm.' },
    ],
  });
  for (const [name, brand, n, state] of [
    ['Crawler Crane', 'Mould King', '13124', 'built'],
    ['Harbour Lighthouse', 'LEGO', '60460', 'opened'],
    ['Heritage Tram', 'CaDA', 'C61011W', 'in_progress'],
    ['Orchid Lamp', 'Lumibricks', 'LB-3072', 'disassembled'],
  ] as const) {
    await db.seedSet({
      name,
      brand,
      setNumber: n,
      year: 2022,
      pieceCount: 600,
      copies: [{ buildState: state }],
    });
  }
  await db.seedSet({ name: 'Winter Observatory', hiddenFromRestricted: true });

  for (const scheme of SCHEMES) {
    for (const size of SIZES) {
      const context = await browser.newContext({
        viewport: { width: size.width, height: size.height },
        colorScheme: scheme,
        storageState: 'e2e/.tmp/auth/admin.json',
      });
      const p = await context.newPage();
      const shot = async (route: string, name: string, full = true) => {
        await p.goto(`http://127.0.0.1:3100${route}`);
        await p.waitForLoadState('load');
        await p.waitForTimeout(400);
        await p.screenshot({
          path: path.join(OUT, `${name}-${size.name}-${scheme}.png`),
          fullPage: full,
        });
      };
      await shot('/sets', 'library');
      await shot(`/sets/${first}`, 'set');
      await shot('/sets/new', 'add-set');
      await shot('/settings/places', 'settings-places');
      await shot('/settings/brands', 'settings-brands');
      await context.close();
    }
  }

  const kid = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    storageState: KID.storageState,
  });
  const kp = await kid.newPage();
  await kp.goto(`http://127.0.0.1:3100/sets/${first}`);
  await expect(kp.getByRole('heading', { name: 'Dune Rover 4x4', level: 1 })).toBeVisible();
  await kp.screenshot({ path: path.join(OUT, 'kid-set-1440-light.png'), fullPage: true });
  await kid.close();
});
