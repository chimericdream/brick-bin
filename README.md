# Brick Bin

A self-hosted web app for a household's collection of building-brick sets: LEGO and off-brand.
Built with Next.js, Mantine, PostgreSQL and Drizzle. Not a SaaS: you run it on your own server and
reach it over your own network (for example Tailscale).

`docs/PLAN.md` is the implementation plan. `docs/design/brick-bin/` holds the design mockups.

## Features

- **Library** of sets with covers, a design-versus-copy model (one set, many physical boxes, each
  with its own build state, place, owner, price and value), filters with counts, search, sorting
  and natural set-number order.
- **LEGO catalog lookup** from Rebrickable data you import yourself: search by number or name, scan
  a box barcode (on browsers that support it), prefill the form, and download the cover once when
  you save.
- **Missing pieces** per copy, picked from the set's inventory or searched in the catalog, with part
  pictures, merged rows and partial resolution.
- **Shopping list** of everything missing, grouped by part and colour, with a store-trip mode and
  BrickLink XML, Rebrickable CSV and plain CSV exports.
- **Instructions**: upload PDFs, save a link, or save a PDF from a web address (public https only).
- **Collection and value** page: totals, paid versus estimated value, breakdowns, sealed sets and
  values that have gone stale.
- **Wishlists** per person, with prices and notes for gift-givers. Anyone can privately mark "I
  bought this"; only that person ever sees the mark. "We got it" turns a wish into a set.
- **CSV import** of a Rebrickable set list, a Brickset collection export, or any spreadsheet.
- **Kid profiles**: read-only, no prices, no shopping list, and sets marked hidden look like they do
  not exist. Enforced on the server, with tests.
- An **activity trail**, a **trash** with restore, and light and dark themes.

Phone-first layouts. Fonts and assets are self-hosted; the app never loads anything from a CDN.

## Local development

```sh
mise install                 # node + pnpm versions from mise.toml
pnpm install
docker compose up -d db      # Postgres on localhost:5432
cp .env.example .env
pnpm dev                     # migrations run automatically on start
```

Open http://localhost:3000. The first visit asks you to create the household and the admin account.

| Command                           | What it does                                        |
| --------------------------------- | --------------------------------------------------- |
| `pnpm lint` / `pnpm format:check` | Oxlint and Oxfmt                                    |
| `pnpm typecheck`                  | `tsc --noEmit`                                      |
| `pnpm test`                       | Vitest on an in-process Postgres (PGlite)           |
| `pnpm e2e` / `pnpm e2e:smoke`     | Playwright (needs the local Postgres)               |
| `pnpm shots`                      | Regenerates reference screenshots in `screenshots/` |

Unit tests run the real migrations, so no database is needed for them.

## Deploying

The recommended setup is a Proxmox VM or LXC with Docker, reachable over Tailscale.

1. A push to `main` runs CI. When the checks and the end-to-end tests pass, the `publish` job
   pushes `ghcr.io/chimericdream/brick-bin:latest` and `:<sha>`. Make the package public after the
   first publish, or give Watchtower a registry login.
2. On the Docker host, copy the `deploy/` directory, then:

   ```sh
   cp .env.example .env      # set TS_AUTHKEY and POSTGRES_PASSWORD
   docker compose up -d
   ```

   It runs the app, its own Postgres 17, a Tailscale sidecar that serves HTTPS at
   `https://brick-bin.<tailnet>.ts.net`, and Watchtower, which pulls a new app image every five
   minutes. Postgres is never auto-updated. It shares nothing with any other stack on the host.

3. Open the address, create the household and admin account, then import the catalog (below).

To try it without Tailscale: `docker compose -f docker-compose.prod.yml up -d --build`, then open
port 3000 (`APP_PORT` changes it). Set `COOKIE_SECURE=true` once it is served over HTTPS.

### The Rebrickable catalog

LEGO lookup, inventories, part pictures and the missing-pieces picker use data from
[Rebrickable](https://rebrickable.com/downloads/), which Brick Bin only downloads when an admin
asks (Settings, Catalog). The terms limit downloads, so:

- An import is locked for **48 hours** after the last successful one, and a given file is fetched
  at most once every 24 hours. These are fixed in the code.
- By default the admin **pastes the downloads page** into the import dialog instead of the app
  fetching it (`REBRICKABLE_PAGE_FETCH=false`). Only turn fetching on after Rebrickable has said
  that is fine.
- Catalog data from Rebrickable is shown with attribution.

### Disk space

Plan for about 6 GB of extracted catalog images plus up to 220 MB for the largest ZIP while
extracting, a few hundred MB of Postgres for the `rb_*` tables, and instruction PDFs, which can reach
tens of GB over time.

### Backups

`scripts/backup.sh` (run it nightly from cron; on the Watchtower stack use
`COMPOSE="docker compose -f deploy/docker-compose.yml" scripts/backup.sh`) writes:

- `db-<stamp>.sql.gz`: Postgres **without** the Rebrickable tables or the catalog import history
  (they can be re-imported).
- `covers-<stamp>.tar.gz`: set and wish pictures.
- `instructions/<stamp>/`: hard-linked snapshots of the instruction PDFs (needs `rsync` and read
  access to the Docker volume, usually root). Only new files take space.

The extracted `catalog/` directory is not backed up; it can be downloaded again. Newest 14 of each
are kept.

**To restore:** start the stack, then

```sh
gunzip -c db-<stamp>.sql.gz | docker compose exec -T db psql -U bricks -d bricks
docker compose exec -T app tar -C /data -xzf - < covers-<stamp>.tar.gz
cp -a instructions/<stamp>/. <the app-data volume>/instructions/
```

Then **run a catalog import**: the reference tables come back empty and the import history is not
restored, so the 48-hour lock does not carry over. If you downloaded the catalog in the last two
days on the old machine, wait out the rest of that window.

## Configuration

Everything comes from environment variables (`.env.example` has them all).

| Variable                      | Purpose                                                                                       |
| ----------------------------- | --------------------------------------------------------------------------------------------- |
| `DATABASE_URL`                | Postgres connection string (required)                                                         |
| `DATA_DIR`                    | Where covers, instructions and the catalog files live (default `./data`, `/data` in Docker)   |
| `COOKIE_SECURE`               | `true` when served over HTTPS                                                                 |
| `AUTO_MIGRATE`                | `false` to skip migrations on start                                                           |
| `TRASH_RETENTION_DAYS`        | Days a deleted item waits in the trash (default `30`; `0` keeps it until an admin deletes it) |
| `INSTRUCTIONS_MAX_MB`         | Largest instruction PDF the app stores (default `200`)                                        |
| `REBRICKABLE_PAGE_FETCH`      | `true` lets the import fetch the downloads page itself (default `false`)                      |
| `REBRICKABLE_DOWNLOADS_PAGE`  | The downloads page address                                                                    |
| `REBRICKABLE_ALLOWED_ORIGINS` | Origins the import may download from (https only)                                             |
| `CATALOG_IMAGE_ORIGIN`        | The only origin set covers are downloaded from                                                |
| `UPC_BASE_URL`                | Barcode lookup service (tests point it at a mock)                                             |
| `APP_VERSION`                 | Release label, also sent in the import `User-Agent`                                           |
| `E2E_DATABASE_URL`            | End-to-end tests only                                                                         |

## Privacy and network use

- Nothing is downloaded in the background. The app makes an outside request only when a person asks:
  an admin runs a catalog import, someone saves a set picked from the catalog (one cover), someone
  scans a barcode, or someone saves an instruction PDF from a web address (public https only,
  checked against private and tailnet addresses).
- Restricted profiles are enforced on the server in every query and route, not just hidden in the UI.
- "I bought this" marks are written to a private table, never to the activity log, and are filtered
  in the database query to their maker (admins included).

## Licence

See `LICENSE`. LEGO is a trademark of the LEGO Group, which does not sponsor or endorse this
project. Brick Bin avoids LEGO trade dress in its design.
