# App redesign: PM log

## 2026-11-18 Phase 0

- Committed the briefs and `.gitignore` line (`754e4d8`, docs) and the screenshot script (`635349c`, test). `pnpm lint` exit 0 (warnings only), `pnpm format:check` clean.
- Screenshots: `screenshots/INDEX.md` written 2026-11-18 10:11 local, after the last `src/` commit, so not re-run. 81 PNGs listed and staged.
- Skipped in the capture run: `library-filtered` 1440 light (click timeout). Not captured by design: first-run setup, catalog import running, instructions panel with PDFs (the brief describes these).
- Staged `design/inputs/` (app-screenshots: INDEX.md + 81 PNGs; marketing-site: `site/design/` minus `tools/`, `EVALUATION.md`, `PLACEHOLDERS.md`) and copied it into `design/designer-1/inputs/` and `design/designer-2/inputs/`.
- Note: the site `SPEC.md` mentions the three excluded items; designers are told they were left out on purpose.

## Phase 1

- Launched Designer 1 (Fable 5.2, agent `a11d1a0e1eaed88c0`) and Designer 2 (Opus 5.5, agent `aa192384cfaf253bd`) in parallel with briefs 01 + 02, their directory and the machine-safety rule.
- Designer 1 done (~36 min): concept "Sorted by state". 73 mockups, 153 PNGs.
  Outside reads: nothing in the repo. It read the taste-skill plugin files in `~/.claude/plugins/cache`. It used the session scratchpad for its browser profile (removed) and saw a `tabler/` folder there that it says it did not open.
- Designer 2 done (~44 min): concept "The sorting tray". 32 mockups (states via `?state=`), 147 PNGs.
  Outside reads: nothing in the repo. It read the taste-skill plugin files and downloaded Tabler icons with `npm pack` into the shared session scratchpad (that is the `tabler/` folder Designer 1 saw).
- Incident (minor): both designers shared one session scratchpad. Only Tabler icons and browser profiles went there, and no design work.
- Completeness check (PM, completeness only): both packages pass.
  - Every INDEX screen is covered at 390 and 1440 light (the filter sheet is phone-only).
  - Dark versions of the 7 core screens, 768/360 widths, all uncaptured states, kid views, 404, `states.html`.
  - All `SPEC.md` sections are present, with fonts and OFL licences included.
  - Both add an unrequested `tools/` folder (their generators).
- Designer questions are held for the human at Gate 1. Facts checked in code:
  - A barcode scan button exists (`IconBarcode`, shown only where the browser has `BarcodeDetector`).
  - "I bought this" has an Undo.
  - Stale paste means "This page is older than your last import. Use it anyway."
  - The "Colour" label is used by the e2e specs.
- Gate 1: waiting on the human.

## Gate 1 decision (2026-11-18)

- The human chose **Designer 1** across the board. Designer 2 is finished.
- One idea from Designer 2 was relayed **in words only** (no image forwarded): the 404's dashed "missing part" box, "1 × Page, color unknown / Not added to your shopping list. We checked."
- Answers sent to Designer 1:
  - Barcode scan: add it, as the existing button that shows only where the browser supports it.
  - Undo: exists, label "Undo".
  - Stale paste = "Nothing new to import". It means no dates newer than the last import, and the override stays.
  - "Color": US spelling everywhere, tests to be updated by the developer.
  - Unseen labels: keep the current wording.
  - CSV preview: optional. It already exists in the app; I described its contents and labels from the code.
- Designer 1 resumed for revisions.

## Finalize (2026-11-18)

- Designer 1 revisions done: 76 mockups, 158 PNGs.
  - 404 dashed box: `not-found`, SPEC 6.15.
  - Scan button and scanning sheet: `add-set-scan`, SPEC 6.11. Removed from PROPOSALS.
  - "Undo".
  - "Nothing new to import", with the override kept.
  - Color → US spelling: every instance in the copy-change table, flagged as affecting tests.
  - Unseen labels: keep current wording (SPEC 12).
  - CSV preview and finished states drawn: `import-preview`, `import-finished`, SPEC 6.12.
- Designer 1 corrected its own horizontal-scroll check, fixed one overflow and re-shot every PNG.
- Outside reads: none in the repo.
- Its two follow-up questions, answered from code (facts, not design):
  - The wishlist's lookup uses the same CatalogLookup component, so the scan button appears there too.
  - The stale-paste import button is already disabled until the override is checked, which matches the design.
  - Both answers go to the developer.
- Final completeness check passed. Copied the package (without `inputs/`) to `design/final/`.
- The human pre-approved starting Phase 2 once final was saved.

## Phase 2

- Launched the Developer (Opus 5.5) on slice 1 with brief 03, the machine-safety rule, the final path and four relayed facts.
- Slice 1 done: 6 commits, `ae3bcd4`..`8033a48`.
  - Built: tokens, theme, fonts, shared brick components, shell, More, Library, set detail.
  - The developer reports e2e at 113/113.
  - Specs edited deliberately: library, sets, navigation, visibility, collection, instructions, and the shots script.
- PM verification:
  - typecheck, lint (exit 0), format:check (after I fixed this log's trailing blank line) and build pass.
  - No changes in `src/server` or `drizzle/`.
  - Vitest: 352/353 twice. `catalog/import.test.ts` "returns at once…" times out under full-suite load and passes 10/10 when run alone. No server code was touched, so I treat it as a pre-existing timing flake.
- Gate 2 (slice 1 review): waiting on the human, with four developer questions (kid missing-pieces link, kid More page, missing-pieces link target, accessible-name changes).
- Gate 2: the human approved slice 1 and took the PM's recommendations:
  1. Kid missing-pieces link: keep as is.
  2. Kid More page: approved.
  3. Missing-pieces link target: keep the app's.
  4. Accessible-name changes: approved.
- Developer resumed on slice 2.
- Slice 2 done: 15 commits, `9aebf11`..`7498d31`.
  - PM verification: typecheck, lint, format and build pass. Vitest is 352/353, with the same `import.test.ts` load flake (2 of 3 PM full runs).
  - The `src/server` diff is wording only ("Colour" → "Color", including the CSV header). No drizzle changes.
- Developer questions:
  1. Wishlist sheet under 1024: check it in the slice 3 phone pass.
  2. People role lines are new copy the developer wrote: kept for now and put to the human.
- No human stop needed, so the developer was sent on to slice 3.
- Slice 3 done: `6de147f`, `56d8769`, `b25dc3d`.
  - Built: accessibility fixes (build-state menu focus, focusable scrolling tables), WISH-11 and WISH-12 for the phone wishlist sheet, and `docs/design/brick-bin/` replaced with the new design.
  - PR https://github.com/chimericdream/brick-bin/pull/6, head `b25dc3d`.
  - CI: `check` and `e2e` (4 shards) green. Mergeable. The developer reports 115 e2e locally.
  - PM verification: lint, format, typecheck and 353/353 unit tests pass.
  - No drizzle changes. No CDN URLs in the UI; the only ones are the existing on-demand Rebrickable catalog import on the server.
- Open for the human: the People role lines (new copy). The human merges the PR.
