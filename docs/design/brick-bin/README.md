# Brick Bin: design mockups (Phase 1)

**Direction.** The library is a sorting tray. Sets stand as wide, landscape box tiles on grooved rails (planks), each tile carries a build-state label and a completeness label like a parts-drawer tag. Cool baseplate grey ground, one "bin blue" accent used for small marks and pale tints, rust for missing pieces. Bricolage Grotesque for titles and numbers, Atkinson Hyperlegible Next for everything else. Light is primary, dark follows `prefers-color-scheme` or `?theme=dark`.

**Idea sentence.** A tray of boxes where every box tells you, in a word and an icon, whether it is built, and whether it is complete.

## How it was made

- Skill: taste-skill 2.1.4, app-screen mode. `draw.mjs --app --kind creator --screens list,detail,settings --options 3` dealt `true-black-flat`, `editorial-greeting` and `accent-ladder` (seed 471810216).
- Chosen: **accent-ladder**. Why: the product's job is reading status at a glance on many objects. This style spends colour only on small marks and pale tints, so the six build states and the completeness labels (all pale tints) carry the colour, and the chrome stays quiet. True-black-flat is dark only and the household uses this by day on phones; editorial-greeting needs a greeting and a centred column that suits a home page, not a library of 25 tiles.
- Redraws: none of the style's move. Its dealt raspberry hue and DM Sans (a Google Fonts link) were replaced: the hue by bin blue (the Shelf is green/stone/berry, and raspberry sits too close to The Shelf's berry), the font by two self-hosted families.
- Face chosen: the objects in the lead block (box art on planks) plus a ground tinted toward the hue (`#eef1f5`). Signature element: **the plank with drawer-label tiles**. Brand mark: a three-compartment tray, not a stud.
- Checks run: `inspect.mjs --app` on library, set and shopping; my own CDP screenshot script for all 102 PNGs; a contrast script (below). Findings and fixes are in `CRITIQUE.md`.

## Why this differs from The Shelf

| | The Shelf | Brick Bin |
|---|---|---|
| Ground | warm stone `#e7e7e0` | cool baseplate grey `#eef1f5` |
| Accent | forest green `#1c6b56` | bin blue `#1d5ca6` |
| Alarm | berry | rust, used only for missing pieces and delete |
| Type | Fraunces + Figtree | Bricolage Grotesque + Atkinson Hyperlegible Next |
| Nav | one pill bar at the top | sidebar on desktop, tab bar on phone (sibling structure on phone) |
| Tiles | portrait 4:5 covers, many per plank | landscape 3:2 box tiles, 3 per plank beside the facets, 2 on phone |
| Labelling | plain loan tags | icon + word badges for 6 build states and 3 completeness states |

## Palette and type

Full light/dark table with hex values: `tokens.md`. Contrast, computed with `.taste-skill/contrast.mjs` (WCAG relative luminance):

| Pair | Light | Dark |
|---|---|---|
| ink on ground / surface | 14.5 / 16.5 | 15.8 / 14.4 |
| muted (secondary) on ground / surface / sunk / tint | 5.95 / 6.74 / 5.52 / 5.39 | 8.45 / 7.69 / 8.76 / 6.32 |
| accent on surface | 6.70 | 6.91 |
| on-accent on accent | 6.70 | 7.27 |
| accent-ink on tint | 8.35 | 9.32 |
| input outline on surface (UI, needs 3) | 3.39 | 3.87 |
| the eight badge pairs | 7.35 to 10.86 | 8.90 to 9.75 |

Fonts are `source/fonts/*.woff2` (latin subset, from `@fontsource-variable/*`) with their licences (SIL OFL). The only other font is the system monospace stack on the pasted-HTML text area, because a third loaded family is not allowed.

## Components

- **Tile.** 3:2 frame on a sunk neutral card, `preserveAspectRatio: xMidYMid meet` (the contain rule), then name, `brand · number · year`, and up to two badges. A set with several copies shows a copy-count chip on the art. Tile summarises the set: worst completeness wins, build state of the first copy (several states are all listed).
- **Badge system.** Always icon + word. State icons: lock, open box, tool, stacked blocks, split squares, shuffle (Mixed also gets a hatched fill). Completeness: warning circle (rust) "Missing 4 pieces", check circle (green) "Complete (checked Mar 2026)", dashed circle (outlined) "Not checked"; sealed copies show only "Sealed". On phone tiles "Complete (checked Mar 2026)" shortens to "Complete"; the full text is on the set page.
- **Part tile.** A white image tile (always white, both themes), then swatch + colour name, part number, name, quantity in the set, a stepper and an Add button. Light colours stay legible because the name and a ringed swatch sit outside the image. Selected tiles get a 2px accent ring and a "Missing n" badge. The fallback label "shown in Black" sits on the image corner.
- **Store trip.** One column, 44px tick boxes, 112px part images, 28px quantities, a progress bar, a fixed Done bar above the tab bar. Ticked rows get an accent outline on the image (the image is never dimmed, so white stays white). Ticks are browser-only; the finish sheet shows which copies each part fills first.
- **Build-state menu.** A button showing the badge; the menu lists all six with a description and a check on the current one (44px rows). On phone it spans the card.
- **Planks.** Rows of tiles over a 12px rail with a highlight edge and faint grooves. Two planks of the sign-in wall are shifted for rhythm.
- **Privacy.** Kid pages have no prices, no Collection link, no edit controls; the hidden present is absent and counts (19 sets, 24 copies) are recomputed. The kid wishlist has no mark, count or hint of a purchase; only a "Mockup note" strip (not part of the product) says so.

## Opening the mockups

Open `source/index.html` in a browser (no server, no network). Every page reads `?theme=dark|light`, `?role=kid|member`; below 900px wide it switches to the phone layout. State parameters are listed on the index page. To rebuild the screenshots: `node .taste-skill/shoot.mjs docs/design/brick-bin/screenshots` from the repo root (Chrome or Edge, Node 22+; the scripts live in the gitignored `.taste-skill/`).

## Data

All set names, numbers, people and prices are invented (brands are real names, the sets are not). Counts are computed in `data.js`: 20 sets, 25 copies, 22 missing pieces in 7 grouped part lines plus 1 other item, total paid $2,064.80, estimated $2,264.99. `console.assert`s check that facets, bands, shopping totals, locations and collection tables add up.

## Where the mockups deliberately differ from the plan

| Plan | Mockup | Why |
|---|---|---|
| Wishlist example "You bought this on 3 Dec" | Shown as "3 Nov" | The mock date is 16 Nov 2026, so 3 Dec would be in the future |
| LDraw part renders | Simple isometric SVG drawings on opaque white | No real renders available; the white tile and layout behave the same |
| Settings sub-pages Brands and themes, Activity | Linked in the nav but not drawn | Not on the screen list |
| Kid nav "Library, Wishlist" suggested | Library, Shopping list (read-only), Wishlist | Plan section 7 lets kids see the shopping list |
| Sidebar lists every Settings page | One "Settings" link; sub-nav inside Settings shows "Catalog · Imported 15 Nov" | Less clutter; the date stays next to the Catalog link |
| Library facet counts | Count sets, not copies | A set with 5 polybag copies is one tile |
| Minifigs tab | Generic boxy pictograms | Avoids minifigure likeness |
| Catalog button | Import button sits under the paste panel; no separate fetch button | `REBRICKABLE_PAGE_FETCH` defaults to false; the other layout is the same card with a button above |
| Phone tab bar | Library, Shopping, Add (centre), Wishlist, More | Collection and Settings live under More |
| Value sort in the library | In the sort list for members, absent for kids | Plan 6.1 |

## Decisions needed

1. Approve bin blue + Bricolage/Atkinson, or ask for another hue or pair.
2. Tile summaries for multi-copy sets (worst completeness, first copy's state): fine, or show one badge row per copy?
3. Should the phone library start with 2 columns (as drawn) or a single wide column of larger boxes?
4. Do kids get the "Shopping" tab (drawn) or should it be hidden?
