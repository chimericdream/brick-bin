# Tokens: Brick Bin app

Every value here is a CSS custom property at the top of `mockups/assets/css/app.css`. That file is
the source of truth. If this document disagrees with it, the stylesheet wins.

In the build, keep the names as CSS variables (for CSS modules) and mirror them in the Mantine
theme's `other` object. They replace the current `--app-*` variables. Names shared with the marketing
site have the same values as the site.

## 1. Color: the room (changes with the theme)

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--ground` | `#F5F5F2` | `#141517` | Page background |
| `--paper` | `#FFFFFF` | `#191B1E` | Lists, tables, panels, inputs, menus, dialogs. **New in the app.** |
| `--surface` | `#EAEAE5` | `#1E2023` | Sidebar, notes, hover on rows, cover frame, baseplate |
| `--surface-2` | `#DCDCD5` | `#2A2D31` | Quiet buttons, current nav item, segmented track, quiet tags |
| `--line` | `#CFCFC7` | `#34373C` | 1px rules and panel borders. Decorative (1.6:1 and 1.4:1 on paper) |
| `--edge` | `#85857D` | `#767A80` | Borders that mark a control: inputs, checkboxes, switch, outlined tags. **New in the app.** |
| `--ink` | `#121212` | `#EFEFEA` | All running text, headings, 2px rules, dashed outlines, checked boxes |
| `--muted` | `#4D4D48` | `#ABAEB2` | Secondary lines, hints, placeholders. Never body copy |
| `--field` | `#17191C` | `#0B0C0D` | Page head, phone tab bar, toasts, sign-in panel. Dark in both themes |
| `--field-2` | `#26292E` | `#1C1E21` | Quiet buttons and the current tab on a field |
| `--field-line` | `#3A3E44` | `#2C2F33` | Rules on a field, hover of a quiet button on a field |
| `--field-ink` | `#F5F5F2` | `#EFEFEA` | Text on a field. Fill of the primary button on a field |
| `--field-muted` | `#B8BBBF` | `#ABAEB2` | Secondary text on a field |
| `--btn` / `--btn-ink` | `#121212` / `#F5F5F2` | `#EFEFEA` / `#121212` | Primary button |
| `--btn-hover` | `#34342F` | `#FFFFFF` | Primary button, hover |
| `--focus` | `#0B5FC4` | `#7CC0FF` | Focus ring |
| `--focus-field` | `#7CC0FF` | `#7CC0FF` | Focus ring on a field |
| `--danger` | `#B3261E` | `#FF9A8D` | Destructive text and fill, error text, error borders. **New in the app.** |
| `--danger-hover` | `#8F1D17` | `#FFB4AB` | Danger button, hover |
| `--danger-ink` | `#FFFFFF` | `#121212` | Text on a danger fill |
| `--danger-bg` | `#FBEAE7` | `#3A1A17` | Error banner, hover of a danger text button |
| `--danger-text` | `#7A1711` | `#FFB4AB` | Text on `--danger-bg` |
| `--dot` | `rgb(18 18 18 / .13)` | `rgb(239 239 234 / .12)` | Baseplate dots |
| `--scrim` | `rgb(18 18 18 / .55)` | `rgb(0 0 0 / .66)` | Behind dialogs and sheets |

## 2. Color: the bricks (never change with the theme)

In the app a brick color means a build state. It is used as a fill with `--brick-ink` text on it,
never as a text color and never as a tint.

| Token | Value | Build state | Ink on it |
| --- | --- | --- | --- |
| `--st-sealed` | `#D8BC88` | Sealed | 10.2:1 |
| `--st-opened` | `#F49AC1` | Opened | 9.1:1 |
| `--st-progress` | `#FF8C1A` | In progress | 8.0:1 |
| `--st-built` | `#6CC04A` | Built. Also the brick in the logo mark | 8.3:1 |
| `--st-apart` | `#4DB3E6` | Disassembled | 8.0:1 |
| `--st-mixed` | `#A0A5A9` | Mixed | 7.5:1 |
| `--brick-ink` | `#121212` | Text and glyph on any brick, both themes | |

A state is applied with one attribute: `data-st="sealed|opened|progress|built|apart|mixed"` sets
`--st`, and components read `var(--st)`.

Part color swatches (the little squares beside "Black", "Red") are data from the catalog and are not
tokens.

## 3. Contrast (computed, WCAG 2.1)

| Text pair | Light | Dark |
| --- | --- | --- |
| Ink on paper / ground / surface / surface-2 | 18.7 / 17.2 / 15.5 / 13.6 | 15.0 / 15.8 / 14.2 / 12.0 |
| Muted on paper / ground / surface / surface-2 | 8.5 / 7.8 / 7.0 / 6.2 | 7.8 / 8.2 / 7.3 / 6.2 |
| Field ink on field / field-2 | 16.1 / 13.4 | 17.0 / 14.5 |
| Field muted on field / field-2 | 9.1 / 7.6 | 8.8 / 7.5 |
| Primary button text on its fill | 17.2 | 15.8 |
| Brick ink on the six bricks | 7.5 to 10.2 | same |
| Danger on paper / ground / surface | 6.5 / 6.0 / 5.4 | 8.4 / 8.9 / 8.0 |
| Danger ink on danger (button) | 6.5 | 9.2 |
| Danger text on danger-bg (banner) | 9.2 | 9.2 |

| Non-text pair (3:1 needed) | Light | Dark |
| --- | --- | --- |
| Edge on paper / ground / surface | 3.7 / 3.4 / 3.1 | 4.0 / 4.2 / 3.8 |
| Focus ring on paper / ground / surface | 6.1 / 5.6 / 5.0 | 8.9 / 9.4 / 8+ |
| Focus ring on field | 9.1 | 10.1 |

Two things to keep in mind:

- **A brick color against the light ground is only 1.7:1 to 2.2:1.** That is why a state is always a
  filled shape with a glyph and a word in ink, and why a picked brick in the sorter gets a 3px ink
  inset ring and a check mark.
- `--line` is decorative. Anything a person must find to operate (an input, a checkbox) uses `--edge`.

## 4. Type

| Face | Use | License | File |
| --- | --- | --- | --- |
| **Albert Sans** (variable, 100 to 900) | Everything except identifiers | SIL OFL 1.1, `AlbertSans-OFL.txt` | `mockups/assets/fonts/AlbertSans-Variable.woff2` |
| **JetBrains Mono** (variable, 100 to 800) | Set numbers, part numbers, element ids, catalog ids, file names, pasted page source | SIL OFL 1.1, `JetBrainsMono-OFL.txt` | `mockups/assets/fonts/JetBrainsMono-Variable.woff2` |

These are the marketing site's files, copied as they came. The site's own handoff warns that their
glyph coverage was not inspected. Check that before shipping, or take fresh copies from
`@fontsource-variable/albert-sans` and `@fontsource-variable/jetbrains-mono` (both copy files into
the build, so nothing loads from a third party). Load with `next/font/local`. Preload Albert Sans
only. `font-display: swap`.

Stacks: `"Albert Sans", system-ui, "Segoe UI", sans-serif` and
`"JetBrains Mono", ui-monospace, "Cascadia Mono", Consolas, monospace`.

| Token | rem | px | Use |
| --- | --- | --- | --- |
| `--fs-small` | 0.875 | 14 | Meta lines, hints, labels, tags, table heads, tab-bar labels. **Nothing is smaller.** |
| (fixed) | 0.9375 | 15 | Small buttons, sorter labels from 768 |
| `--fs-body` | 1 | 16 | Body, inputs, buttons, nav, table cells |
| (fixed) | 1.0625 | 17 | Set name in a row or tile, copy title, wish name |
| `--fs-lead` | 1.125 | 18 | `h4`, sign-in lede, the 404 paragraph |
| `--fs-h3` | 1.25 | 20 | `h3`, panel titles, dialog titles, fact values |
| `--fs-h2` | 1.375 | 22 | Section titles |
| (fixed) | 1.5 | 24 | Quantities (`×4`) |
| `--fs-h1` | 1.625, then 2 from 1024 | 26, then 32 | Page title |
| `--fs-figure` | 1.75 | 28 | The three Collection totals |

The sign-in headline (28 to 52px) and the 404 title (32 to 48px) are the only larger type, and they
are outside the app shell.

| Role | Weight | Tracking | Line height |
| --- | --- | --- | --- |
| `h1`, `h2` | 800 | -0.03em | 1.1 |
| `h3`, `h4` | 700 | -0.02em | 1.2 |
| Body | 400 | 0 | 1.5 |
| Buttons | 650 | 0 | 1.2 |
| Labels | 650 | 0 | 1.5 |
| Nav | 600, current 800 | 0 | |
| Tags, state names | 700 | 0 | |
| Figures, quantities | 800 | -0.02 to -0.03em | 1.15 |
| Wordmark | 800 | -0.035em | |
| Mono | 500 | 0 | |

Sentence case everywhere. No uppercase labels, no italics. `font-variant-numeric: tabular-nums` on
every number that sits in a column or changes (`.num`). Mono text is `max(0.9375em, 0.875rem)` so it
never drops under 14px. If you ship static weights, 400, 500, 600, 700 and 800 are enough: map 650
to 600 and 750 to 700.

## 5. Space

A 4px base.

| Token | `--s1` | `--s2` | `--s3` | `--s4` | `--s5` | `--s6` | `--s7` | `--s8` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| px | 4 | 8 | 12 | 16 | 24 | 32 | 48 | 64 |

| Token | Under 768 | 768 to 1023 | 1024 and up |
| --- | --- | --- | --- |
| `--gutter` (page margin, each side) | 16 | 24 | 32 |
| `--ctl` (control height) | 48 | 48 | 44 |
| `--side` (sidebar) | none | `--rail` 96 | 248 |
| `--tabbar` (phone tab bar) | 64 plus the safe area | none | none |
| `--max` (content width without gutters) | | | 1280 |

Common gaps: 6px between tags, 8px between buttons, 12px inside a row, 16px panel padding and grid
gap, 24px between blocks on desktop, 32px above a section.

## 6. Radii and shadows

- `--r: 3px` on everything: buttons, inputs, panels, tags, tiles, dialogs, the page head. A molded
  edge. No pills and no circles (people are square tiles; the loading spinner is the one round thing).
  Inner pieces that sit inside a 3px container use 2px.
- **No shadow on anything at rest.** Depth is tone steps and 1px lines.
- `--shadow-float: 0 18px 48px rgb(0 0 0 / .28), 0 2px 6px rgb(0 0 0 / .18)` on what floats: menus,
  dialogs and sheets, toasts. Nothing else.

## 7. Breakpoints

All `min-width`. Designed at 390 first, checked at 360, 390, 768, 1024 and 1440.

| Min width | What changes |
| --- | --- |
| 0 | Phone. Top bar, page head, content, fixed tab bar. Sets are rows. Sorter two across. Dialogs are bottom sheets. |
| 480 | Sorter three across. |
| 640 | Form rows go two and four across. |
| 768 | Rail replaces the top bar and tab bar. Sets are tiles. Copy facts go four across. Dialogs are centered. Toasts move to the bottom right. Wider gutter, taller page-head studs. |
| 900 | Sign-in and 404 go two columns. |
| 1024 | Labeled sidebar. Library filter column. Page head puts actions beside the title. Two-column grids (Collection, Settings, Wishlist). 44px controls. |
| 1240 | Sorter six across. |

Suggested Mantine breakpoints: `xs: 30em (480)`, `sm: 48em (768)`, `md: 56.25em (900)`,
`lg: 64em (1024)`, `xl: 77.5em (1240)`. Keep 640 as a local media query.

## 8. Motion

| Token | Value | Use |
| --- | --- | --- |
| `--t-fast` | 120ms | Hover and press on buttons, background tints, the switch |
| `--t-med` | 240ms | A set tile lifting, a sheet or dialog arriving |
| `--ease` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | Everything except bricks |
| `--snap` | `cubic-bezier(0.3, 1.4, 0.5, 1)` | Bricks: state buttons, sorter bricks, the switch knob. A slight overshoot, like a brick clicking home |

Travel: primary and state buttons lift 2px on hover and drop 2px on press, and their studs squash to
half height. Sorter bricks lift 2px. Set tiles lift 3px. The tab bar's Add brick lifts 2px.
Transform and opacity only. Nothing loops except the loading spinner, nothing is tied to scrolling,
nothing animates on load.

`prefers-reduced-motion: reduce`: all durations become 1ms and all travel is removed. Color changes
stay. The spinner stops turning and becomes a dotted ring.
