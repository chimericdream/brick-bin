# Brick Bin site: design notes

## Concept: "Sorted by colour"

Anyone with a big tub of bricks ends up sorting it, and most people sort by colour. Then you find a
1×2 in dark tan by going to the dark-tan bin. This site works the same way. **Each section of the
site is a brick of its own colour, and you find your way by colour**: Tutorials is orange, Setup is
green, Hosting is azure, Configuration is tan, FAQ is pink. The landing page opens on a stack of those
five bricks. The Setup brick sits at the front, already open, with the one action on it. Every inner
page opens with its own brick, studs and all, and its colour carries through that page's bullets,
navigation markers and "what next" links.

The one shape is **a brick seen from the side**: a block with studs on top, at true proportions
(stud width is 0.6 of the pitch, as on a real brick). It replaces the generic rounded rectangle
everywhere a designer would normally reach for one: buttons, page heads, placeholders, step
numbers, FAQ tabs, the phone menu, the footer, the 404.

Everything around the bricks is a calm, nearly colourless workshop: off-white or charcoal ground,
black type, one typeface. The colour is all in the bricks, and the bricks mean something. That
discipline is what keeps it "a well-organised workshop" rather than a toy aisle.

**Why it fits.** The product is about putting a household's bricks in order: every box, its state,
its place, its missing pieces. The site does visibly what the app does for your sets. The idea
comes from the subject (the sorting habit, the brick's profile, the name "Bin"), not from a
category style, and it gives the docs something practical: colour tells you which section you are
in at a glance, on a phone, mid-setup.

**The one live thing.** On the landing page, the build-state menu is blown up to poster size. Pick
a state and the headline changes ("This copy is disassembled.") with a line about what that state
means. It is built from radio buttons and CSS `:has()`, so it works with scripts off and with a
keyboard.

## The brick-motif system

### Where the brick appears

| Scale | Size | Where | Rule |
| --- | --- | --- | --- |
| Text size | a 1×1 brick, 0.8em | Bullets in docs, section chips in docs navigation, the current item in "On this page", the tutorial-row marker, the "Not in version 1" list | Always next to words. Never decoration on its own |
| Component | studs 12 to 28px | Buttons (two studs), screenshot placeholders, step numbers, page heads, the "What you need" parts box, FAQ tabs, pager and "what next" bricks, docs nav current item, phone-menu links | Only on things you can press, or things that stand for an object (a page, a screenshot, a step) |
| Architecture | studs 28 to 48px | The hero stack, the one plate band per page ("What you won't find here"), the footer wordmark wall, the 404 wall | At most one per screen. Never with running text inside the patterned area |

### Where it never appears

- Behind running text. Body copy always sits on a flat ground or a flat brick face, never on studs
  or a pattern. Studs only ever sit on the top edge of a shape.
- Inside tables, form fields, code blocks or the docs reading column (apart from the 0.8em
  bullets).
- As a stud logo, a printed stud, a minifigure, or anything with LEGO's red and yellow. No
  lettering on studs.
- As loose decoration: no scattered bricks, no tilted bricks, no confetti of studs.

### Colour rules

1. A bright brick colour means a section. Used anywhere else, it would lie about where you are.
2. Neutral bricks (surface greys, charcoal) are used for things that belong to no section: the
   features board, placeholders, the 404 wall.
3. The five colours appear together in only two places: the hero stack (the way in) and the footer
   wall (the bin tipped out).
4. When the site shows a part (the "× 4" chip, the shopping-list row), it uses that part's real
   colour, such as dark tan or reddish brown. That's the only other colour allowed.
5. Bricks don't change colour at night. In dark mode the room darkens and the bricks stay the same.

### Behaviour

- Hover lifts a button's studs 2px, as if it's ready to be pressed. Pressing drops the whole button
  3px: the brick is seated. Hero bricks lift 8px.
- The current page in the main navigation sits on a small brick in its section's colour.
- With reduced motion, lifts and drops go; colour changes stay.

## Type

**Jost**, one family, self-hosted. It is an open-source geometric sans in the 1920s tradition:
round bowls that echo studs, straight stems that echo brick edges, and capitals with the confidence
of a printed parts catalogue. Bold uppercase carries the display sizes (the hero name, section and
page titles). Sentence case at 400 to 600 carries everything you read. Five sizes do all the work
(see TOKENS.md), with a big jump between display and body.

| Font | Licence | Weights used | Files |
| --- | --- | --- | --- |
| Jost, by indestructible type (The Jost Project Authors) | SIL Open Font License 1.1 (`assets/fonts/OFL.txt`) | 400, 500, 600, 700 roman; italic file included for completeness, not used in the mockups | `assets/fonts/Jost-Variable.ttf`, `Jost-Italic-Variable.ttf` (from the google/fonts repository) |
| System monospace | n/a (no download) | 400, 700 | Code blocks and inline code only |

For the Next.js build, use `next/font/local` with the same variable file, or static WOFF2 subsets
of Jost at 400/500/600/700 (same licence). Nothing may load from Google Fonts at runtime.

**The wordmark** is hand-drawn, not typed: a geometric lowercase "brick bin" on a 6-unit grid with
18-unit strokes, square terminals, and the dots of both i's drawn as studs. The mark is a 1×2 brick
in profile with a label window cut into it, like the front of a parts drawer: brick plus bin. Both
use `currentColor`. The lockup is mark plus wordmark.

## Colour

- **Ground** off-white `#F5F5F2` (light) or charcoal `#141517` (dark). Neutral: no cream, no
  terracotta.
- **Ink** near-black `#121212`, or `#EFEFEA` in dark mode. Running text is always full ink.
- **Dark fields** (`#17191C`) for the hero, the showcase, the 404 and the footer in both themes, so
  the bricks glow against them.
- **Bricks**: the five section colours, chosen from real brick colours, bright enough for black text
  at 8:1 or better, and deliberately not red-and-yellow.
- **The action** is a black brick, or off-white on dark fields. Colour is never the only thing that
  marks the action; its shape does (two studs).

Full values and contrast ratios are in TOKENS.md.

## Layout and responsive behaviour

Phone-first, one grid, equal gutters (16 / 24 / 32px), content max 1440px, large things running to
the edges.

| Area | Phone (360 to 767) | Tablet (768 to 1023) | Desktop (1024+) |
| --- | --- | --- | --- |
| Header | Wordmark and a 48px "Menu" button. The menu is a full-height sheet: five full-width section bricks (64px tall), source link, Auto/Light/Dark with words | Same | Wordmark, four links, icon theme toggle, "Set it up" button |
| Hero | "BRICK / BIN" on two lines at 24vw; full-width bricks 56px tall with names only; front brick with a full-width button | Bricks 86% wide with descriptions | Same, button at the right of the open brick |
| Features board | Two-column mosaic, wide tiles span both | Two-column mosaic, rows capped at 180px | The 12-column mosaic (eleven tiles in four sizes, no empty cells) |
| Build-state showcase | Heading, then the menu at 130vw, cropped on the right; rows at least 56px | Same | The menu at about half the screen height, cropped by the right and bottom edges |
| Self-hosting stages | Diagram, then slider (40px thumb), then the clause | Same | 50/50 split with the slider crossing both halves |
| Docs | Three section bricks in a row under the header, then a folding "On this page" | Same | Left section nav (sticky); "On this page" on the right from 1280 |
| Config table | Each variable becomes a block: name, purpose, "Default:" | Table from 720px | Table with a sticky header and a live filter |
| Tutorials index | Each row shows its screenshot inline | Same | Rows on the left, one sticky preview on the right (on hover-capable devices) |
| FAQ | Full-width cards, tabs step 48px | Same | Cards in 8 columns, "Not in version 1" and "Longer answers" in 4 |

No horizontal page scroll at any of the tested widths (checked by script at every capture). Code
blocks scroll inside themselves. Tap targets are at least 44px, most 48 to 56px.

## Accessibility

- WCAG AA contrast throughout (most pairs AAA; see TOKENS.md).
- A 3px focus ring on everything, in a colour chosen per field (blue on light, light blue on dark,
  navy on bright bricks). A skip link on every page.
- One `h1` per page, headings in order, landmarks (`header`, `nav` with labels, `main`, `aside`,
  `footer`), `aria-current` on the current page, `aria-pressed` on the theme buttons.
- The live build-state control is a real radio group inside a `fieldset`; the FAQ uses `details`
  with `name` (one open at a time, no script); the stage slider is a real range input with
  `aria-valuetext`, plus a button per stage.
- The phone menu traps focus, closes on Escape and returns focus to its button.
- Everything works without scripts except the stage slider, which falls back to showing all four
  stages as a list.
- `prefers-reduced-motion` removes all travel.

## Voice

For whoever writes the next page:

- Plain, specific, warm. Short sentences. Contractions are fine. "You" and "your household".
- Name real things: boxes, tubs, shelves, the hall cupboard, the dining table. Numbers from the
  product (48 hours, 6 GB, port 3000, five minutes) are worth more than adjectives.
- The wit is dry and lives in small places: captions, empty states, the 404, a lede. One light touch
  per section at most. Examples in the mockups: "so you can find out before step three that you
  needed it"; "Mixed is a real answer"; "Whoever does this is the admin, so it's worth being the
  grown-up in the room"; "Not added to your shopping list. We checked."
- No exclamation marks, no hype, no "seamlessly" or "unlock", no strings of three adjectives, no
  "it's not X, it's Y" reveals.
- Say "Not yet" and "Not in version 1" plainly.
- Say "building-brick sets", not "LEGO sets", unless you mean the Rebrickable LEGO catalog. Credit
  Rebrickable wherever catalog data comes up.
- Headings: titles in uppercase only at display size; everything else sentence case.

## Build notes for Next.js and Mantine

- Tokens become a Mantine theme plus CSS variables; the studs are one CSS mask (`--stud-mask`) on a
  `::before`, so any component can become a brick with a class and a `--brick` colour. No images
  needed.
- Components map to Mantine: `Button` (custom styles), `Burger` and `Drawer` (phone menu),
  `SegmentedControl` or three `ActionIcon`s (theme toggle), `Accordion` (FAQ, or keep native
  `details`), `Table` (config), `TableOfContents`/`ScrollSpy` (on this page), `Slider` (stages).
  Everything is ordinary CSS: masks, grid, `:has()`, `aspect-ratio`.
- Theme: `data-theme` on `html`, absent means "follow the device"; the choice is kept in
  `localStorage` (`bb-theme`) and applied by a tiny inline script before paint.
- All assets are local SVG and one font file. No third-party requests, no analytics.
- The repo link (`#repo`, `#repo-issues`, `#repo-licence`) is a placeholder; see questions.

## Content that needs checking against the real app

The brief allows representative docs text. These are the places I had to guess:

- Menu paths and button labels: "Admin → Catalog", "Check page", "Import catalog", "Add set".
- Setup commands: the compose file name and `docker compose up -d`; the example `.env` including a
  `DATABASE_URL` format.
- Backups: the example invents a script name (`./scripts/backup-db.sh`) and folder names
  (`data/covers`, `data/instructions`). It is labelled "Example, check against your compose file".
- Restore order, and that the import page shows progress and a countdown to the next import.
- The landing page's sample numbers ($1,284, 3 stale values, p. 37 of 112) are illustrative chips.

## Deviations, and how the design skill was used

I used the `design-taste-frontend` skill as the brief asks. It dealt the direction "One motif" (seed
930793435) with a "tabbed folder stack" hero, which became the stack of section bricks. Changes from
what it dealt, with reasons:

- **Type redrawn** once: the dealt face (Chillax) is under a non-OFL licence and served from a third
  party's CDN, which the brief rules out. The redraw gave Jost (OFL).
- **Palette**: kept the dealt proportions (neutral ground, black ink, flat colour fields) but took
  the colours from the subject: real brick colours, assigned to sections. The dealt magenta accent
  and pastels read as a toy aisle.
- **Header**: one consistent site header across all pages instead of a centred wordmark on the
  landing page only, because the docs need the same navigation everywhere.
- **The closing call to action** shows a screenshot placeholder rather than a working fake of the
  app's first-run form, because the brief asks for placeholders wherever the real app would appear.
- **No found photographs**: the skill wants several real pictures per page. The brief says
  placeholders only for the app, and photos of branded bricks would risk trade dress. The pictures
  are the placeholders, the drawn close-ups and the brick graphics.
- The skill's browser inspector could not start on this machine (it expects the browser to print its
  debugging address, and Edge did not). I ran its source lint (0 fails on all pages and the
  stylesheet) and reviewed my own screenshots at every width instead.

### Last critique round (the skill's format)

```
ROUND 3
Seen in one second: a dark page with a huge BRICK BIN and a stack of coloured bricks, each a section; the green one says "Start the setup guide".
Idea (one sentence): the household's sorting habit, parts sorted by colour, becomes the site's wayfinding: each section is a brick of its own colour.
Live thing: the build-state menu at poster size, changing the headline per state.
Layout words by section: hero=centred name over a brick stack / sets=split statement with inline thumbnails / features=12-column mosaic / screens=two placeholders / showcase=one control blown up on dark / hosting=50-50 split with slider / plate=three columns on a studded band / cta=green field, title bottom-left, placeholder right / footer=block wordmark wall.
Scores: design 8 · usability 8 · creativity 8 · content 8 → overall 8.0.
Caps applied: none.
Top three problems (most visible first), each with the screenshot it shows in and the fix:
1. Placeholders are large flat grey frames; in tutorial-page-1440-light the five of them dominate the steps. Fix when real screenshots arrive; until then they are honest.
2. The features board's enlarged chips are site-drawn, so they can drift from the real app's look. Swap for real crops once the app is shot (listed in PLACEHOLDERS.md).
3. The tutorials index on phones repeats ten grey frames (tutorials-390-light). If it feels long with real images, show pictures only for the first row of each group.
```

Earlier rounds fixed: invisible text in the dark tiles, docs section bricks showing twice on desktop,
an unreadable theme toggle in the footer, tutorial rows that didn't align, an empty right half on the
FAQ (now "Not in version 1" and "Longer answers"), a ragged 404 wall, sub-14px text in phone tiles,
a clipped board heading at 1024, and an indented statement section.

## Files

| Path | What |
| --- | --- |
| `index.html` | Landing page |
| `tutorials.html` | Tutorials index (index with preview) |
| `tutorial-import-catalog.html` | Tutorial template, filled in for "Import the LEGO catalog" (all index rows link here for now) |
| `docs-setup.html`, `docs-hosting.html`, `docs-configuration.html` | Documentation |
| `faq.html` | FAQ |
| `404.html` | Not found |
| `states.html` | Interaction states, theme toggle states, docs navigation, motif and colour rules |
| `assets/css/site.css`, `assets/js/site.js` | All styles and behaviour |
| `assets/logo/` | `brick-bin-mark.svg`, `brick-bin-wordmark.svg`, `brick-bin-lockup.svg`, `favicon.svg` |
| `assets/art/` | `stud-tile.svg` (the mask), `brick-1x1.svg`, `brick-1x2.svg`, `plate-divider.svg` |
| `assets/fonts/` | Jost variable fonts and `OFL.txt` |
| `screenshots/` | 53 PNGs: every page at 390 and 1440 (landing also at 360, 768, 1024), dark versions of landing, tutorials, tutorial page, configuration, FAQ and 404, plus `state-*` shots for the phone menu, docs navigation, theme toggle, build-state menu, stages slider, tutorial hover and FAQ card, and the states sheet |

The shared header, menu and footer were stamped into each page from `index.html` by a small script
kept outside this folder; every page is plain static HTML and opens by double-clicking.
