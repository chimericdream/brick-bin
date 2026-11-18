# Brick Bin app redesign: the plan

The marketing site shipped with a strong identity. The app works but looks generic. This project
redesigns the app's look and interaction in the same family as the site. It follows the same shape as
`docs/site-project/`: a project manager coordinates designers and a developer, and the human approves
at gates.

## Team

| Role            | Model     | Brief                                                     |
| --------------- | --------- | --------------------------------------------------------- |
| Project manager | Opus 5.5  | `prompts/00-project-manager.md`                           |
| Designer 1      | Fable 5.2 | `prompts/01-design-brief.md` + `02-designers-addendum.md` |
| Designer 2      | Opus 5.5  | `prompts/01-design-brief.md` + `02-designers-addendum.md` |
| Developer       | Opus 5.5  | `prompts/03-developer-brief.md`                           |

Start by giving `prompts/04-kickoff.md` to the project manager.

## How it differs from the marketing site project

- **Designers see the app.** They get screenshots of most screens (invented household, desktop and
  phone, light and dark for the core screens) and the marketing site's finished design as the brand
  family to extend. They still don't browse code or the old design files, and they never see each
  other's work.
- **No synthesis designer.** The human picks one of the two designs and may ask that designer for
  revisions, so each designer's package must be implementation-ready (`SPEC.md`).
- **UI only.** No new features, schema changes or permission changes. Ideas that need them go in
  `PROPOSALS.md`.
- **The developer works in three slices** and the human reviews the running app after the first.

## Phases and gates

1. **Phase 0:** commit the prompts and the screenshot script, capture the screenshots, stage the inputs.
2. **Phase 1:** two designs in parallel (one browser process at a time each). **Gate 1:** the human
   reviews both, chooses one, and asks for revisions if wanted. The PM finalizes the chosen package.
3. **Phase 2:** the developer builds on `feat/app-redesign`. **Gate 2:** the human reviews slice 1
   (theme, shell, Library, set detail) running. Slices 2 and 3 follow, then a PR. **The human merges**
   (a merge to `main` deploys to the server).

## Inputs

`pnpm shots` seeds an invented household (about 14 sets, covers, missing pieces, wishlists, an
activity trail, a finished catalog import) and writes the screenshots and `INDEX.md` to `screenshots/`
(gitignored). The PM stages them for the designers. The script is `e2e/screenshots/screens.shots.ts`.

## Where things live

- `prompts/`: the briefs.
- `design/` (gitignored, on disk only): staged inputs, each designer's work, the final package.
- `LOG.md`: the PM's log, created in Phase 0.
