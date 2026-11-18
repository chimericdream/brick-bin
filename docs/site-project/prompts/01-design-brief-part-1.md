# Part 1: Design brief

Sent to Designers 1, 2 and 3. Designers 1 and 2 also receive `02-designers-1-and-2-addendum.md`.

## Your role

You are a senior web designer creating the marketing and documentation site for **Brick Bin** (`brick-bin.app`). Make every visual and structural decision yourself. If a design skill is available to you, use it, including its look-and-fix loop on screenshots.

**Where you work.** You work only in the directory the project manager gave you. That directory sits inside a code repository, and you are expected **not to browse it**. Do not open source code, configuration, documentation, the app's own design files or screenshots, or any directory other than your own. Another designer's work, in particular, must stay unseen. The app's design is deliberately not your reference, because this site needs its own identity. Everything you need is in this brief. If you need something you don't have, end your turn with a `QUESTIONS FOR PM` block. You cannot talk to anyone else. When you finish, say whether you opened anything outside your directory, and what.

## What Brick Bin is

A **self-hosted web app for a household's collection of building-brick sets**: LEGO and off-brand brands such as Mould King, CaDA, COBI, BlueBrixx and Lumibricks. It is **not a SaaS**. You run it on your own server and reach it over your own network, for example Tailscale. It is free and open source. The site's job is to make a family or collector think "that's for me", then get them through setup and keep them going afterwards.

Audience: parents and collectors comfortable running a small home server, and people curious about that. Not enterprise buyers. The site is also the product's documentation, so it must work for people who arrive with a problem as well as people who arrive curious.

## Content pack (facts you may rely on)

**Core ideas**
- **Set vs copy.** A set is the design. A copy is a physical box you own, with its own build state, place, owner, price and value. Five copies of one polybag is normal.
- **Build state:** sealed, opened, in progress, built, disassembled, mixed. Each has a one-tap menu.
- **Missing pieces are real catalog parts** (part, colour, quantity, with pictures), picked from the set's own inventory or searched across the whole catalog.
- **Shopping list:** everything missing, grouped by part and colour, with a store-trip mode on phones. Exports to BrickLink wanted-list XML, Rebrickable CSV and plain CSV.
- **LEGO catalog lookup** from Rebrickable data you import yourself. Nothing is fetched on a schedule, and an admin presses the button. It can be run at most once every 48 hours.
- **Instructions:** upload PDFs, save a link, or save a PDF from a web address. Phone PDF viewers can jump around the file.
- **Collection and value:** totals, paid vs estimated value, values that have gone stale, sealed sets.
- **Wishlists** per person. Anyone can privately mark "I bought this", and only that person ever sees the mark. Not admins, not the activity log. "We got it" turns a wish into a set.
- **Kid profiles:** read-only, no prices, no shopping list. They can manage their own wishlist. Sets marked hidden look as if they don't exist. This is enforced on the server and covered by tests.
- Also: CSV import (Rebrickable set list, Brickset export, any spreadsheet), an activity trail, a trash with restore, light and dark themes, and phone-first layouts.
- **Privacy:** your data stays on your server, and nothing loads from a CDN. The app makes no background downloads.
- **Not in v1** (say so plainly if mentioned): loose-brick inventory, owned minifigures, a build log, loans, ratings, guest share links, price-guide integrations, currencies other than USD.
- **Credit:** catalog data comes from Rebrickable and must be acknowledged with a link in the footer and wherever catalog data is discussed.

**Setup and hosting facts**
- Recommended: a Proxmox VM or LXC with Docker, reached over Tailscale. The stack is the app, its own Postgres 17, a Tailscale sidecar serving HTTPS at `https://brick-bin.<your-tailnet>.ts.net`, and Watchtower, which pulls a new app image every five minutes. Postgres is never auto-updated.
- Quick try-out without Tailscale: run the production compose file and open port 3000.
- First visit asks you to create the household and the admin account.
- The first catalog import downloads about 6 GB of part images plus a data archive. Plan for several GB of disk for the catalog, a few hundred MB of database, and tens of GB for instruction PDFs over time.
- Backups: database dumps (the catalog tables are skipped because they can be re-imported), cover images, and instruction PDFs. The downloaded catalog images are not backed up. After a restore, run a catalog import again.
- Until Rebrickable confirms automated page reads are fine, admins **paste the downloads page's HTML** into the app instead of the app fetching it.

**Configuration reference (what the docs table lists)**

| Variable | Purpose | Default |
| --- | --- | --- |
| `DATABASE_URL` | Postgres connection | required |
| `POSTGRES_PASSWORD` | Database password in the production compose | set it |
| `TS_AUTHKEY` | Tailscale key for the sidecar | set it |
| `APP_PORT` | Port published by the plain compose file | 3000 |
| `COOKIE_SECURE` | Set `true` once served over HTTPS | false |
| `DATA_DIR` | Covers, instruction PDFs, catalog images | `./data` |
| `AUTO_MIGRATE` | `false` skips database migrations on start | true |
| `TRASH_RETENTION_DAYS` | Days a deleted item waits before it is deleted for good (0 keeps until an admin deletes) | 30 |
| `INSTRUCTIONS_MAX_MB` | Largest PDF the app will store | 200 |
| `REBRICKABLE_PAGE_FETCH` | `true` lets the import fetch the downloads page itself | false |
| `REBRICKABLE_DOWNLOADS_PAGE` | Downloads page address | Rebrickable's page |
| `REBRICKABLE_ALLOWED_ORIGINS` | Origins the import may download from (https only) | Rebrickable and its CDN |
| `CATALOG_IMAGE_ORIGIN` | The only origin set covers are downloaded from | Rebrickable's CDN |
| `APP_VERSION` | Optional label shown in health checks and the import User-Agent | empty |

(Variables used only by tests are not documented for users.)

## Pages to design

1. **Landing page.** In this order: what Brick Bin is and who it's for, the main features, how self-hosting works at a glance, a call to action to the setup docs. Include a short "what you won't find here" note: no account with us, no subscription, no tracking.
2. **Tutorials.** An index, plus a full tutorial page template (goal, what you need, numbered steps with screenshot placeholders, a "what next" link). The tutorials to list: first run (create your household and admin account), import the LEGO catalog (including paste-the-page and the 48-hour limit), add your first set (catalog search, barcode scan, manual off-brand entry), track several copies and change build state, record missing pieces and work the shopping list, attach instructions, set up a kid profile, run a wishlist with private marks and "We got it", import from CSV, check collection value.
3. **Documentation**, in three sections with section navigation and "on this page" navigation on long pages: **Setup**, **Hosting**, **Configuration** (the table above as a scannable reference).
4. **FAQ.** Short honest answers. Include: Is this a LEGO app? (No. It works with any brand and is not affiliated with LEGO.) Does it need the internet? Where does the catalog come from? Can my kids see prices? Can I run it without Tailscale? How do I back it up? Can I track loose bricks? (Not yet.) What does it cost? (Nothing.)
5. **Supporting:** a 404 page, a mobile menu, a footer (Rebrickable credit, a non-affiliation note, a repo link) and a theme toggle.

## Design brief

- **Playful without being silly.** Warm, confident and a little witty, like a well-organised workshop, not a toy aisle. No mascots, cartoon faces, confetti or exclamation-mark enthusiasm. Humour lives in small touches: microcopy, empty states, captions, the 404.
- **Bricks are part of the theme.** Weave building bricks into the design in several places, such as backgrounds, headings, section markers, dividers, buttons, cards or the 404. Build a **system** with clear rules for where the motif appears and where it doesn't, not a single decoration. It must never hurt legibility, and body text never sits on busy patterns.
- **No LEGO trade dress.** No LEGO logo or wordmark, no stud-logo marks, no minifigure likenesses, and no red-and-yellow brand scheme. Invent a mark and wordmark for Brick Bin.
- **Mobile and desktop.** Design phone-first, then scale up. Cover roughly 360, 390, 768, 1024 and 1440 px. No horizontal page scroll, comfortable tap targets, config tables that stay readable on a phone, and docs navigation that works on a phone.
- **Light and dark** themes that both look intentional.
- **Accessible.** WCAG AA contrast, visible focus states, correct heading order, and a calm option for any animation (`prefers-reduced-motion`).
- **Buildable.** The site will be built as a static Next.js site with the Mantine component library, hosted on Netlify. Design what you want, but it must be achievable with standard web technology and ordinary components. Avoid effects that need a server, third-party widgets, video or heavy WebGL. Choose **fonts that are free to self-host** (open licences, such as OFL), because nothing may load from a third party at runtime. Any decorative art should be SVG or CSS.
- **No third-party anything at runtime.** No analytics, no trackers, no external embeds.

## Screenshots: placeholders only

There are no screenshots yet. Wherever the real app would be shown, draw a **designed placeholder** in the site's own style, with a fixed aspect ratio so layouts won't shift when real images arrive. Give each one a **caption underneath** that says:

1. **Screen:** which view of the app (for example, "Set detail page").
2. **State:** what data and condition to capture (for example, "one set with two copies: one built, one missing 4 pieces").
3. **Viewport and theme:** phone or desktop, light or dark.
4. **Focus:** what the viewer should notice, and what to crop to.

Also write alt text for each. Keep a single list of every placeholder, with an ID and file name, in `PLACEHOLDERS.md`.

## Writing

Write real copy for everything you mock up. Plain, specific, warm and human. No filler or hype. Avoid "it's not X, it's Y" reveals, strings of three adjectives, and stock words like "seamlessly" and "unlock". Do not make claims beyond the content pack, and do not invent testimonials, user counts or prices. Docs and tutorial text may be representative, because a developer will check it against the real app later. Make sure the voice is clear, because it will be extended by someone else.

## Deliverables

All inside your working directory:

1. **Mockups** as hand-authored static HTML and CSS (no build step, no frameworks, openable by double-clicking), plus PNG screenshots of each at the widths below. Cover:
   - Landing page: full page at phone and desktop, in light and dark.
   - Tutorials index, one tutorial page, Setup page, Hosting page, Configuration page, FAQ, 404: phone and desktop. Show dark mode for at least the tutorial page and the Configuration page.
   - Mobile menu open, docs navigation on mobile and desktop, and the theme toggle states.
   - Key interactive states: hover, focus, active, current page.
2. **`DESIGN-NOTES.md`:** concept, the brick-motif rules, type and colour choices with reasoning, and responsive behaviour.
3. **`TOKENS.md`:** colours (light and dark), type scale, spacing, radii, shadows, breakpoints, and motion.
4. **`PLACEHOLDERS.md`:** as above.
5. Any logo and decorative assets as separate SVG files, and the font names, licences and weights used.

When you finish, end with a short summary, a statement of whether you opened anything outside your directory, and any `QUESTIONS FOR PM`.
