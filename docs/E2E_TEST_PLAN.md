# End-to-end test plan (Playwright)

Adapted from the game-inventory plan. Vitest (PGlite, real migrations) covers the data layer;
Playwright covers what that cannot: server actions, forms and redirects in a real browser against a
real Postgres, render-time failures on every page for every role, and the visibility rules as a
person experiences them (URLs, image endpoints, forms, navigation, HTML and API responses).

## How it runs

- `pnpm e2e` (needs `docker compose up -d db`). `pnpm e2e:smoke` runs the `@smoke` subset.
- `e2e/start-app.mjs` drops and recreates `bricks_e2e`, builds, and starts the app on port 3100.
  `E2E_SKIP_BUILD=1` reuses the last build.
- One worker, one app, one database. Every test starts from an empty catalog (`resetCatalog`) but
  keeps the three role accounts and the seeded LEGO brand.
- `00-first-run.setup.ts` runs first, covers first-run, creates the member and kid accounts and
  saves a storage state per role. Other specs start signed in as admin and use `memberPage`,
  `kidPage` or `anonPage` for other identities.
- Each test fails on unexpected `pageerror` or `console.error` output.
- Mocks (Rebrickable downloads page, archives, images, UPC) arrive with Phase 5.
- `pnpm shots` regenerates reference screenshots into the gitignored `screenshots/` folder.

## Status

| Area                              | Spec                                                                       | Phase |
| --------------------------------- | -------------------------------------------------------------------------- | ----- |
| AUTH, PEOPLE (setup and roles)    | `00-first-run.setup.ts`                                                    | 2     |
| SET, COPY, VIS, PLACE, BRAND, ACT | `sets.spec.ts`                                                             | 3     |
| LIB (library, facets, paging)     | `library.spec.ts`                                                          | 4     |
| TRASH                             | covered inside `sets.spec.ts` for sets and copies; places and purge to add | 3     |
| CAT (catalog import, search)      | `catalog.spec.ts`                                                          | 5     |
| INS (instructions)                | `instructions.spec.ts`                                                     | 6     |
| MISS, SHOP                        | `missing.spec.ts`, `shopping.spec.ts`                                      | 7, 8  |
| VAL (value, collection)           | `value.spec.ts`                                                            | 9     |
| WISH (incl. private marks)        | `wishlist.spec.ts`                                                         | 10    |
| VIS (full leak audit)             | `visibility.spec.ts`                                                       | 11    |
| IMP (CSV import)                  | `import.spec.ts`                                                           | 12    |
| Accessibility (axe)               | `a11y.spec.ts`                                                             | 11    |

## Scenario IDs

IDs are prefixed by area. Each spec names the ID in the test title so a failure points here.

**AUTH**: 01 every entry point redirects to `/setup` on an empty database; 02 setup creates the
household, admin and LEGO brand; 03 validation creates nothing; later: login errors, logout, expired
and deleted sessions, setup unavailable once a user exists.

**SET**: 01 add a LEGO set with N copies at once; 02 add an off-brand set with a new brand; 03
duplicate brand and number links to the existing set; 04 bad price keeps nothing; later: cover
upload (type, size, fake image), tags, theme, hide-from-kids, edit audit, catalog lookup (Phase 5).

**COPY**: 01 build-state menu changes a copy and is audited; 02 edit owner, place, money; 03 add
several copies from the set page; 04 delete guards and trash round trip; later: pieces-checked date.

**PLACE, BRAND**: nested places and delete guard; brands cannot be deleted while they have sets;
later: theme merge and rename.

**LIB**: 01 owned sets with badges and the no-copy toggle; 02 per-copy badge rows, three then "+N
more"; 03 facet links filter, counts, clear; 04 search and sort, natural set-number order; 05
paging; 06 hostile query strings; 07 phone two columns and filter sheet; 08 extra-small single
column. Later: has-instructions filter (Phase 6), completeness counts (Phase 7), value sort.

**VIS**: 01 kid cannot add or edit, sees no prices, hidden sets look unknown (HTML, cover, URL); 02
kid library leaks nothing through counts, tags, themes or brands; 03 admins see which sets are
hidden. Phase 11 adds: replaying captured server-action requests as the kid, every route and API
response checked for hidden data and purchase marks, for admin, member, requester and kid.

**ACT, TRASH, MISS, SHOP, INS, VAL, WISH, IMP, CAT**: written with their phases. The wishlist
purchase-mark tests assert that only the marker ever sees a mark, including in the activity page,
exports, API responses and "last edited" lines.

## Deviations from game-inventory's plan

- No guest links, so no guest specs.
- No BGG mocks. The mock server will serve a trimmed Rebrickable downloads page, a tiny
  `all_downloads.zip`, two or three tiny LDraw ZIPs, the schema SVG, cover images and UPC results.
- Filters are links, so facet specs click links and assert the URL.
