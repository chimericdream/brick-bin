# Brick Bin site

The marketing and documentation site for Brick Bin, served at `brick-bin.app`. It is a static
export of a Next.js (App Router) app, styled with Mantine and CSS modules, and lives in this
`site/` folder as the `brick-bin-site` pnpm workspace package. It shares nothing with the app in
`../src`: it has its own theme, tokens, fonts and assets, taken from the approved design in
`design/`.

## Commands

Run from the repository root (after `mise install` and `pnpm install`):

| Command                                     | What it does                                           |
| ------------------------------------------- | ------------------------------------------------------ |
| `pnpm --filter brick-bin-site dev`          | Dev server on http://localhost:3300                    |
| `pnpm --filter brick-bin-site build`        | Static site in `site/out`, ready for any static host   |
| `pnpm --filter brick-bin-site typecheck`    | `tsc --noEmit` for the site                            |
| `pnpm --filter brick-bin-site placeholders` | Rewrites `PLACEHOLDERS.md` from `src/content/shots.ts` |
| `pnpm lint` / `pnpm format:check`           | The root Oxlint and Oxfmt runs cover the site too      |

CI runs the site's typecheck and build in the `check` job.

## Where things are

| Path                     | What it holds                                                                                                         |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| `src/app/`               | One folder per page: landing, tutorials, docs, FAQ, 404, sitemap                                                      |
| `src/components/`        | Header, phone menu, footer, page head, screenshot placeholder, docs layout and prose blocks, each with its CSS module |
| `src/content/tutorials/` | One file per tutorial, plus `index.ts`, which orders and groups them                                                  |
| `src/content/config.tsx` | Every environment variable on the Configuration page                                                                  |
| `src/content/faq.tsx`    | The FAQ questions and answers                                                                                         |
| `src/content/shots.ts`   | Every screenshot: its label, shot notes, alt text and caption                                                         |
| `src/styles/`            | Design tokens (`tokens.css`) and element defaults plus the brick motif (`base.css`)                                   |
| `src/fonts/`             | Albert Sans and JetBrains Mono, with their licenses                                                                   |
| `public/screenshots/`    | Real screenshots go here (see below)                                                                                  |
| `design/`                | The approved design package. Reference only, not built or deployed                                                    |

## Content: why plain TSX files

Content is TypeScript data with JSX for the prose, not Markdown or MDX. A tutorial is one file that
exports its title, summary, steps and so on; the page template turns it into the goal, what you
need, steps, troubleshooting and what next, the same five parts every time. This was the simplest
way to get there:

- No extra dependencies or build plugins. MDX would add a compiler, a components map and a second
  way of writing pages.
- The pieces the design needs inside the text (screenshots, callouts, code blocks, `kbd`) are just
  components, and TypeScript catches a mistyped screenshot ID or a missing field.
- The tutorials index, sidebar, step counts, pager and sitemap are all derived from the same data,
  so they can't disagree.

The cost is that writers edit JSX rather than Markdown. For a site of this size that is a fair
trade.

### Adding things

- **A tutorial:** copy one of the files in `src/content/tutorials/`, change it, and add it to a
  group in `src/content/tutorials/index.ts`. Its page, number, sidebar entry, step count and
  sitemap entry follow.
- **A configuration variable:** add one row to its group in `src/content/config.tsx`.
- **A FAQ question:** add one entry to `src/content/faq.tsx`.
- **A screenshot placeholder:** add an entry to `src/content/shots.ts`, use it with
  `<Shot id="..." />`, and run the `placeholders` command.

### Swapping in a real screenshot

Save the image as `public/screenshots/<file>`, using the file name `PLACEHOLDERS.md` lists for it
(`<id>-<slug>.light.png` or `.dark.png`), and rebuild. The placeholder is replaced by the image in
the same frame, with its caption underneath. One theme is enough: the site shows it in both and
says which theme it is. Nothing else changes.

## Styling

Mantine provides the theme, the color-scheme handling, the phone menu's dialog (`Drawer`) and the
copy buttons. Everything else is CSS modules, ported from the design's stylesheet, with the design
tokens as CSS variables in `src/styles/tokens.css`. Shared pieces that every component uses (the
stud row, the 1×1, the baseplate, the dashed tag, `.wrap`) are global in `src/styles/base.css`.
Breakpoints use the Mantine variables from `postcss.config.cjs`, which follow the design: 640,
768, 900, 1024 and 1280px.

Theme: System, Light or Dark, saved in `localStorage` under `bb-theme` and applied by Mantine's
`ColorSchemeScript` before first paint. Without scripts the site follows the device and the toggle
is hidden.

Nothing loads from a third party at runtime: no font service, analytics, trackers or embeds. The
fonts are the full upstream variable fonts (Albert Sans from Google Fonts' repository, JetBrains
Mono from JetBrains), converted to WOFF2 when the site was written and committed here.

`public/og.png`, the social card, was rendered from the design's live type in a browser, so it
needs no outlined logo file.

## Hosting on Netlify

The repository has a `netlify.toml` at its root. To connect it:

1. In Netlify, add a new site and import the `chimericdream/brick-bin` repository from GitHub.
2. Leave **Base directory** empty. The build command, publish directory (`site/out`) and Node
   version come from `netlify.toml`.
3. Deploy, then under domain management add `brick-bin.app` as the custom domain and follow
   Netlify's DNS instructions.

Netlify skips the build when a commit changes nothing under `site/`, `netlify.toml`,
`pnpm-lock.yaml` or `pnpm-workspace.yaml`. A bare `/docs` redirects to the Setup page.

### A local quirk

Building on Windows names the per-page prefetch files with folders (`__next.docs/setup/...`)
instead of dots, so a local static server logs 404s for them. Next.js falls back to normal
navigation, and builds on Linux, such as Netlify's, are not affected.
