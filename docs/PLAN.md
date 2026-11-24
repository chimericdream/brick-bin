# Brick Bin: implementation plan

**Brick Bin** (`brick-bin.app`) is a self-hosted web app for a household's collection of
building-brick sets: LEGO and off-brand (Mould King, CaDA, COBI, BlueBrixx, Lumibricks and so on).
It is a sibling of `game-inventory` ("The Shelf", `C:\Users\bill\code\game-inventory`) and reuses
its stack, architecture rules and deployment. The repo is `brick-bin`.

Decisions so far (2026-11-15):

| Topic             | Decision                                                                                                                                                                                                                                                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Name              | **Brick Bin**, domain `brick-bin.app`                                                                                                                                                                                                                                                         |
| Depth             | Sets and copies with **build state**, condition and location. **Missing pieces are real catalog parts** (part + colour + quantity), with a shopping list across sets. No bulk-brick inventory.                                                                                                |
| Codebase          | **New repo** that copies the proven parts of `game-inventory` and adapts them. No shared packages, no shared login.                                                                                                                                                                           |
| v1 features       | **Kid (restricted) profiles**, **instructions**, **value tracking**, **wishlist**, **missing-parts shopping list**                                                                                                                                                                            |
| Kid profiles      | Read-only, except they can add, edit and remove items on **their own wishlist**                                                                                                                                                                                                               |
| Wishlist purchase | Marking an item purchased is **visible only to the person who marked it**: not the requester, not other members, not admins, not the activity log                                                                                                                                             |
| Catalog data      | Rebrickable bulk downloads, fetched **only when an admin presses a button**, at most once every **48 hours** after the last successful run. Never scheduled. Until Rebrickable says reading their downloads page is fine, the admin **pastes the page's HTML** instead of the app fetching it |
| Duplicates        | Several copies of the same set are normal: one row per physical box, each with its own build state and missing pieces                                                                                                                                                                         |
| Instructions      | PDFs for sets we own are **stored and served by the app**, either uploaded or saved from a link                                                                                                                                                                                               |
| Currency          | **USD** only in v1; configurable later                                                                                                                                                                                                                                                        |
| Brands            | **LEGO** seeded at first run; others added as needed                                                                                                                                                                                                                                          |
| Not in v1         | Guest share links, minifigures as owned entities, build log, loans, ratings. See [Later](#15-later-not-in-v1).                                                                                                                                                                                |

---

## 1. Stack and conventions (same as game-inventory)

- Next.js (App Router) + TypeScript, strict. The Next.js version has breaking changes from older
  docs: read `node_modules/next/dist/docs/` before writing routing, caching, route-handler or
  server-action code.
- **Mantine** for UI. No Tailwind or any utility-CSS framework. CSS modules with
  `postcss-preset-mantine`, `--app-*` CSS variables for colours so light and dark both work.
- PostgreSQL 17 + Drizzle ORM, migrations with drizzle-kit.
- pnpm, tool versions pinned with **mise** (`node = "24"`, `pnpm = "12"`).
- Lint and format with the **oxc stack** (oxlint + oxfmt). No ESLint, no Prettier.
- Vitest for unit tests, running the real migrations against in-process Postgres (PGlite).
  Playwright for end-to-end tests against a real local Postgres.
- zod for every external input (forms, route params, CSV rows, the Rebrickable page and files).
- Fonts and assets are **self-hosted**. Nothing is loaded from a CDN at runtime, and browsers
  never load images from third parties.
- Config comes from environment variables only. Update `.env.example` with every new variable.
- Small conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`).
- Workflow: commit on `main` until v1 is usable and deployed (as game-inventory did), then switch
  to branches + PRs with CI as the gate, because a push to `main` deploys.
- `AGENTS.md` holds agent-neutral instructions, and `CLAUDE.md` imports it. Copy the
  game-inventory `AGENTS.md` and adapt it in Phase 0. Add the MemPalace shared-brain block with
  the `mempalace-project-rules` skill.
- New dependencies beyond game-inventory's: a streaming unzip library (`yauzl` or similar) and a
  small HTML parser (`node-html-parser` or similar) for the Rebrickable downloads page.

## 2. Architecture rules (carried over)

1. **Household scoping.** Every domain table has `household_id`. Every query goes through the
   data-access layer in `src/server/data/`, which takes a `DataContext`
   (`{ db, householdId, viewer }`). Routes and components never import the schema to query
   directly. Single-household mode is the default, and the household stays invisible in the UI.
   - **One documented exception:** the reference catalog tables (`rb_*`, section 5) are global,
     read-only reference data with no `household_id`. Only the catalog import job writes to them.
     Reads still go through `src/server/data/reference.ts`.
   - Household rows point at catalog rows by Rebrickable's **natural keys** (`set_num`,
     `part_num`, `color_id`, `fig_num`), not by foreign keys, so replacing the catalog can never
     break or cascade into household data.
2. **Set vs copy.** `sets` is the design (a set number from a brand). `copies` is a physical box
   someone owns, with its own build state, owner, location, condition, value and missing pieces.
   Per-copy facts never go on the set.
3. **Audit everything.** Every mutation writes an `audit_log` row in the same transaction
   (`recordAudit`) and stamps `created_by_user_id` / `updated_by_user_id`. Passwords and tokens are
   never logged (`NEVER_LOG`). **The one exception is wishlist purchase marks** (section 6.5),
   which are never audited and never touch the item's stamps, so the activity log cannot reveal a
   purchase. This mirrors game-inventory's exception for ratings.
4. **Soft deletes.** Sets, copies, instructions, wishlist items and locations get `deleted_at` /
   `deleted_by_user_id` and are hidden from every read. Restore, permanent delete and the automatic
   purge (`TRASH_RETENTION_DAYS`, default 30) live in `src/server/data/trash.ts`. A set with live
   copies cannot be deleted. Every delete button goes through `ConfirmDelete`. Missing-part rows are
   small child rows: they are resolved, or deleted for real with an audit row (section 4).
5. **Visibility is enforced on the server.** Restricted (kid) profiles get filtered SQL and
   redacted fields from the data layer, never only hidden UI. Purchase marks are filtered to the
   marker in SQL. Tests assert hidden data never appears in restricted or other users' responses
   (section 7).
6. **No background downloading.** The app never fetches anything from the internet on a schedule.
   External requests happen only when a person asks: an admin starting a catalog import, or a
   member saving a set whose cover comes from the catalog.

## 3. What to copy from game-inventory

Copy these files, then rename "game" to "set" and remove what v1 does not use. Each copied module
keeps its tests, which are adapted alongside it.

| From game-inventory                                                                           | Use in Brick Bin                                                                                                 |
| --------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `mise.toml`, `.oxlintrc.json`, `.oxfmtrc.json`, `tsconfig.json`, `postcss.config.cjs`         | As is                                                                                                            |
| `vitest.config.ts`, `src/server/db/test-db.ts`                                                | As is (PGlite + real migrations)                                                                                 |
| `playwright.config.ts`, `e2e/start-app.mjs`, `e2e/support/`, `e2e/fixtures/`                  | Adapt fixtures to sets                                                                                           |
| `e2e/mocks/external-server.ts`                                                                | Replace BGG mocks with a mock Rebrickable (downloads page, archives, images) and UPC                             |
| `e2e/screenshots/run.mjs` (`pnpm shots`)                                                      | Adapt routes                                                                                                     |
| `src/server/auth/*` (accounts, password, sessions, current)                                   | As is: first-run creates household + admin, hashed session tokens, roles `admin` / `member` / `restricted`       |
| `src/server/db/client.ts`, `migrate.ts`                                                       | As is (auto-migrate on start, `AUTO_MIGRATE=false` to skip)                                                      |
| `src/server/data/context.ts`, `ids.ts`, `audit.ts`, `trash.ts`, `visibility.ts`               | Adapt entity kinds                                                                                               |
| `src/server/data/locations*` logic (nested places, delete guards, counts)                     | As is                                                                                                            |
| `src/server/data/wishlist.ts`                                                                 | Adapt fields, add restricted writes and private purchase marks (section 6.5)                                     |
| `src/server/import/csv.ts` (column mapping, failed-rows CSV download)                         | Adapt columns, add Rebrickable/Brickset collection formats                                                       |
| `src/server/lookup/upc.ts`                                                                    | As is, plus set-number extraction                                                                                |
| `src/server/storage.ts`                                                                       | Cover images as is; new **streaming** functions for PDFs and catalog files                                       |
| `src/server/trash-schedule.ts`, `src/instrumentation.ts`                                      | Trash purge only (it is local, so it is allowed to be scheduled). Also marks interrupted imports failed on start |
| `src/app/(auth)/`, `src/app/(app)/Shell.tsx`, `settings/` (people, places, activity)          | Adapt; drop the guest-link and players tabs                                                                      |
| `src/components/ConfirmDelete.tsx`, `ThemeToggle.tsx`, `Links.tsx`, not-found page            | As is                                                                                                            |
| `src/components/shelf/*`                                                                      | Starting point only: box tiles need a landscape aspect (section 9)                                               |
| `Dockerfile`, `docker-compose.yml`, `docker-compose.prod.yml`, `deploy/`, `scripts/backup.sh` | Rename containers and volumes; backups change for PDFs and catalog files (section 11)                            |
| `.github/workflows/ci.yml`                                                                    | As is (check job, 4 e2e shards + gate job, GHCR publish on `main`)                                               |
| `docs/E2E_TEST_PLAN.md`                                                                       | Template for the new test plan                                                                                   |

Do **not** copy: players, plays, ratings, loans, share links, guest pages (`/g/`), BGG lookup,
expansions, accessories, the marketing site (`site/`), the game-specific detail tables, or the
existing `drizzle/` migrations. The new repo starts its own migration history from `0000`.

## 4. Data model

The schema reuses the game-inventory helpers: `authorship()` (created/updated by), `trashable()`
(deleted at/by) and `stamps()` (created/updated at). Every household table has `household_id`
referencing `households` with `on delete cascade`. Money is stored as integer cents.

### Accounts (copied)

- `households`, `users` (role enum `admin | member | restricted`), `sessions` (SHA-256 of token).

### Reference catalog (global, section 5)

One table per Rebrickable CSV, named `rb_<file>` with the CSV's columns as they are. They are
loaded by the import job and never edited by the app.

| Table                   | Used for                                                                         |
| ----------------------- | -------------------------------------------------------------------------------- |
| `rb_themes`             | Theme tree for LEGO sets                                                         |
| `rb_colors`             | Colour names, RGB swatches, transparency; the colour picker for missing parts    |
| `rb_part_categories`    | Filter in the part picker                                                        |
| `rb_parts`              | Part search (number, name, category)                                             |
| `rb_part_relationships` | "Any of these molds/alternates will do" hints on the shopping list               |
| `rb_elements`           | LEGO element ids (part + colour), for Pick a Brick-style shopping                |
| `rb_sets`               | Set lookup when adding a set; covers                                             |
| `rb_minifigs`           | Missing minifigures from a set                                                   |
| `rb_inventories`        | A set's inventory versions                                                       |
| `rb_inventory_parts`    | The parts in a set (the missing-part picker); largest table, over a million rows |
| `rb_inventory_minifigs` | Minifigures in a set                                                             |
| `rb_inventory_sets`     | Sub-sets inside a set (bundles)                                                  |
| `rb_color_mappings`     | Rebrickable colour id to BrickLink/BrickOwl/LEGO/LDraw ids (BrickLink export)    |
| `rb_part_mappings`      | Rebrickable part number to external ids (BrickLink export)                       |
| `rb_set_mappings`       | Rebrickable set/minifig number to external ids                                   |

Indexes are only what the picker and search need (lower(`name`) and prefix indexes on numbers,
`rb_inventory_parts (inventory_id)`, `rb_elements (part_num, color_id)`). Columns come from the
CSV headers. The mapping files' exact columns must be read from the downloaded schema SVG and the
CSV headers in Phase 5, not assumed.

Import bookkeeping (global):

- `catalog_runs`: `id`, `started_at`, `finished_at`, `status` (`running | succeeded | failed`),
  `started_by_user_id`, `error`, counts (files downloaded, skipped as unchanged, rows loaded,
  bytes).
- `catalog_files`: one row per remote file: `url`, `kind` (`csv_archive | ldraw_zip | schema_svg |
  downloads_page`), `color_id` and `color_name` (LDraw only), `remote_date` (from the page),
  `etag`, `last_modified`, `bytes`, `fetched_at`, `extracted_at`. This drives "only changed
  files" and the at-most-once-a-day rule (section 5).
- `catalog_part_images`: (`part_num`, `color_id`) for every extracted LDraw image, rebuilt by
  each run. Used to pick a fallback colour when a part has no image in the requested one.

### Catalog (household)

**`brands`**: `name` (e.g. "LEGO", "Mould King"), `is_lego` (true for the seeded LEGO row, which
enables catalog lookup and LEGO.com instruction links), `website_url`, `notes`, authorship,
stamps. Unique (`household_id`, lower(`name`)). Seeded at first run with **LEGO**. Members add
other brands inline from the set form ("+ New brand"). A brand with sets cannot be deleted; an
unused one is deleted for real (audited).

**`themes`**: `name`, `parent_id` (self, nested like Rebrickable's "Star Wars > Ultimate
Collector Series"), `brand_id` (null = any brand), `rb_theme_id` (null for custom themes). Adding
a LEGO set from the catalog creates the matching household theme chain on demand (find-or-create
by `rb_theme_id`), so only themes you own sets in show up as filters.

**`sets`** (the design):

| Column                                            | Notes                                                                                              |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| `brand_id`                                        | required                                                                                           |
| `set_number`                                      | text, as printed on the box (`10294`, `10294-1`, `31211`, `C61042W`). Optional for unnumbered kits |
| `name`                                            | required                                                                                           |
| `theme_id`                                        | nullable                                                                                           |
| `year`, `piece_count`, `minifig_count`, `min_age` | ints                                                                                               |
| `description`                                     | text, keeps line breaks                                                                            |
| `retail_price_cents`                              | original RRP, manual                                                                               |
| `cover_image`                                     | relative path under `DATA_DIR`                                                                     |
| `rb_set_num`                                      | Rebrickable id when linked (`10294-1`). Drives re-sync and the set's part inventory                |
| `rb_inventory_version`                            | which inventory version the picker uses (default: the highest)                                     |
| `designer`                                        | optional text, e.g. the MOC designer an off-brand kit is licensed from                             |
| `hidden_from_restricted`                          | boolean, default false (section 7)                                                                 |
| `notes`                                           | text                                                                                               |
| trashable, authorship, stamps                     |                                                                                                    |

Partial unique index: (`household_id`, `brand_id`, lower(`set_number`)) where `deleted_at is null`
and `set_number is not null`. The form shows "You already have this set: add another copy?"
instead of failing on the constraint.

**`copies`** (a box you own):

| Column                        | Notes                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `set_id`                      | required                                                                                                                                          |
| `owner_user_id`               | nullable ("Ours")                                                                                                                                 |
| `location_id`                 | nullable                                                                                                                                          |
| `build_state`                 | enum `sealed`, `opened` (opened, not built), `in_progress`, `built`, `disassembled` (taken apart, kept together), `mixed` (parted into bulk bins) |
| `pieces_checked_on`           | date of the last full piece check; null means never checked                                                                                       |
| `has_box`, `has_instructions` | booleans for the physical box and paper booklets (default true)                                                                                   |
| `condition_notes`             | free text (box dents, yellowed bricks, stickers applied crooked)                                                                                  |
| `acquired_on`                 | date                                                                                                                                              |
| `price_paid_cents`            | what you paid                                                                                                                                     |
| `estimated_value_cents`       | manual current value                                                                                                                              |
| `valued_on`                   | date the estimate was last set, shown as "valued 8 months ago"                                                                                    |
| `notes`                       |                                                                                                                                                   |
| trashable, authorship, stamps |                                                                                                                                                   |

**Completeness is derived**, not stored:

- **Missing N pieces** when the copy has open missing-item rows.
- **Complete (checked Mar 2026)** when there are none and `pieces_checked_on` is set.
- **Not checked** otherwise. Sealed copies show "Sealed" instead.

The library filter offers the same three values. `build_state` changes are common, so the copy
card has a one-tap build state menu as well as the full edit form. Each change is audited, so the
activity trail doubles as a light build history until a real build log arrives.

Duplicates: one row per physical box (as in game-inventory). The add form has a "How many?"
number that creates N identical copies in one transaction, so five copies of the same polybag are
one action.

**`copy_missing_items`** (replaces the free-text missing notes):

| Column                                                   | Notes                                                                                                      |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `copy_id`                                                | required                                                                                                   |
| `kind`                                                   | enum `part`, `minifig`, `other`                                                                            |
| `rb_part_num`, `rb_color_id`                             | for `part`                                                                                                 |
| `rb_fig_num`                                             | for `minifig`                                                                                              |
| `quantity`                                               | missing count, at least 1                                                                                  |
| `snapshot_name`, `snapshot_color_name`, `snapshot_image` | copied from the catalog when added, so the row still reads well if Rebrickable renumbers or drops the part |
| `description`                                            | for `other`: a non-catalog off-brand piece, a sticker sheet, a printed tile you cannot find                |
| `from_inventory`                                         | true when picked from the set's own inventory (false = picked from the whole catalog)                      |
| `resolved_at`, `resolved_by_user_id`, `resolution`       | enum `found`, `bought`, `substituted`. Null while still missing                                            |
| `notes`                                                  | e.g. "the one with the dent is fine"                                                                       |
| authorship, stamps                                       |                                                                                                            |

Unique (`copy_id`, `kind`, `rb_part_num`, `rb_color_id`, `rb_fig_num`) among unresolved rows, so
adding the same part again raises the quantity instead of making a second row. Partly found
("found 2 of 3") lowers the quantity and records the found ones as a resolved row. Removing a row
entered by mistake is a real delete with an audit row. Trashing a copy hides its missing items
(the same rule game-inventory uses for accessories).

**`set_instructions`**: `set_id`, `kind` enum `file | link`, `label` ("Book 1", "Alternate build:
lion"), `file_path`, `file_bytes`, `sha256` (also catches duplicate uploads), `url` (for plain
links), `source_url` (where a saved PDF was downloaded from), `sort_order`,
trashable, authorship, stamps. Instructions belong to the design (the set), not the copy.

**`locations`**: copied as is (nested places, counts, delete guard).

**`tags`** and **`set_tags`**: copied ("Christmas 2025", "Display room", "Kid A's").

**`wishlist_items`**: `title`, `brand_id` (nullable), `set_number`, `rb_set_num`, `cover_image`,
`url`, `price_cents` (the price seen), `notes` (for gift-givers), `requested_by_user_id`,
trashable, authorship, stamps.

**`wishlist_purchases`** (private purchase marks, section 6.5): `household_id`, `item_id`,
`user_id` (the marker), `purchased_on`, `note`. Primary key (`item_id`, `user_id`). No audit rows,
no authorship, and it never updates the item's stamps.

**`audit_log`**: copied as is. Entity kinds: `set`, `copy`, `missing_item`, `instruction`,
`wishlist_item`, `location`, `brand`, `theme`, `tag`, `user`, `catalog_run`.

### Restore guards (adapted from game-inventory)

- A copy cannot be restored while its set is in the trash ("restore the set first").
- A copy cannot be restored into a trashed location; offer "restore without a location".
- Trashing a set requires that it has no live copies. Its instructions go to the trash with it
  and come back with it. Permanently deleting a set removes its instruction files from disk.
- Purging removes files after the row delete commits (never delete a file a live row points at).

## 5. Rebrickable catalog import

Source: <https://rebrickable.com/downloads/>. The page says (verbatim, Nov 2026):

> The catalog of official LEGO sets is available for bulk download below. Free for personal and
> commercial use, provided you acknowledge Rebrickable as your data source.
>
> You may automate downloading these archives at most once a day. Scraping our web pages is
> strictly against our Terms and will get you banned.

The catalog covers **official LEGO sets, parts and minifigs only** ("No B-models, sub-sets or
MOCs"). Off-brand sets are entered by hand, and their missing pieces are picked from the general
parts catalog (most off-brand parts follow LEGO part geometry) or entered as `other`.

### 5.1 Before building: ask Rebrickable

The import reads the downloads page itself to find the files (below), and the terms forbid
scraping their web pages. **Before Phase 5 starts, email Rebrickable** to confirm that one
manually triggered fetch of the downloads page, at most every 48 hours, is acceptable. Draft:

> Hi, I'm building Brick Bin, a free self-hosted app for families to catalog their LEGO sets. An
> admin can press "Import catalog" at most once every 48 hours (never automatically). Each run
> fetches /downloads/ once to read the file list and the LDraw colour names, then downloads
> all_downloads.zip, the schema SVG, and only the LDraw ZIPs whose date changed. Rebrickable is
> credited as the data source in the app. Is fetching the downloads page this way OK, or would you
> prefer we use something else to find the files? We'd also like to download set cover images from
> cdn.rebrickable.com when a user adds a set (one image per set, stored locally). Is that OK?

**Until they answer, the app does not fetch the page.** The admin pastes it instead (5.5), and the
page fetch sits behind `REBRICKABLE_PAGE_FETCH` (default `false`). If they say yes, the default
becomes `true` and pasting stays available as a backup. If they say no, pasting remains the
normal way, with the fallback in 5.7 as a second option. Either way, only the way the file list
is found changes; the rest of the import stays the same.

### 5.2 What a run downloads

From the downloads page (saved copy, 2026-11-15):

| File                                                                        | Notes                                                                                                                                                                                                 |
| --------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `https://cdn.rebrickable.com/media/downloads/all_downloads.zip?<timestamp>` | Every CSV in one archive ("Download the complete catalog"), with a "Last updated" date on the page. Downloaded every run                                                                              |
| `https://rebrickable.com/static/img/diagrams/downloads_schema_v4.svg`       | "How the files fit together" diagram (the `<img>` with alt "Public CSV schema showing the LEGO data files and the identifiers used to join them."). Downloaded every run                              |
| `https://cdn.rebrickable.com/media/downloads/ldraw/parts_<colorId>.zip`     | "LDraw images by color": **196 ZIPs, about 5.9 GB in all** (Black 220 MB, Light Bluish Gray 174 MB, White 157 MB, many under 5 MB). Each has a date. Downloaded only when its date is newer than ours |

The individual per-CSV `.zip` and `.gz` links contain the same data as `all_downloads.zip`, so the
import skips them. Any ZIP the page lists that is not one of the kinds above (a new section, for
example) is logged in the run summary but not downloaded until the code knows what it is.

Parsing (`src/server/catalog/downloads-page.ts`, a pure function from HTML to a file list, with
unit tests against a saved, trimmed copy of the page):

- CSV archive: the `a[href*="/media/downloads/all_downloads.zip"]` link. Keep the full href,
  including the cache-busting query string.
- Schema SVG: the `img`/`a` whose `src`/`href` ends in `downloads_schema_v*.svg`. Do not hard-code
  `v4`.
- LDraw ZIPs: `a[href*="/media/downloads/ldraw/parts_"]`. The colour id is the number in
  `parts_<id>.zip`. **The colour name comes from the link**: the `aria-label` reads
  "Download LDraw images in Modulex White as ZIP", and the first text line of the link is
  "Modulex White" (the second line is the size, "1.4 MB · ZIP"). Use the text line and fall back
  to the `aria-label`. The date is the `<time datetime="...">` next to the link. Cross-check the
  name against `rb_colors` after the CSVs load. A mismatch is a warning in the run summary, not a
  failure.
- Sanity checks that **fail the run before any download**: no CSV archive link, fewer than 100
  LDraw links, or an LDraw link without a parsable id. Treat it as "Rebrickable's page changed"
  and change nothing.

### 5.3 The run

1. An admin presses **Import catalog** on Settings > Catalog. The server checks the 48-hour rule
   (5.4) and that no run is in progress (a `running` row, plus a Postgres advisory lock), then
   inserts a `catalog_runs` row and returns at once.
2. The run continues in the Node process, outside the request (fire-and-forget with its own error
   handling). The page polls a small status endpoint and shows progress: current step, files done
   of total, bytes. If the server restarts mid-run, startup marks the run `failed` ("interrupted").
3. Get the file list: fetch the downloads page once when `REBRICKABLE_PAGE_FETCH=true`, or use
   the HTML the admin pasted (5.5). Parse it (5.2) and record the listing in `catalog_files`, with
   the source (`fetched` or `pasted`).
4. Download `all_downloads.zip` and the schema SVG, streamed to `DATA_DIR/catalog/tmp/`.
5. **CSVs**: stream each CSV out of the ZIP. Validate the header against the expected columns per
   file and each row with zod. Load each into a staging table (`rb_<file>_next`) with `COPY ...
   FROM STDIN` through postgres-js, then in one transaction swap the staging tables in for the
   live ones. A failed load leaves the old catalog untouched.
6. **LDraw ZIPs**: for each colour whose page date is newer than `catalog_files.remote_date` (or
   that we do not have), download it with `If-Modified-Since`/`If-None-Match`, then extract it to
   `DATA_DIR/catalog/ldraw/<colorId>/`. **Confirmed layout** (from `parts_31.zip`, Lavender: 312
   files, 14.8 MB): a flat ZIP with no folders and nothing but PNGs named `<part_num>.png`, using
   Rebrickable part numbers as they are (`3001.png`, `2454a.png`, `3010pyc.png`, `973c02h02.png`
   for torso assemblies). Extract into a temp folder and swap it in. Still accept only `.png`
   entries with safe flat names (no `/`, no `..`: zip-slip guard), with a per-entry size cap.
   Delete the ZIP once it is extracted, so 5.9 GB of ZIPs are not kept next to the extracted
   images. The run summary logs how many file names did not match a `rb_parts.part_num`
   (expected to be few). Those images are kept but never shown.
7. Requests go one at a time, with a descriptive `User-Agent` (`BrickBin/<version>
   (+https://brick-bin.app)`) and a timeout. A 429 or 5xx stops the run and marks it failed.
8. Save the SVG as `DATA_DIR/catalog/downloads_schema.svg`, mark the run `succeeded`, write an
   audit row with the counts, and show the summary.

The first run downloads everything (about 6 GB plus the CSV archive), so the button says so before
it starts and shows free disk space in `DATA_DIR`. A later run usually downloads the CSV archive,
the SVG and a handful of changed colour ZIPs.

### 5.4 The 48-hour rule and "Last imported"

- **The lock starts at the last successful run.** The button and the server action are disabled
  until 48 hours after `finished_at` of the newest `succeeded` run. The server enforces this
  itself and rejects early requests whatever the UI shows.
- A failed run does **not** lock the button, so it can be retried. To stay within Rebrickable's
  "at most once a day", **each URL is fetched at most once per 24 hours** (checked against
  `catalog_files.fetched_at`). A retry reuses the page listing and any files the failed run
  already downloaded.
- Settings > Catalog leads with a large **"Last imported 15 Nov 2026, 7:18 a.m. (2 days ago)"**
  line, then Rebrickable's own "Last updated" date from the page, the set, part and colour counts,
  the disk used by catalog images, and the button state, for example "Available again 17 Nov
  2026, 7:18 a.m." or "Import running: 41 of 196 colour files". Never imported reads "Never
  imported: set lookup and part picking need the catalog".
- Every page for admins shows the same "Last imported …" date in small text next to the Catalog
  link in Settings, so it is easy to find.
- A run history table (date, who, result, files downloaded/skipped, error) sits below.
- Nothing runs on a schedule. There is no `CATALOG_REFRESH_DAYS`, no cron, and no start-up
  download.

### 5.5 Pasting the downloads page (the default until Rebrickable answers)

On Settings > Catalog, admins get a **"Paste the downloads page"** panel. It explains the steps:
open `https://rebrickable.com/downloads/` in your browser, view the page source (Ctrl+U), select
all, copy, and paste here. Under it are a large monospace text field and **Import catalog**.

- The pasted text goes to a **route handler** (not a server action, because of the body-size
  limit). The saved page was 237 KB, so the cap is 2 MB. Admin only.
- The server parses it with the same `downloads-page.ts` parser and the same sanity checks (5.2).
  If it is not the downloads page, or is cut off, the panel shows what is missing ("No LDraw
  links found: did the whole page get copied?") and nothing is downloaded.
- **The pasted HTML is untrusted input.** It is parsed only, never rendered or stored as HTML.
  Every extracted URL must be `https` and on `REBRICKABLE_ALLOWED_ORIGINS`
  (`rebrickable.com`, `cdn.rebrickable.com`); anything else is dropped and listed in the summary.
  This stops a pasted page from making the server download from anywhere else.
- If the page's "Last updated" date for the complete catalog is **older** than the last import,
  the panel warns that the paste is stale and asks before going on.
- After parsing, the panel shows what the run will do before it starts: "CSV archive (updated 15
  Nov 2026), schema diagram, 12 of 196 colour ZIPs changed (1.1 GB)". The admin confirms, and the
  run continues from step 4 of 5.3.
- The 48-hour lock and the 24-hour per-URL limit apply exactly as for a fetched page. The paste
  panel is disabled while the import button is.
- When `REBRICKABLE_PAGE_FETCH=true`, the main button fetches the page itself, and the paste
  panel moves under "Other ways to import".

### 5.6 Using the catalog

- **Adding a LEGO set**: typeahead over `rb_sets` (number prefix first, then name), with theme,
  year, piece count and cover. Saving links the set (`rb_set_num`) and downloads the cover from
  `img_url`. Covers are only ever fetched from `CATALOG_IMAGE_ORIGIN` (default
  `https://cdn.rebrickable.com`), limited to JPEG/PNG/WebP up to 8 MB, and stored under
  `DATA_DIR/covers/<household>/`. This is one request per set someone saves, not bulk.
- **Re-sync from catalog** on a linked set refreshes name, year, pieces and theme with a diff
  before saving (audited). It never overwrites a custom cover without asking.
- **Part images** come from the extracted LDraw images, served by
  `/api/part-image/<colorId>/<partNum>` (signed-in users only, long cache headers). Not every part
  has an image in every colour. When the requested colour is missing, fall back to the same part
  in another colour (preferring Light Bluish Gray, then any), and have the UI label it ("shown in
  Black") next to the real colour swatch. If no colour has the part, show a neutral placeholder.
  To find the fallback without scanning folders, the import records which colours each part has
  an image in (`catalog_part_images (part_num, color_id)`, global, rebuilt with each run).
- **Schema diagram**: Settings > Catalog links to the saved SVG ("How the files fit together"),
  served from our own server with `Content-Type: image/svg+xml` and
  `Content-Security-Policy: sandbox`, and shown in an `<img>` tag so no script in it can run.
- **Attribution**: "Catalog data from Rebrickable" with a link, in the footer, on Settings >
  Catalog, and on every page that shows catalog data (set lookup, part picker, shopping list).
- **Barcode scanning** (copied, on browsers with `BarcodeDetector`): scan, look up the title through
  UPCitemdb (`upc.ts`), extract a 4 to 7 digit set number from the title ("LEGO Icons Titanic
  10294 Building Kit"), and search `rb_sets`. When nothing matches, the decoded title prefills the
  name.

### 5.7 Second fallback: never load the page

Not needed while pasting works. It is an option only if Rebrickable says no and pasting turns out
to be a chore. The rest of the run stays the same. Only step 3 changes:

- Download `all_downloads.zip` from its fixed URL
  (`https://cdn.rebrickable.com/media/downloads/all_downloads.zip`, no query string).
- Take colour ids and names from `rb_colors` (Rebrickable's colour ids are the `<id>` in
  `parts_<id>.zip`: `parts_1013.zip` is Modulex White in both).
- For each colour, make a conditional request for `parts_<id>.zip` (`If-Modified-Since` from our
  copy), and skip 404s. That is about 270 small CDN requests a run instead of one page load. The
  SVG URL becomes a setting (`REBRICKABLE_SCHEMA_SVG_URL`).

## 6. Features in v1

### 6.1 Library ("the bin")

- Box-art tiles on planks, server-side paging, sort and facet counts (same pattern as
  game-inventory's catalog filters).
- Filters with counts: brand, theme (tree), build state, completeness (missing pieces / complete /
  not checked), location, owner, year range, piece-count bands (<250, 250 to 999, 1,000 to 2,999,
  3,000+), tags, has instructions. Owned-only by default, with a toggle to include sets with no
  live copies.
- Sort: name, set number (natural order, so `75192` sorts after `7140`), year, pieces, recently
  added, estimated value (non-restricted only).
- Search across name, set number, theme, brand and designer.
- Phone-first: tab bar, bottom sheets for filters and forms, light and dark themes.

### 6.2 Set detail page

- Cover, brand, set number, theme breadcrumb (links to the filtered library), year, pieces,
  minifigs, age, description, designer.
- **Copies** as cards: owner, location path, build state (one-tap menu), completeness ("Missing 4
  pieces" opens the list), box and instructions flags, condition notes, paid / value (hidden from
  restricted).
- **Instructions** list (6.3).
- Last-edited line and an activity link (copied pattern).

### 6.3 Instructions

- Add by **uploading a PDF** or **adding a link**. For LEGO-brand sets, a "Find on LEGO.com"
  button opens LEGO's building-instructions page for the set number in a new tab (check the URL
  pattern in Phase 6). There is no automatic scraping.
- Uploads go through a **route handler that streams the body to disk**
  (`DATA_DIR/instructions/<household>/<set>-<sha16>.pdf`), not a server action: PDFs are often 20
  to 150 MB, and server actions have a body-size limit. Checks: `%PDF-` magic bytes,
  `INSTRUCTIONS_MAX_MB` (default 200), and the household's session. The SHA-256 is computed while
  streaming.
- Served by `/api/instructions/[id]` after a session and visibility check, **streamed** (not
  `readFile` into memory as `readStored` does for covers) with `Content-Type: application/pdf`,
  `Content-Disposition: inline`, and HTTP Range support so phone PDF viewers can jump pages
  without loading the whole file.
- Restricted profiles **can** open instructions (kids building is the main use). They cannot add
  or remove them.
- **Save from a link** (in v1): paste a PDF link, for example from LEGO's instructions page or an
  off-brand maker's site, and the server downloads the PDF and stores it like an upload. The row
  becomes `kind = file` and keeps the address it came from in `source_url`. This keeps copies of
  instructions for sets we own even after the maker takes them down. Members and admins only.
  A link can also be kept as a plain link without saving it.
  - SSRF guard (`src/server/net/safe-fetch.ts`, unit tested): `https` only; resolve DNS and
    reject loopback, private, link-local, CGNAT (`100.64.0.0/10` is the tailnet) and IPv6
    equivalents; connect to the address that was checked, so a DNS change between check and
    connect cannot get around it; follow at most 5 redirects and check every hop again; time out
    after 60 s; stop at `INSTRUCTIONS_MAX_MB`; require `%PDF-` magic bytes whatever the
    `Content-Type` says.
  - The download streams to disk with a progress indicator, and the SHA-256 catches a PDF that is
    already stored for the set.
  - Saving is a request someone makes, one file per click, so it fits the "no background
    downloading" rule.

### 6.4 Missing pieces and the shopping list

**Recording missing pieces** (on a copy: "Missing pieces" > "Add"):

- **The set's own inventory** when the set is linked to the catalog: a grid of the set's parts
  (LDraw image in the right colour, part number, name, colour swatch, quantity in the set), with
  search, colour and category filters, and a toggle to show spare parts (hidden by default; the
  `is_spare` flag in `rb_inventory_parts`). Tap a part to add one, or enter a quantity; going above
  the set's count shows a warning but is allowed. A **Minifigs** tab lists the set's minifigures
  from `rb_inventory_minifigs`. Sub-sets (`rb_inventory_sets`) are included in the grid.
- **The whole parts catalog** for off-brand sets, unlinked sets, or a part that is not in the
  inventory: search by part number or name, then pick a colour. The colours offered first are the
  ones the part is known to exist in (from `rb_elements` and `rb_inventory_parts`), then any other
  colour.
- **Other**: free text for pieces the catalog does not have (an off-brand special part, a sticker
  sheet).
- On the copy, the list shows image, part, colour, quantity and notes, with **Found**, **Bought**
  and **Substituted** actions (with a quantity, for partial finds) and **Remove** for mistakes.
  "Everything else is here" sets `pieces_checked_on` to today.

**Shopping list** (`/missing`, also linked from the set page and the library):

- Every open missing item across all copies, **grouped by part and colour** with the total
  quantity and the sets that need it ("3x Plate 1x2, Reddish Brown: Titanic ×2, Hogwarts ×1").
- Scope: all sets, or a chosen list of sets/copies (multi-select from the library or a picker),
  plus filters for brand, theme, owner, location and colour. Selecting sets in the library has a
  "Shopping list for these" action.
- Sort by colour (how bins are organised in second-hand stores), part category, or set.
- Mold and alternate hints from `rb_part_relationships` ("any of 3001, 3001old will do").
- **Store-trip mode** on phones: large images, tick off as you go (ticks are kept in the browser
  only, in `localStorage`, guarded with try/catch). "Done" offers to mark the ticked items as
  Bought. When a part covers several copies, it fills the oldest missing rows first, and the
  dialog lets you change that.
- **Exports**:
  - **BrickLink wanted list (XML)**, for BrickLink's "Upload wanted list": part and colour ids
    translated through `rb_part_mappings` and `rb_color_mappings`, minifigs through
    `rb_set_mappings`. Rows without a BrickLink mapping are left out of the XML and listed on
    screen ("4 parts have no BrickLink id"). Check the mapping columns and BrickLink's XML format
    in the Phase 8 spike.
  - **Rebrickable parts list CSV** (`Part,Color,Quantity`, Rebrickable's import format).
  - **Plain CSV** (part, colour, element id, quantity, sets, notes) and a print view.
- Kid profiles see missing pieces and the shopping list (no money is involved) but cannot change
  them.

### 6.5 Wishlist

- A list per person, copied from game-inventory: add from catalog search (prefills everything,
  including the cover) or by hand, price seen, link, notes for gift-givers.
- **Kid profiles can add, edit and remove items on their own list** and nobody else's. Those are
  the only writes a restricted profile can make, each a separate data-layer function that checks
  `requested_by_user_id = viewer` (section 7). Kids never see or enter prices. They can add from
  catalog search, and the cover download is limited to `CATALOG_IMAGE_ORIGIN`.
- **Private purchase marks**: anyone except the requester can mark an item "I bought this", with
  an optional date and note. The mark is visible **only to the person who made it**:
  - It lives in `wishlist_purchases`, and every read filters it to `user_id = viewer` in SQL. No
    query, export, count or API response includes another user's marks. **This includes
    admins.**
  - It writes no audit row and leaves the item's `updated_at` / `updated_by` alone, so neither the
    activity log nor "last edited" gives it away.
  - Item order and counts never depend on purchase marks.
  - The marker sees "You bought this on 3 Dec" on the item and can undo it. Two people can both
    mark the same item, and each sees only their own mark (so a duplicate gift is possible, which
    is the price of privacy).
  - If the requester removes an item that someone has marked, the marker sees it under "Removed
    from the list" in their own view until they dismiss it.
- **"We got it"** converts an item into a set + copy (prefilled from the catalog when `rb_set_num`
  is set) and trashes the wishlist item in the same transaction, which deletes any purchase marks
  on it. The dialog warns that everyone will now see it in the collection, and offers "hide from
  kid profiles" for a present that has not been given yet.
- The set-add typeahead shows an "On someone's wishlist" badge on matching results.

### 6.6 Value

- Per copy: price paid, estimated value, date valued. Per set: retail price (RRP).
- **Collection page** (members and admins only): totals for sets, copies and pieces; paid vs
  estimated value with the difference; breakdown by brand, theme and build state; a "value not
  set in over a year" list; sealed sets; copies with missing pieces (links to the shopping list).
- Values are manual in v1. A price-guide integration (BrickLink, BrickEconomy) is in Later; both
  need accounts or paid keys, and BrickLink uses OAuth 1.0.
- Currency: **USD** in v1. Every amount is shown through one `formatMoney()` in
  `src/lib/money.ts` (`Intl.NumberFormat` with `currency: 'USD'`), and parsed through one
  `parseMoney()`, so making it configurable later is a one-module change. No currency setting
  and no currency column for now.

### 6.7 Import

- Generic CSV import with column mapping, a preview, and the failed rows offered as a CSV
  download (copied flow).
- Recognised formats: **Rebrickable set list export** (set number and quantity: resolved against
  `rb_sets`, and the quantity creates that many copies) and **Brickset collection export** (set
  number and owned count; the wanted list goes to the importer's wishlist). Rows that do not match
  the catalog land in the failed-rows file with a reason.
- Import is admin/member only, previewed before anything is written, and runs in one
  transaction with one audit row per created entity.

### 6.8 Settings

- People: accounts and roles (copied).
- Places: nested locations with counts and delete guard (copied).
- Brands and themes: rename, merge two themes, delete unused.
- Catalog (admin): last imported, import button, run history, schema diagram (section 5).
- Activity: audit trail (copied).
- Trash: restore and delete for good (copied).

## 7. Kid (restricted) profiles

`restricted` is **read-only, except for their own wishlist** (6.5).

Enforced in the data layer:

- `setVisibilityCondition(ctx)`: household scope, not trashed, and for restricted viewers
  `hidden_from_restricted = false`. Every set, copy, missing-item, shopping-list, instruction,
  search, facet-count, collection and wishlist query uses it. The main use is a bought set waiting
  to be a present.
- `redactSet` / `redactCopy` / `redactWishlistItem`: for restricted viewers, remove
  `retail_price_cents`, `price_paid_cents`, `estimated_value_cents`, `valued_on` and
  `price_cents`, and hide the audit trail. This is defence in depth for any code path that loads
  rows without the SQL condition.
- Restricted writes: only `createOwnWishlistItem`, `updateOwnWishlistItem` and
  `trashOwnWishlistItem`, each checking ownership on the server. Every other mutation rejects
  restricted viewers in the data layer, not only in the UI. Restricted users cannot mark purchases
  on anyone's wishlist in v1 (see Later).
- Cover images of hidden sets are refused by the image route for restricted sessions, not just
  left out of the HTML. The same goes for the instruction route.
- Facet counts must not leak hidden sets: a theme with only hidden sets does not appear for a
  restricted viewer, and the shopping list leaves out parts that only hidden sets need.
- No value sort and no Collection page for restricted viewers (the route returns not-found).

Purchase-mark privacy is tested for every role: an admin, a member, the requester and a kid each
load the wishlist, the item, the activity log, exports and API responses, and only the marker ever
sees the mark.

## 8. Routes (sketch)

```
/                           → redirect to /sets
/sets                       library, filters in the query string
/sets/new                   add set (catalog search, barcode, manual)
/sets/[id]                  detail: copies, missing pieces, instructions
/sets/[id]/edit
/copies/[id]/missing        record missing pieces (inventory grid / catalog search)
/missing                    shopping list (scope via query string), store-trip mode, exports
/collection                 stats and value (non-restricted)
/wishlist                   per-person lists
/import
/settings/{people,places,brands,catalog,activity,trash}
/api/covers/[...path]        auth + visibility checked image serving
/api/part-image/[color]/[part]  LDraw images from DATA_DIR/catalog/ldraw
/api/catalog/schema.svg      the saved diagram, sandboxed
/api/catalog/status          import progress (admin)
/api/catalog/search          typeahead over rb_sets
/api/parts/search            part picker over rb_parts
/api/missing/export          bricklink.xml | rebrickable.csv | csv
/api/instructions/[id]       auth + visibility checked, streamed, Range
/api/instructions/upload     streaming upload (route handler)
/api/lookup/upc              copied
/api/health                  copied
```

Mutations are server actions that call the data layer, except the PDF upload.

## 9. Design system

- A sibling of "The Shelf": the same token structure in `src/theme.ts`, `--app-*` variables,
  self-hosted fonts in `src/fonts/`, light and dark. It gets its **own palette and name** (Brick
  Bin) so the two apps are easy to tell apart.
- **Avoid LEGO trade dress**: no LEGO logo, red-and-yellow brand scheme, minifigure likeness or
  stud-logo patterns in the app chrome or the sign-in wall. Decorative art uses invented sets, as
  game-inventory's sign-in shelf uses invented games.
- Box art is landscape and the images vary (Rebrickable images are product shots on white, with
  mixed aspect ratios). Tiles use a fixed landscape frame with `object-fit: contain` on a neutral
  card. Planks hold fewer, wider tiles than the games shelf.
- Part images are LDraw renders, **24-bit PNGs on a white background with no transparency**, in
  mixed sizes (mostly 500×500, some 250×250 or 250×187, older ones as small as 100×75). Show them
  on a white tile in both themes (a deliberate white card in dark mode, since the background
  cannot be removed). Use `object-fit: contain`, and do not upscale past about 2× native size, so
  the 100×75 images stay small rather than blurry. Put the colour swatch and name beside the
  image, because light colours (White, Lavender) are hard to read on white.
- Build state and completeness need clear badges that do not rely on colour alone (icon + word).
- **Design before building UI** (lesson from game-inventory, where a working UI was built first
  and then redone in a large redesign). Phase 1 produces mockups with the same process that
  produced The Shelf: taste-skill (`design-taste-frontend`) in app-screen mode, run by an isolated
  designer subagent, followed by a self-critique pass. Mockups go in `docs/design/brick-bin/`.

## 10. Environment variables

| Variable                      | Purpose                                                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `DATABASE_URL`                | Postgres connection (required)                                                                                                       |
| `DATA_DIR`                    | Covers, instruction PDFs, catalog images (default `./data`)                                                                          |
| `COOKIE_SECURE`               | `true` behind HTTPS                                                                                                                  |
| `AUTO_MIGRATE`                | `false` to skip migrations on start                                                                                                  |
| `ALLOWED_ORIGINS`             | Comma-separated hostnames allowed to submit server actions, e.g. behind a proxy; applied at container start (default none)           |
| `TRASH_RETENTION_DAYS`        | Default 30, `0` = keep until an admin deletes                                                                                        |
| `REBRICKABLE_PAGE_FETCH`      | `true` lets the import fetch the downloads page itself; default `false` (paste the HTML instead) until Rebrickable confirms it is OK |
| `INSTRUCTIONS_MAX_MB`         | Upload cap per PDF (default 200)                                                                                                     |
| `REBRICKABLE_DOWNLOADS_PAGE`  | Downloads page URL (default `https://rebrickable.com/downloads/`; e2e points it at the mock)                                         |
| `REBRICKABLE_ALLOWED_ORIGINS` | Origins the import may download from (default `https://rebrickable.com,https://cdn.rebrickable.com`)                                 |
| `CATALOG_IMAGE_ORIGIN`        | Allowed origin for set cover downloads                                                                                               |
| `UPC_BASE_URL`                | Barcode lookup base (tests)                                                                                                          |
| `E2E_DATABASE_URL`            | e2e only                                                                                                                             |

The 48-hour lock and the 24-hour per-URL limit are constants in code, not settings, so a
self-hoster cannot accidentally break Rebrickable's terms. Tests use an injected clock.

## 11. Deployment

- Same shape as game-inventory: CI publishes `ghcr.io/<owner>/brick-bin:latest` and `:<sha>`
  after the check and e2e jobs pass on `main`. The Proxmox Docker host runs `deploy/`: the app,
  its **own** `postgres:17`, a Tailscale sidecar serving `https://brick-bin.<tailnet>.ts.net`, and
  Watchtower (`nickfedor/watchtower`, label-enabled, 5-minute interval, Postgres never
  auto-updated). Separate containers, volumes and tailnet hostname from the games stack.
- Next.js standalone output, non-root `node` user, `/data` volume, `/healthz` healthcheck (`{status, version}`; `/api/health` kept as an alias).
- **Disk**: plan for the catalog images (about 6 GB extracted, plus up to the largest ZIP, about
  220 MB, while extracting), the `rb_*` tables (a few hundred MB including `rb_inventory_parts`),
  and instruction PDFs (tens of GB over time).
- **Backups**: `backup.sh` dumps Postgres (keep 14) as before, but **excludes the `rb_*` tables**
  (`pg_dump --exclude-table-data 'rb_*'`): they can be re-imported. Back up `covers/` with the
  database. Back up `instructions/` incrementally (`rsync --link-dest` snapshots, or the Proxmox
  backup of the volume). **Do not back up `catalog/`**: it can be re-downloaded (respecting the
  48-hour rule). Document the restore steps, including "run an import after restoring".
- `brick-bin.app` stays a domain for a later marketing/docs site (like `game-shelf.app`).

## 12. Testing

- **Unit (Vitest + PGlite)**, per data module: household scoping, audit rows in the same
  transaction, soft delete and restore guards, purge removing files, restricted filtering and
  redaction, restricted writes limited to their own wishlist, purchase-mark privacy for every
  role (including no audit row and no stamp change), the duplicate set-number constraint, natural
  sort of set numbers, derived completeness, missing-item merge and partial resolution,
  shopping-list grouping and scoping, BrickLink XML and Rebrickable CSV export (including
  unmapped rows), CSV import formats, set-number extraction from UPC titles, PDF checks, the
  SSRF guard (private and tailnet addresses, redirects to them, DNS changes, oversize and
  non-PDF responses), and `formatMoney` / `parseMoney`.
- **Catalog import** (unit, with a mock fetcher and injected clock): pasted HTML (the full page,
  a cut-off paste, an unrelated page, a page with links to other hosts that must be dropped, a
  stale page older than the last import, the 2 MB cap); downloads-page parsing against the saved
  page (196 LDraw links, colour names from link text, dates, the CSV archive link, the
  `v*` SVG); sanity-check failures; the 48-hour lock after success; no lock after failure; the
  24-hour per-URL limit on retries; only-changed ZIP selection; staging-table swap leaving the old
  catalog on failure; zip-slip and non-PNG entries rejected; interrupted runs marked failed on
  start.
- **E2E (Playwright)**: write `docs/E2E_TEST_PLAN.md` first using the game-inventory template,
  with IDs per area (AUTH, SET, COPY, MISS, SHOP, INS, VAL, WISH, IMP, VIS, CAT, TRASH). Smoke
  subset tagged `@smoke`. The mock server serves a trimmed downloads page, a tiny
  `all_downloads.zip`, two or three tiny LDraw ZIPs, the SVG, cover images and UPC results. Include
  an axe accessibility pass (`@axe-core/playwright`).
- CI: lint, format check, typecheck, unit tests, build, then 4 e2e shards with a gate job (copied).
  CI never contacts Rebrickable.
- `pnpm shots` regenerates reference screenshots into gitignored `screenshots/` with `INDEX.md`.

## 13. Phases

Each phase ends with lint, format, typecheck, unit tests and build passing, and e2e passing from
Phase 4 on.

**Phase 0: Scaffold.** Repo `brick-bin`, tooling and config copied (section 3), `AGENTS.md` +
`CLAUDE.md`, MemPalace block, `.gitignore` with `/data/` anchored, CI (check job only),
Dockerfile, local `docker-compose.yml` for Postgres. Send the Rebrickable email (5.1) now, so the
answer is in before Phase 5. Done when `pnpm dev` serves an empty page and CI is green.

**Phase 1: Design mockups.** Run the designer subagent with taste-skill on: sign-in/first-run,
library (phone and desktop, light and dark), filters sheet, set detail with copies, missing pieces
and instructions, the missing-part picker, the shopping list and store-trip mode, add-set flow
(catalog search, barcode, manual off-brand), collection/value page, wishlist (including a kid's
view and the "you bought this" state), Settings > Catalog with the last-imported line and import
progress, and the restricted view. Self-critique, then the user reviews and picks a direction.
Output: `docs/design/brick-bin/` and `src/theme.ts` tokens. Done when the user approves.

**Phase 2: Accounts and data core.** Schema for households, users, sessions, audit log; copied
auth, first-run, sessions, roles; `DataContext`, `recordAudit`, trash framework, visibility
helpers, with tests. App shell from the approved design, theme toggle, not-found page.

**Phase 3: Catalog core.** Brands (seed LEGO), themes, sets, copies, locations, tags. Set form
(manual), copy form with build state and the one-tap menu, "How many?" copies, cover upload, set
detail page, soft delete + trash UI, restore guards, settings for places/brands/themes.

**Phase 4: Library.** Library with server-side paging, sort, search, all facets with counts,
phone filter sheet. E2E plan written and the first specs passing; CI e2e shards on.

**Phase 5: Rebrickable import.** Does not wait for Rebrickable's answer: build the paste panel
(5.5) as the default, and the page fetch behind `REBRICKABLE_PAGE_FETCH` (off). Spike
first: inspect a real `all_downloads.zip` (file list, headers) and the schema SVG (mapping-file
columns). The LDraw ZIP layout is already confirmed (5.3, step 6). Then: `rb_*` tables, `catalog_runs` / `catalog_files`, page
parser, the run with staging swap and only-changed ZIPs, the 48-hour and 24-hour rules, Settings

> Catalog (last imported, progress, history, diagram), part-image route, set typeahead, cover
> download on save, re-sync with diff, barcode scan, theme find-or-create, attribution. Mock
> Rebrickable in e2e.

**Phase 6: Instructions.** Streaming upload route, storage, streamed + Range serving, link
instructions, "Find on LEGO.com", save from a link with the SSRF guard, sort order, trash and
purge of files.

**Phase 7: Missing pieces.** `copy_missing_items`, the inventory grid picker (parts, minifigs,
sub-sets, spares toggle), catalog-wide part search with known colours, `other` items,
found/bought/substituted with partial quantities, "everything else is here", derived completeness
in the library filter and on copy cards.

**Phase 8: Shopping list.** Grouped list across all or chosen sets, filters and sorts, mold hints,
store-trip mode with browser-only ticks and "mark as bought", exports (BrickLink XML after
checking the mapping columns and BrickLink's format, Rebrickable CSV, plain CSV, print view),
"Shopping list for these" from the library.

**Phase 9: Value and collection page.** Value fields on copy forms, RRP on sets, collection
totals and breakdowns, stale-value list, value sort, currency formatting.

**Phase 10: Wishlist.** Per-person lists, catalog-prefilled add, restricted writes to their own
list, private purchase marks with "removed from the list", "We got it" conversion with the
hide-from-kids option, wishlist badge in the set typeahead.

**Phase 11: Kid profiles and privacy hardening.** Go through every read path for
`setVisibilityCondition`, redaction and purchase-mark filtering. Check the image, part-image,
instruction and export routes. Look for facet-count and shopping-list leaks. Write restricted and
cross-user e2e specs that inspect HTML and API responses. (Each feature phase builds its own
restricted handling from Phase 3 on; this phase is the audit and the leak tests.)

**Phase 12: Import.** Generic CSV mapping, Rebrickable and Brickset collection formats, preview,
failed-rows download.

**Phase 13: Deploy v1.** Publish job, `deploy/` stack with the `brick-bin` tailnet hostname,
backups (rb tables and catalog images excluded, instructions incremental), README (features, local
dev, deploy, configuration, disk needs, Rebrickable attribution), `pnpm shots`. Deploy to Proxmox,
run the first catalog import there, lock the migration history ("never regenerate `drizzle/`" goes
into `AGENTS.md`), and switch to the branch + PR workflow.

## 14. Lessons carried over from game-inventory

- Mantine's `.extend()` and dotted members (`Grid.Col` and similar) are client-only: wrap them in
  client components instead of using them in server components.
- Anchor the uploads rule as `/data/` in `.gitignore`; a bare `data/` also ignores
  `src/server/data/`.
- `pglite-socket` does not work with `postgres-js`, so local dev uses Docker Postgres; PGlite is
  for unit tests only. Check that PGlite handles the `COPY FROM STDIN` path used by the catalog
  import, and fall back to batched inserts in tests if it does not.
- Decode HTML entities in any external text (UPCitemdb titles had `&#39;`), and keep line breaks
  in descriptions.
- E2E: compare dates in local time, not UTC; retry file-input interactions until the input has
  hydrated.
- CI: shard e2e with an always-reporting gate job so branch protection never waits; only install
  Playwright apt deps when `ldd` shows a missing library; use `nickfedor/watchtower` (the
  containrrr client is too old for current Docker).
- Soft delete needs partial unique indexes (`where deleted_at is null`) and explicit restore
  guards between parents and children.
- Until v1 deploys, migrations can be reset. After that, never regenerate `drizzle/`: change the
  schema, run `pnpm db:generate`, and make each migration safe for existing data.
- Design first (section 9).

## 15. Later (not in v1)

Listed so v1 does not block them. None of them needs schema now.

- **Guest share links**: copy game-inventory's `share_links` (hashed tokens, expiry, revoke,
  allowlist with a `shareable` column on sets, per-link theme/tag exclusions, no prices, owners or
  purchase marks).
- **Minifigures as owned entities**: where each figure is now and which set it came from. The
  catalog tables are already imported.
- **Build log**: the equivalent of plays, with builders (people, no account needed) and dates.
  The copied players model fits directly.
- **Loans**: copy game-inventory's loans (copy-level, borrower text, due date).
- **Ratings**: per (user, set), not audited, like game-inventory.
- **Price guide**: BrickLink or BrickEconomy for estimated values, on demand per copy.
- **Loose parts / bulk bins**: "can I rebuild this set from my bins?", using the imported
  inventories.
- **Photos of your build** (more than one image per copy).
- **Marketing and docs site** at `brick-bin.app`, like `game-shelf.app`.
- **Configurable currency**: replace the constant in `src/lib/money.ts` with a household setting.
- **Kids marking purchases** on a sibling's or parent's wishlist (a kid buying a present). Set
  aside for now. It would be one more restricted write, using the same private
  `wishlist_purchases` rows.

## Open questions

1. **Rebrickable's answer** (5.1). Until it arrives, admins paste the page (5.5). A yes turns on
   `REBRICKABLE_PAGE_FETCH`; a no keeps pasting, with 5.7 in reserve.

## Implementation notes

Where the build departs from the plan above (kept here so the plan itself stays as decided).

- **Catalog load (5.3 step 5):** rows go into the `rb_<file>_next` staging tables with batched
  multi-row `INSERT`s, not `COPY`. One code path runs in production and in PGlite tests, and the load
  still streams. The swap is one transaction that truncates each live table and `INSERT ... SELECT`s
  from staging, so indexes stay in place and a failed swap leaves the old catalog.
- **One run at a time:** a partial unique index on `catalog_runs` (`status = 'running'`) replaces the
  advisory lock, so even a race cannot start two runs.
- **The 24-hour rule** is keyed on the file's address without the cache-busting query string.
- **Loopback exception:** `http` is allowed only for `127.0.0.1` / `localhost` origins that are named
  in `REBRICKABLE_ALLOWED_ORIGINS`. The e2e tests use it for a mock; the default list is two `https`
  origins.
- **The downloads page parser** was written from the description in 5.2 and tested against a
  synthetic page (`src/server/catalog/fixtures.ts`), because the real page may not be fetched yet.
  **Check it against the first real paste.** The archive and its 15 CSV files were checked against a
  real download (`docs/REBRICKABLE_SPIKE.md`).
- **Set typeahead** shows text only. A cover is downloaded once, when a set is saved, never while
  typing (5.6 says one request per saved set).
- **Cover route** is `/api/sets/[id]/cover` (the set id is what visibility is checked against), not
  `/api/covers/[...path]`.
- **Kid navigation** has no Shopping list tab (decided after design review). Library tiles show one
  badge row per copy, up to three, then "+N more copies". Phones use two columns, and one column
  under 360 px.
