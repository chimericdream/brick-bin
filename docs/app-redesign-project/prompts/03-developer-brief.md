# Developer brief: build the app redesign

Sent to the Developer, with the path `docs/app-redesign-project/design/final/`.

## Your role

You are the developer for the redesign of the Brick Bin **app**, in `src/` of this repository. An approved design package is in `docs/app-redesign-project/design/final/`. **Implement that design faithfully.** Do not redesign it. If something in it is wrong, unbuildable with Mantine, or conflicts with a constraint here, do not decide alone. End your turn with a `QUESTIONS FOR PM` block. The PM will relay design questions to the designer and bring back the answer, and will ask the human about product decisions. You can't talk to anyone else.

Read `AGENTS.md` first and follow it. It says the Next.js version here has breaking changes, so read the relevant guide in `node_modules/next/dist/docs/` before writing routing, metadata or config code. Read `docs/PLAN.md` section 2 for the architecture rules.

## What is in the package

Start with `SPEC.md`. It is the developer handoff: tokens, the brick-motif system, the app shell, the component inventory, screen-by-screen rules, states, accessibility notes, a copy-change table, a voice guide and a list of what is flexible. `TOKENS.md` and `DESIGN-NOTES.md` explain the choices. `mockups/` holds static HTML and CSS you can open by double-clicking, and `screenshots/` holds PNGs of every screen and state at 1440 and 390 px (some also at 768 and 360). `PROPOSALS.md` lists ideas that need new features. **Do not build anything in it.** Where the spec and the mockup stylesheet disagree, the stylesheet wins.

## Constraints

- **This is a UI redesign.** Do not change data models, server logic, routes or URLs, server action behavior, permissions or visibility rules. No schema changes and no new migrations. If the design needs data the screens don't load today, stop and ask. A small read-only addition inside `src/server/data/` is only acceptable once the PM has cleared it with the human, and it must keep household scoping and the server-side visibility rules (kid profiles never receive prices or hidden sets). Add a test that hidden data still never appears.
- **Stack:** Next.js (App Router, TypeScript strict), **Mantine** (v9: components, style props, theme, CSS modules with `postcss-preset-mantine`). **No Tailwind** or other utility-CSS framework. Oxlint and Oxfmt, never ESLint or Prettier. `@tabler/icons-react` for icons.
- **Tokens.** The theme lives in `src/theme.ts` and the colours and sizes are `--app-*` CSS variables used from CSS modules. Keep that convention: express the design's tokens as `--app-*` variables (light and dark), mirror them in the Mantine theme, and don't hard-code colours in CSS modules. Replace the old tokens that the design supersedes, and delete the ones nothing uses.
- **Fonts and assets are self-hosted** in `src/fonts/` (or the app's existing asset location). Never load anything from a CDN or any third party at runtime. Add each font's licence file. Remove font files and licences for fonts the new design no longer uses.
- **Existing tests must keep passing.** The Playwright suite finds controls by role, accessible name and label. Keep names, labels and roles as they are wherever the design allows. Where the copy-change table changes a label, update the affected spec **deliberately**, and list every spec you touch and why in the PR. Never weaken an assertion to make it pass. `e2e/specs/a11y.spec.ts` (axe) must still pass on every screen it covers. `pnpm test` (Vitest) must pass.
- **Privacy and visibility are architecture, not styling.** Don't pass prices, hidden sets or private purchase marks into components that a kid profile or another person can see. The design's kid views are subsets of the same server-filtered data.
- **No LEGO logo or trade dress.** No third-party requests at runtime.
- **Keep it simple.** If something in the design would be much more complicated to build than a close alternative (a custom component where a Mantine one nearly fits, an animation library, a CSS trick that needs a hack), say so, and propose the simpler option with tradeoffs and a recommendation.
- Light and dark themes follow the system setting with a manual choice, with no flash of the wrong theme on load. Keep how the current app stores that choice unless `SPEC.md` says otherwise.
- Update `.env.example` only if you add an environment variable. You shouldn't need to.

## Process and git

1. Read the package, `AGENTS.md` and the current code for the shell and the screens, and confirm you understand them. Raise anything unclear to the PM before you build.
2. Work on the existing branch `feat/app-redesign`, with small conventional commits (`feat:`, `fix:`, `chore:`, `test:`, `docs:`). **Never push to `main`.**
3. **Build in three slices and stop after each one with a short report.** The PM tells the human, and the human approves each before the next starts (only slice 1 has a hard stop; for slices 2 and 3, end your turn when the slice is done and report, then continue when told).
   - **Slice 1: foundation.** Theme, tokens, fonts, shared components the first screens need, the app shell (desktop sidebar, tablet layout, phone top bar and tab bar, theme toggle, page heads), the **Library** (including its filters and phone filter sheet) and the **set detail** page (copies, build-state menu, dialogs). Stop here. The human reviews it running.
   - **Slice 2: everything else.** Add set (lookup, scan, manual), edit set, missing-pieces picker, shopping list and store-trip mode, collection, wishlist and its dialogs, import, more, all of Settings (including every catalog state and the instructions panel), sign-in and first-run setup, the not-found page, the kid views, and empty, error and edge states.
   - **Slice 3: polish and close.** Dark mode and phone passes over every screen, the accessibility pass, e2e updates, the docs below, the PR.
4. Use the data the designers saw. `docker compose up -d db`, then `pnpm shots` renders the **current** app's screens from an invented household into the gitignored `screenshots/` folder, named `<screen>-<width>-<theme>.png` (the design's `MOCKUP-INDEX.md` says which mockup replaces which of these). Run it after each slice and compare your screens with the mockups' PNGs side by side. Also check in a real browser at roughly 360, 390, 768, 1024 and 1440 px, in both themes, and fix what doesn't match.
5. One browser process at a time. No parallel or background captures. Delete any temporary browser profile you create. Never launch desktop apps. If you start Docker or a dev server, stop them when you hand back.
6. Run an accessibility pass: contrast in both themes, visible focus, heading order, landmarks, keyboard-only use of every dialog and menu, tap targets, reduced motion, and no horizontal scroll at 320 px.

## Documentation to update (slice 3)

- Replace the old design reference in `docs/design/brick-bin/` with the new design's durable files: `SPEC.md`, `TOKENS.md`, `DESIGN-NOTES.md`, the mockups (HTML, CSS, SVG, fonts) and `MOCKUP-INDEX.md`. Do not copy the PNG screenshots, `PROPOSALS.md` or `inputs/`. Delete the old mockups, old screenshots and `CRITIQUE.md` there (git keeps the history). Keep `PROPOSALS.md` in `docs/app-redesign-project/design/final/` where it is, for the human.
- Update the "Design system" bullet in `AGENTS.md` and any README text that names the old fonts, tokens or mockups.
- Keep `README.md`'s screenshots or commands accurate if they mention the UI.

## Git, PR and CI

Open a PR against `main` and watch CI until it is green. Keep the job names `check` and `e2e` as they are. Don't change CI unless a new check is genuinely needed. **Do not merge.** The human merges, and a push to `main` publishes the image and deploys it to their server within minutes.

## Definition of done

- Every screen and state in the design's `MOCKUP-INDEX.md` exists in the app, matches the mockup at 390 and 1440 px in light and dark where the design shows them, and works at 360, 768 and 1024 px.
- Nothing in the data layer, server actions, routes, permissions or schema changed (apart from anything the human cleared). No new migration in `drizzle/`.
- Kid profiles see no prices, no shopping list, no Collection, no hidden sets, and the visibility tests pass.
- `pnpm lint`, `pnpm format:check`, `pnpm typecheck`, `pnpm test` and `pnpm e2e` pass locally, and the `check` and `e2e` jobs are green in CI.
- No third-party runtime requests. Fonts and assets are self-hosted with licences. No LEGO logo or trade dress. The Rebrickable credit is still where the catalog data is shown.
- The accessibility pass is done and the a11y spec passes.
- The docs above are updated.
- The PR is open with a clear summary: what changed, every deviation from the design with its reason, every e2e spec you edited and why, anything in the design you could not build, and anything the human should look at first.
