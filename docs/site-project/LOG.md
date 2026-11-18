# Brick Bin site project log

Kept by the project manager. Records decisions, questions and answers, gate outcomes, and the
Design A / Design B mapping for Phase 1.5.

## 2026-11-17: Setup

- Created branch `feat/marketing-site` from `main` (da8d7bf).
- Committed the prompt files in `prompts/` (ba18def).
- Created empty working directories `design/designer-1/`, `design/designer-2/`, `design/designer-3/`.
  Git does not track empty directories, so each is committed once its designer delivers.

## Phase 1: two independent designs

- Designer 1: Fable 5.2, directory `design/designer-1/`. Receives briefs 01 + 02.
- Designer 2: Opus 5.5, directory `design/designer-2/`. Receives briefs 01 + 02.

### Designer 1 handoff (agent a7debd3f9080208fd)

- Concept: "One brick, side on". Teal on cool paper, mint second, coral only for "out of place".
  Albert Sans + JetBrains Mono (OFL, self-hosted).
- Completeness check against the brief's deliverables: passed. All pages, landing in light and dark
  at phone and desktop, dark tutorial and Configuration, mobile menu, docs nav (mobile and desktop),
  theme toggle and the interactive-states sheet (`states.html`). DESIGN-NOTES, TOKENS, PLACEHOLDERS
  (7 entries), SVG assets and fonts are present. 46 PNGs.
- Isolation statement: opened nothing in the repo outside `designer-1/`. Outside the repo it read the
  design skill's files, used system Edge with a temp profile, and downloaded fonts (jsDelivr/Fontsource)
  and OFL texts (GitHub) at design time.
- Injected context: the session auto-injected the repo's CLAUDE.md/AGENTS.md, which named the app's
  fonts (Bricolage Grotesque, Atkinson Hyperlegible Next), token naming and architecture rules. It says
  it ignored them and chose different fonts. Reported to the human.
- Extras in the directory: `tools/` (its HTML stamping and screenshot scripts) and `.taste-skill/`.
- Open questions (held for the human at the gate): repo URL and licence; Rebrickable credit wording;
  real screen and button labels; light and dark screenshots; a third "System" toggle state; meaning of
  the "Mixed" build state.

### Incident: machine nearly locked up during Phase 1

- Both designers ran in parallel. The machine became unresponsive and the human restarted it.
  Designer 2 was cut off (API unreachable) before it wrote DESIGN-NOTES, TOKENS or PLACEHOLDERS.
- Evidence: the OS temp folder holds 12 leftover `bbcap-*` browser profiles (18:59 to 19:14), 4
  `bb-shoot-*` profiles (Designer 1's script, which runs one browser) and 3 `ad-chrome-*` profiles.
  The cause is not proven.
- Designer 2 was resumed with mandatory limits: one browser process at a time, no parallel or
  background captures, re-shoot only what's missing, clean up its own processes and profiles.

### Human decisions (2026-11-17)

- Designer 1's work still counts, despite the injected CLAUDE.md/AGENTS.md context.
- The human agrees Designer 2 was the likely cause of the near-crash: Designer 1 had finished well
  before the machine locked up.
- Answers to Designer 1's open questions: pending from the human.

### Designer 2 handoff (agent a0129efb7612ff56f)

- Concept: "Sorted by colour". Each section is a brick of its own colour (Tutorials orange, Setup
  green, Hosting azure, Configuration tan, FAQ pink) on a near-colourless workshop ground. Jost (OFL)
  for everything, system monospace for code.
- Completeness check: passed. All pages, landing in light and dark at phone and desktop, dark
  tutorial and Configuration (plus dark tutorials, FAQ, 404), mobile menu, docs nav, theme toggle
  (auto, light, dark) and `states.html`. DESIGN-NOTES, TOKENS, PLACEHOLDERS (19 entries), SVGs and
  fonts are present. 53 PNGs. Its screenshot and stamping scripts sit in its own scratchpad, not here.
- Isolation statement: opened nothing in the repo outside `designer-2/`. Outside the repo: the design
  skill's files, its scratchpad, temp browser profiles, and font downloads from the google/fonts repo.
- Injected context: the same CLAUDE.md/AGENTS.md as Designer 1 (app stack, the app's fonts, design
  file paths, architecture rules), plus git status (branch, git user name, recent commit titles). It
  says it used none of it. An environment note also showed it the `designer-1` path when the PM's shell
  changed directory. It says it did not open that path.
- Screenshot method, in its own words: one headless Edge per run, never overlapping, and nothing in the
  background. It says the 12 `bbcap-*` profiles were its own and were left behind because cleanup hit
  locked files. It has deleted them. It took no new shots after the restart.
- Open questions (held for the human): repo URL and licence; who the copyright line credits; whether
  it may name and link Tailscale and link Rebrickable's downloads page directly; whether the section
  colours should be re-checked against the app's palette.

### Gate 1 outcome (2026-11-17)

- The human approved both designs as they stand and told the PM to go with its recommendations.
- Section colours are not to be compared with the app's palette: the site keeps its own identity.
- Still pending from the human: repo URL and licence, copyright holder, Rebrickable credit wording and
  direct links, naming and linking Tailscale, light and dark screenshots, a "System" theme setting, the
  meaning of "Mixed".

## Phase 1.5: synthesis

- **Mapping (PM only, never shown to Designer 3): Design A = Designer 2, Design B = Designer 1.**
  Chosen by a random byte (195, odd, so Designer 2 became A).
- Copied each design into `design/designer-3/inputs/design-a/` and `inputs/design-b/`, leaving out
  `tools/` and `.taste-skill/`.
- Authorship removed from the copies: "(Designer N)" in the titles of DESIGN-NOTES, TOKENS and
  PLACEHOLDERS, "Designer 1" in B's `site.css` header, B's paragraph about `tools/` (reworded to say
  a stamping script is not included), and A's `.taste-skill/` row. A scan for designer numbers, model
  names and tool paths came back clean.
- Designer 3: Opus 5.5. Receives briefs 01 + 03, its directory path, and the one-browser process limit.

### Human answers to the Phase 1 questions (2026-11-17), relayed to Designer 3

- Repo: https://github.com/chimericdream/brick-bin. Licence: MIT. Copyright: Bill Parrott.
- Rebrickable: no specific credit wording found, so a plain link is fine. Linking straight to the
  downloads page is fine.
- Tailscale may be named and linked (tailscale.com).
- Real screenshots: likely some in both themes, possibly not all.
- Theme toggle: add a third "System" setting.
- "Mixed" build state: no longer a coherent set; its parts are mixed into everything else.
- Section colours are not compared with the app's palette.

### Second synthesis (human request, 2026-11-17)

- The human asked for a second Designer 3 on Fable 5.2 doing the same task. It works in
  `design/designer-3b/` with an identical copy of `inputs/`, so the A/B mapping is the same (A =
  Designer 2, B = Designer 1).
- It gets the same briefs (01 + 03), the same process limits, and the human's answers up front.
- The two Designer 3s never see each other's work. They run in parallel, each limited to one browser.
