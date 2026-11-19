# Brick Bin app redesign: developer handoff

Designer 1. Concept: **Sorted by state.** A neutral room, and six brick colors that each mean one
build state. `DESIGN-NOTES.md` explains why. This document says how to build it.

## 0. The package, and how to open it

| Path | What it is |
| --- | --- |
| `mockups/index.html` | Start here. Links to all 76 mockup pages. Open by double-clicking. |
| `mockups/*.html` | Static pages, one per screen or state. No build step, no framework. |
| `mockups/states.html` | Every control in every state, side by side. Not an app screen. |
| `mockups/assets/css/app.css` | All styles. Tokens at the top. **The source of truth.** |
| `mockups/assets/js/theme.js` | Mockup helper for the theme toggle. Do not ship it. |
| `mockups/assets/fonts/` | Albert Sans and JetBrains Mono (variable WOFF2) with their OFL licenses |
| `mockups/assets/svg/` | Mark, lockup, favicon, the six state glyphs, the 1×1, stud mask, baseplate tile, the sign-in pile, the 404 wall |
| `mockups/assets/img/` | Generated stand-ins for covers and part pictures. Not design assets. |
| `screenshots/` | 158 PNGs, `<screen>-<width>-<theme>.png`. `MOCKUP-INDEX.md` lists them. |
| `TOKENS.md` | Every token with its value and contrast |
| `DESIGN-NOTES.md` | Critique, concept, reasoning |
| `PROPOSALS.md` | Ideas that need new features. Not in the mockups. |
| `MOCKUP-INDEX.md` | Each mockup and PNG, and the current screen it replaces |
| `tools/` | `build.mjs` stamps the shared shell into the pages. `shoot.mjs` takes the screenshots with one browser. Neither is needed to view anything. |

**Where the stylesheet and this document disagree, the stylesheet wins, and that is a bug in this
document.**

How to look at the mockups:

- Resize the window. Every page is responsive: phone under 768, rail from 768, sidebar from 1024.
- Add `?theme=dark`, `?theme=light` or `?theme=system` to any address, or use the toggle in the
  sidebar, on the More page or on the states sheet.
- A page named for a dialog, sheet, menu or toast is frozen in that state. Buttons do nothing.
  CSS-only interactions do work: the build-state menu on a copy and the Export menu open, checkboxes
  and switches toggle, the Library filter groups collapse.
- Class names are the mockup's. Rename freely.

**Sample data.** The household is the one in the current screenshots (Hartley House, 14 sets). A few
values are illustrative because no screenshot showed them: the three instruction items, the CSV import's
column names and counts, the trash rows, the second catalog history row, the "12 changed, 184 unchanged" preview, the people
descriptions, the purchase-mark note, and everything on the "extremes" and "many" pages.

## 1. Tokens

All values are in `TOKENS.md` and at the top of `app.css`: colors for both themes with contrast
ratios, the type scale, spacing, radii, the one shadow, breakpoints, motion, and the fonts with
licenses. Summary of what a developer needs to hold in mind:

- The room tokens have the marketing site's names and values. The app adds `--paper`, `--edge` and
  the `--danger` set.
- Six `--st-*` tokens are the only bright colors. They mean build states and nothing else.
- One radius (3px). One shadow, on floating things only. Text is never under 14px.
- Dark tokens are keyed off `:root[data-theme="dark"]`, and off `prefers-color-scheme` when there is
  no attribute. With Mantine, key them off `[data-mantine-color-scheme="dark"]` and use
  `defaultColorScheme="auto"`.

## 2. Mantine mapping, in general

Set these once in the theme, and most components follow:

- `fontFamily` Albert Sans, `fontFamilyMonospace` JetBrains Mono, `headings.fontWeight` 800.
- `defaultRadius: 3` (and `radius` scale all 3, except `xs: 2`).
- `primaryColor`: a custom ten-shade "ink" palette whose filled shade is `--btn`. Simpler: give
  `Button` a custom `variant="brick"` in CSS and leave Mantine's palette for nothing visible.
- `shadows`: all `none` except the one used by `Menu`, `Modal`, `Drawer`, `Notification`, set to
  `--shadow-float`.
- `focusRing: "auto"` with the ring overridden to `3px solid var(--focus)`, offset 2px.
- Component `defaultProps`: `Input` family `size="md"` with a 48px height under 1024 and 44px above;
  `Modal` `centered`, `overlayProps` `{ backgroundOpacity: .55, blur: 0 }`; `Table` no stripes, no
  borders; `Badge` is not used (state tags and tags are small custom components).

## 3. The brick-motif system

One object, seen four ways. Each way has one meaning. A fifth piece, the state glyph, belongs to
build states.

### 3.1 The stud row

A row of flat rectangular studs along the top edge of a block. `.studs` needs `--brick` (its color).
A `::before` sits on top of the block, filled with `--brick` and masked by `stud-mask.svg` (inlined as
`--stud-mask`), with `mask-repeat: round` so only whole studs show. `.studs` adds
`margin-top: var(--stud-h)` so studs never overlap what is above. Studs are flat: no highlights, no
lettering, no logo.

**It means "this is the one thing to press here" or "this is a place".**

| Where | Pitch / height / inset | Phone | Tablet and desktop |
| --- | --- | --- | --- |
| Primary button | 20 / 6 / 10 | Yes | Yes |
| State button on a copy | 16 / 5 / 8 | Yes | Yes |
| Sorter bricks | 18 / 5 / 9 | Yes, two across (three from 480) | Three across to 1239, six from 1240 |
| Page head | 40 / 11 / 20 | Yes | 48 / 13 / 24 from 768 |
| Phone tab bar | 26 / 7 / 13 | Yes, along its top edge | Not shown |
| Add brick in the tab bar | 14 / 4 / 7 | Yes | Not shown |
| Swatch brick in the state menu | 12 / 4 / 4 | Yes | Yes |
| State wall (Collection) | 18 / 6 / 3 | Yes | Yes |
| Filled part of a progress bar | 14 / 4 / 0 | Yes | Yes |

**Where it must not appear**

- Quiet, ghost and danger buttons. There is no red brick.
- A disabled button. It loses its studs, because it cannot be pressed.
- Read-only state tags, all other tags, tiles, panels, cards, table cells, form fields, tabs, the
  segmented control, dialogs and sheets, the sidebar, toasts.
- More than one primary (studded ink) button per block: one in a page head, one in a section head,
  one in a dialog, one in a form's action bar. Repeated row actions ("Add 1", "Found", "We got it")
  are quiet buttons.
- As a divider, a background, or loose decoration.

### 3.2 The 1×1

`.b1`: a tiny one-stud brick at text size, in `currentColor` (ink). **It means "you are here".**

- Appears: at the right end of the current sidebar item, from 1024.
- Never: in a state color, in tables, as a bullet, as decoration. On the rail and the tab bar the
  current item is marked by a tone step and weight 800 instead.

### 3.3 The baseplate

`.baseplate`: `--surface` with a 9px `--dot` circle on a 20px grid. **It means "something is waiting
to go here".**

- Appears: every empty state, a set or wish with no cover, behind the 404 wall.
- Never behind text. Words sit on a solid `--ground` card on top of it.
- A small inline version (one line of text on its card, 16px of baseplate around it) is used inside
  a section, such as "No instructions saved for this set yet."

### 3.4 The dashed outline

2px dashed, `currentColor`, 3px radius, no fill. **It means "something is missing, or needs you".**

- Appears: "Missing N pieces" tags, the "16 pieces" tag on Collection, a failed import in the history,
  "mind this" notes (not enough disk space, skipped import rows, the "We got it" consequence),
  failed-action toasts, the 404 missing-part box and the missing brick in the wall.
- Never for focus (focus is a solid ring), for optional things, or as decoration.

### 3.5 State glyphs

Six custom 20px glyphs, one color, in `assets/svg/state-*.svg`: a taped box (sealed), a box with its
lid up (opened), a half-built stack (in progress), a finished stack (built), loose bricks in a row
(disassembled), a tub with pieces askew (mixed). They always sit beside the state's word. If you
would rather not ship custom glyphs, the Tabler icons the app uses now (`lock`, `package`, `tool`,
`stack-2`, `layout-grid`, `arrows-shuffle`) can stand in. The color and word still carry the state.

### 3.6 Color rules

1. A bright brick color means a build state. Nothing else is bright: no colored nav, links, buttons
   or charts.
2. A state fill always carries `#121212` text and glyph, in both themes.
3. Bricks do not change color in dark mode. The room darkens.
4. All six appear together in four places: the sorter, the state menu, the Collection wall and its
   legend. The sign-in pile and the 404 wall are pictures of bricks, and use five of them.
5. The one exception is the logo mark, whose brick is `--st-built` green.
6. Missing pieces are ink and dashed. Red is for destructive actions and errors only.

### 3.7 Trade dress

No LEGO logo or wordmark, no letters or logos on studs, no minifigure shapes, no red-and-yellow
scheme, no red or yellow brick. The minifig rows in the piece picker use Tabler's `user` icon until
a real catalog picture arrives. "LEGO" appears only as a brand name in data, in "Look up a LEGO set",
"Find on LEGO.com" and the non-affiliation line.

## 4. The app shell

```
<a class="skip">           skip link, first focusable element
<div class="app">
  <header class="topbar">  phone only: logo, household name
  <aside class="side">     from 768: rail, then sidebar
  <main id="main">
    <header class="head">  the page-head brick: breadcrumb, h1, one line, actions
    …content
  <nav class="tabbar">     phone only, fixed to the bottom
```

### 4.1 Desktop sidebar (1024 and up)

248px wide, `--surface`, no border, sticky, full viewport height, scrolls inside itself if it must.
24px top padding, 16px sides. Top to bottom:

1. Logo: mark 30px (brick `--st-built`, bin `currentColor`), 10px gap, "Brick Bin" 22px/800.
   Links to the Library.
2. Household name, 14px/600 muted, aligned under the wordmark.
3. "Add set": primary button, full width. Admins and members only.
4. Main nav: Library (`layout-grid`), Shopping list (`list-check`), Wishlist (`heart`), Collection
   (`chart-bar`), Import (`upload`).
5. Group label "Household" (14px/700 muted), then Settings (`settings`).
6. Pushed to the bottom: the person (a 36px square tile with their initial, name, role; it links to
   the More page), the theme toggle (icons), Sign out (`logout`), and "Catalog data from Rebrickable".

Nav item: 44px tall, 12px side padding, 12px gap, 16px/600, icon 20px.

| State | Appearance |
| --- | --- |
| Rest | Ink, no background |
| Hover | `--surface-2` background |
| Current (`aria-current="page"`) | `--surface-2` background, weight 800, a 1×1 at the right end |
| Focus | 3px ring |

A kid's sidebar has the logo, household, Library, Wishlist, and the same footer. No Add set, no
Shopping list, Collection, Import, or Household group. Those links are absent from the markup, and the
routes refuse a kid on the server.

Mantine: `AppShell` with `navbar`, `NavLink` for items.

### 4.2 Tablet rail (768 to 1023)

The same `aside`, 96px wide. The logo shows the mark only. Add set is a 48px brick with a plus (its
accessible name stays "Add set"). Nav items are an icon over a 14px label, 60px tall, centered:
Library, Shopping, Wishlist, Collection, Import, Settings. The footer shows the person's tile (links
to More, which has the theme choice) and the Sign out icon. The group label, theme toggle and credit
are hidden; the credit still appears on every page that shows catalog data. Current item:
`--surface-2` and weight 800.

### 4.3 Phone (under 768)

- **Top bar:** 56px, on `--ground`, not sticky: logo on the left, household name on the right
  (14px/600 muted, truncates). It scrolls away with the page. It holds no controls.
- **Tab bar:** fixed to the bottom, on `--field` in both themes, with a stud row along its top edge.
  64px plus `env(safe-area-inset-bottom)`. Five equal cells: Library, Shopping, Add, Wishlist, More.
  Each is an icon (24px) over a 14px label, 56px tall.

  | State | Appearance |
  | --- | --- |
  | Rest | `--field-muted` |
  | Hover | `--field-2` background, `--field-ink` |
  | Current | `--field-2` background, `--field-ink`, weight 800 |
  | Add | A 56 by 30px brick in `--field-ink` with its own studs and an ink plus, label "Add" in `--field-ink`. Lifts 2px on hover. |
  | Focus | 3px `--focus-field` ring, inset |

  The page's bottom padding is the bar's height plus 40px, so nothing hides under it.
- **More** holds: who is signed in, Collection, Import, Settings, the theme toggle with words, Sign
  out, the Rebrickable credit and the non-affiliation line.
- **A kid's tab bar** has three cells: Library, Wishlist, More. A kid's More page has their name, the
  theme toggle and Sign out.

Mantine: `AppShell` `footer` for the tab bar, hidden from `sm`.

### 4.4 Page head

Every page inside the shell opens with one. A `.studs` block on `--field`, text `--field-ink`.

- Contents: breadcrumb (optional), `h1`, one line (`--field-muted`, 16px; links and bold in
  `--field-ink`), then actions.
- Under 768: padding 16 / 16 / 20, studs 40 / 11, actions on their own row below the text.
- From 768: padding 24 / 32 / 28, studs 48 / 13. Still stacked.
- From 1024: two columns, text left, actions right and bottom-aligned.
- The `h1` wraps anywhere, so a very long set name cannot widen the page.
- Buttons on a head: primary is `--field-ink` with ink text (hover `#FFFFFF`), quiet is `--field-2`
  (hover `--field-line`). Focus rings are `--focus-field`.
- 4px plus the stud height above it, 16px below (24px from 768).
- **One line only.** It says something about the data ("14 sets · 3 sets have missing pieces"), never
  how to use the page, with two exceptions where a first-time explanation earns its place: Add a set
  and store-trip mode.

### 4.5 Width and scroll rules

- `main` is the full width beside the sidebar, up to 1280px plus gutters. Gutters 16 / 24 / 32.
- Form pages and other single-column reading (`.narrow`) cap at 760px, left-aligned.
- The page scrolls as one document. Sticky things: the sidebar, the wishlist form column (from 1024),
  the form action bar on phones, the store-trip bar.
- No horizontal page scroll at 360 or above. The screenshot script checks every capture. The only
  things allowed to scroll sideways inside themselves are the catalog history table, the import
  "First rows" table and the picker tabs, on phones.

### 4.6 Dialogs, sheets and menus

| | Under 768 | 768 and up |
| --- | --- | --- |
| Form dialog (edit copy, add copy, add a wish, instruction dialogs) | Bottom sheet, full width, up to 92% of the height, top corners 3px | Centered modal, 600px max |
| Confirm, small dialogs ("I bought this", "We got it") | Bottom sheet | Centered modal, 440px max |
| Filters (Library, Shopping list) | Bottom sheet | Bottom sheet's content is inline from 1024; a centered modal between 768 and 1023 |
| Build-state menu | Bottom sheet titled "Build state, copy N" | Popover under the state button, right-aligned |
| Export menu | Popover under the button | Popover |

Structure: a head (20px/800 title, a 48px close button with `x`), a scrolling body with 16px padding,
a foot with a 1px rule above. Under 768 the foot's buttons are full width and stacked with **the main
action on top**. From 768 they sit right-aligned with the main action last. A sheet's foot adds the
bottom safe area. Scrim: `--scrim`. Focus is trapped, Escape closes, focus returns to the opener.
A sheet slides up over 240ms; a modal fades. With reduced motion both simply appear.

Mantine: `Modal` from `sm`, `Drawer position="bottom"` below it (one wrapper component that picks by
`useMediaQuery`). `Menu` for popovers.

## 5. Component inventory

Mockup class in parentheses. States are on `states.html`.

### 5.1 Buttons (`.btn`)

Height `--ctl` (48 under 1024, 44 above), 16px side padding, 16px/650, 3px radius, 8px to an icon
(20px).

| Variant | Fill / text | Studs | Use |
| --- | --- | --- | --- |
| Primary (`.btn--primary.studs`) | `--btn` / `--btn-ink` | Yes | The one main action in a block |
| Quiet (default) | `--surface-2` / `--ink` | No | Everything else |
| Ghost (`.btn--ghost`) | none / `--ink` | No | Low-weight row actions (Edit) |
| Danger text (`.btn--danger-text`) | none / `--danger` | No | Remove copy, Remove, Delete, Delete set |
| Danger (`.btn--danger`) | `--danger` / `--danger-ink` | No | Only "Move to trash" inside a confirm dialog |
| Small (`.btn--sm`) | as its variant | as its variant | Row actions. 44px tall under 1024, 36px above, 15px text |
| Icon (`.btn--icon`) | as its variant | No | Close. Square, `--ctl` |

| State | Primary | Quiet | Ghost | Danger text | Danger |
| --- | --- | --- | --- | --- | --- |
| Hover | Fill `--btn-hover`, lifts 2px | `--line` | `--surface` | `--danger-bg`, text `--danger-text` | `--danger-hover` |
| Active | Drops 2px, studs squash to half | same as hover | same | same | same |
| Focus | 3px ring, 2px offset | same | same | same | same |
| Loading | A 16px spinner replaces the icon, label changes ("Saving…"), `aria-busy`, clicks ignored, studs stay | | | | |
| Disabled | `--surface` fill, `--muted` text, **no studs**, no travel | `--surface`, `--muted` | | | |

A disabled button always has a reason in words beside it or above it ("Paste the page source first.",
"Available again Oct 31").

Mantine: `Button` with custom variants. The stud row is a `::before` on the root, so it works on
`Button` and on `component="a"`.

### 5.2 Text inputs, selects, text areas (`.input`, `.select`, `.textarea`)

`--paper` fill, 1px `--edge` border, 3px radius, height `--ctl`, 12px side padding, **16px text on
every width**. Label above (14px/650, 6px gap), optional hint between label and control (14px muted),
required marked with a `--danger` asterisk that is `aria-hidden` (the input carries `required`).

| State | Appearance |
| --- | --- |
| Hover | Border `--ink` |
| Focus | Border `--ink` and the 3px ring with no offset |
| Error | 2px `--danger` border, and a message under the field: `alert-circle` (16px) and 14px/600 `--danger` text. `aria-invalid` and `aria-describedby`. |
| Disabled | `--surface` fill, `--line` border, `--muted` text |

- Select: native on phones, with a `selector` chevron pair at the right. Mantine `Select` or
  `NativeSelect`.
- Money: a `$` prefix inside the field, tabular figures, `inputmode="decimal"`. `NumberInput` with
  `leftSection`.
- Search: a `search` icon inside the field at the left.
- Password: a 44px `eye` / `eye-off` button inside the field at the right. `PasswordInput`.
- Dates: native `type="date"`.
- File: native file input inside the same frame.
- Tags: chips (`.tag--quiet` with an `x`) inside the frame, then a borderless input. `TagsInput`.
- Text area: 88px minimum, resizes vertically.
- Stepper (`.stepper`): minus, a 52px number, plus, each 44px wide, one frame. `NumberInput` with
  custom controls.

### 5.3 Checkbox and switch (`.check`, `.switch`)

- Checkbox: 22px square, 1.5px `--edge` border, 3px radius, `--paper`. Checked: `--ink` fill with a
  `--ground` check. The whole label row is the target, 44px tall. A count may sit at the right end in
  muted tabular figures (zero is `--muted`).
- Switch: 44 by 24px track, `--paper` with an `--edge` border, and a 17px **square** knob in
  `--edge`. On: `--ink` track, `--ground` knob, moved 20px with the snap easing. `role="switch"`.
- Hover: border `--ink`. Focus: ring. Disabled: `--surface` fill, `--line` border.

Mantine: `Checkbox`, `Switch` (square the thumb with `radius={2}`).

### 5.4 Segmented control and theme toggle (`.seg`)

A `--surface-2` track with 3px padding. Options 38px tall, 12px side padding, `--muted`, 600.
Selected: `--paper` fill, `--ink`, weight 750, and a 1px `--edge` bottom edge. Hover: `--ink`.
It is as wide as its options, and full width only on the More page.

Theme toggle: three buttons, **System, Light, Dark** (Tabler `device-desktop`, `sun`, `moon`), System
by default. Icons only in the sidebar (the word is the accessible name and the tooltip), icons with
words on the More page. `aria-pressed` on each. Mantine: `SegmentedControl` driven by
`useMantineColorScheme()` with `"auto" | "light" | "dark"`.

### 5.5 Tabs (`.tabs`)

Used in one place, the piece picker (Set parts, Minifigs, Whole catalog, Other). A row on a 1px
`--line` rule, scrolling sideways inside itself on a narrow phone. Tab: 48px tall, 12px padding,
`--muted`, 600. Hover: `--ink` on `--surface`. Current: `--ink`, 800, a 4px ink bar on the rule.
Mantine: `Tabs`.

### 5.6 Menus (`.menu`)

`--paper`, 1px `--line`, 3px radius, `--shadow-float`, 6px padding, 260 to 340px wide. Item: 48px
minimum, 10px side padding, a leading icon or swatch brick, a bold line and an optional 14px muted
line. Hover and the checked item: `--surface`. A checked item ends with a `check` icon.
`role="menuitemradio"` with `aria-checked` in the state menu.

### 5.7 Build state

| Piece | Class | Looks like | Where |
| --- | --- | --- | --- |
| State tag | `.st` | 28px tall, flat, state fill, glyph, word, optional `×N`. No studs. | Library rows and tiles, a kid's copy card, the picker's page head, the Collection legend |
| State button | `.st-btn.studs` | 44px tall, state fill, studs, glyph, word, `chevron-down`. Lifts and squashes like a primary button, with the snap easing. | Each copy card, for people who may edit |
| State menu | `.menu` or a sheet | Six rows: a swatch brick with the glyph, the name, its description, a check on the current one | Opens from the state button |
| Sorter | `.sorter` | Six 44px bricks with studs: glyph, name, count at the right | Top of the Library |
| State wall | `.wall` | One course of six bricks, each as wide as its share, its count inside | Collection |

Names and descriptions (unchanged from the app): Sealed "Factory sealed, never opened". Opened
"Opened, not built". In progress "Being built right now". Built "Finished and on display".
Disassembled "Taken apart, kept together". Mixed "Parted into bulk bins".

Sorter states:

| State | Appearance |
| --- | --- |
| Rest | State fill, ink text |
| Hover | Lifts 2px |
| Picked (`aria-pressed="true"`) | A 3px ink inset ring, and a `check` replaces the glyph |
| Others, while any is picked | `--surface-2` fill, ink text, studs stay |
| Count is zero | `--surface` fill, `--muted` text. Still pressable. |
| Focus | 3px ring |

Changing a state: the menu closes, the button takes the new color at once, and a toast says "Copy 1
is now Built." If the save fails the button goes back and an error toast appears.

The state button's accessible name is "Build state of copy 1: Built. Change it".

### 5.8 Tags (`.tag`)

28px tall, 8px side padding, 14px/700, 3px radius.

| Variant | Appearance | Use |
| --- | --- | --- |
| Solid | `--ink` fill, `--ground` text | "Hidden from kids" (`eye-off`), "You bought this" (`lock`), the active-filter count |
| Dashed (`.tag--dash`) | 2px dashed ink, no fill | "Missing N pieces", "16 pieces", "Failed". As a link it goes to the piece picker; hover adds `--surface`. |
| Outline (`.tag--line`) | 1px `--edge`, `--muted` text, 600 | "Not checked", "No copies", "Running" |
| Quiet (`.tag--quiet`) | `--surface-2` fill, ink text | "Complete" (`check`), "Sealed" under Pieces, roles, set tags, "Succeeded" (`check`) |

Completeness has three values and three shapes: dashed (missing), outline (not checked), quiet with a
check (complete). Never a color.

### 5.9 Set row and tile (`.set`)

One `li`, two layouts.

- **Row (under 768):** inside one `--paper` panel with 1px rules between rows. An 88px cover, then
  the name (17px/750, two lines at most, breaks anywhere), one meta line (brand · set number in mono
  · year; 14px muted; one line, truncated), then tags. 12px padding. Hover: `--surface`.
- **Tile (768 and up):** a `--paper` card with a 1px `--line` border. The cover on top (4:3 frame,
  8px inside the card's padding), then the same text. Grid:
  `repeat(auto-fill, minmax(196px, 1fr))`, 16px gap, which gives 3 across at 768, 2 beside the filters
  at 1024 and 4 at 1440. Hover: border `--edge`, lifts 3px. Tiles in a row share a height.
- The name is the only link, and its target is stretched over the whole row or tile. Focus draws the
  ring around the whole thing.
- **Tags, in this order:** one state tag per state present, in the fixed order sealed, opened, in
  progress, built, disassembled, mixed, with `×N` when more than one copy is in that state. Then
  "Missing N pieces" (the sum across copies). Then "Not checked" if any copy is unchecked. Then
  "Hidden from kids". A set with no copies shows only "No copies".
- A kid's response never contains the "Hidden from kids" tag, because it never contains a hidden set.

### 5.10 Cover (`.cover`)

A 4:3 frame on `--surface`, 3px radius. The image is `object-fit: contain` with 8px of padding, so a
portrait, landscape or square cover is always whole and never cropped. No cover: the baseplate with
"No cover" on a small `--ground` card (in the 72px wishlist thumbnail the words are visually hidden).
On the set page the frame is the same, up to 300px wide from 768. Alt text: empty in lists (the name
is right beside it), "Box art for <name>" on the set page.

### 5.11 Part tile, swatch, quantity (`.part`, `.swatch`, `.qty`)

- Part tile: 64px square (72px in store-trip mode), **white in both themes** because part renders
  arrive on white, 1px `--line` border. The picture fits inside 78%.
- Color swatch: a 14px square with a 1px `--edge` border, before the color's name. The name is always
  there, so the swatch is decoration.
- Quantity: `×4`, 24px/800 with a smaller `×`, tabular, right-aligned.
- A line (`.line`): part tile, then name (750) over a meta line (swatch and color in ink, `#3001` in
  mono, "Element 300126"), then the "needed by" line, then the quantity.

### 5.12 Panels, rows, key-value lists

- Panel (`.panel`): `--paper`, 1px `--line`, 3px radius. Padding 16px when it holds free content.
- Row (`.row`): 56px minimum, 12px by 16px padding, 1px rule between rows. Title 700. Trailing
  actions at the right.
- Key-value (`.kv`): label column (14px muted, about a third) and value column, with 1px rules
  between pairs. On a copy card it becomes four label-over-value columns from 768.
- Facts strip (`.facts`): equal cells divided by 1px lines, a 14px muted label over a 20px/800 value.
  A missing value is a muted dash.

Mantine: `Paper`, `Stack`, plain `dl`.

### 5.13 Tables (`.table`)

Head: 14px/700, a 2px ink rule under it, no fill. Body: 12px vertical padding, 1px `--line` rules, no
zebra, no outer border. First column is a row header (`th scope="row"`, 700). Numbers right-aligned
with tabular figures and never wrap. A real zero is printed in `--muted` ("$0.00"); a missing value
is a muted dash or words ("No estimate", "Never"). Money has two decimals and thousands separators.
The four-column Collection tables fit a 360px phone as they are. Mantine: `Table`.

### 5.14 Notes and banners (`.note`)

| Variant | Appearance | Use |
| --- | --- | --- |
| Note | `--surface` fill, 16px padding, a bold first line | Background and reasons: "Available again…", "Linked to Rebrickable set…", "The page checks out" |
| Mind this (`.note--mind`) | No fill, 2px dashed ink | Something that will catch you out: not enough disk, rows an import skipped, what "We got it" does |
| Error (`.note--error`) | `--danger-bg` fill, `--danger-text`, `alert-circle` | Sign-in failure, a form's error summary. `role="alert"` |

### 5.15 Toasts (`.toast`)

On `--field`, `--field-ink` text, 1px `--field-line` border, 3px radius, `--shadow-float`, 48px
minimum, up to 440px wide. A `check` icon, the sentence, an optional action, a dismiss `x`.

- Under 768: bottom center, 20px above the tab bar. From 768: bottom right, 24px in.
- A failed action is the same toast with a **2px dashed border** in `--field-ink`, an
  `alert-triangle`, and a "Try again" action. `role="alert"`. It stays until dismissed.
- A success toast leaves after about 4 seconds. `role="status"`.
- Wording: what happened, as a sentence with a period. "Added to your wishlist." "Copy 1 is now
  Built." "Restored Shelf 2." "Couldn’t save the set. Nothing was changed."

Mantine: `notifications` with a custom class.

### 5.16 Empty states (`.empty`)

A baseplate block, at least 260px tall, with a `--ground` card in the middle (up to 420px, 24px
padding): a title (22px/800), one or two sentences, and one or two actions. The section keeps its
heading and frame around it. Inline version: one sentence on a small card with 16px of baseplate
around it. Wording is in section 7.

### 5.17 Breadcrumb (`.crumbs`)

An `ol` in `nav aria-label="Breadcrumb"`, at the top of the page head. 14px/500, `--field-muted`.
Separators are drawn (a 1.5px slanted line with 10px each side), not typed. Links are `--field-ink`
and underlined. Steps with no page of their own (the brand, the theme) are plain. The current page is
750, `--field-ink`, `aria-current="page"`. It wraps if it must.

### 5.18 Pagination (`.pager`)

Under a long list: the range on the left ("1 to 48 of 312 sets", muted, tabular), page links on the
right. Each is 44px square, 650. Current: `--ink` fill, `--ground` text. Hover: `--surface-2`.
Previous and next are `chevron-left` and `chevron-right`, dimmed when there is nowhere to go. It
wraps to two lines on a phone. Mantine: `Pagination`.

### 5.19 Progress (`.progress`)

A 14px `--surface-2` track with a 2px radius. The filled part is `--ink` with a stud row on top
(14 / 4). At zero there is no fill at all. Always labeled in words with real numbers ("41 of 196
files", "2 of 4 checked off"). `role="progressbar"` with the values. Mantine: `Progress` with a
custom section class.

### 5.20 Steps (`.steps`)

A real `ol`. Each number sits in a 32 by 26px `--surface-2` block, 800, with the text beside it.
Used for the three catalog-import steps.

### 5.21 Disclosure (`details.more`)

"Rename or move a place", "Rename a brand", "Merge two themes", "Rename a theme". A 44px summary with
a `chevron-right` that turns 90 degrees when open; the form appears in a panel below. Library filter
groups use the same idea with `chevron-down`. Mantine: `Collapse` or native `details`.

### 5.22 Person tile (`.who`)

A 36px square (28px in the activity list), `--surface-2`, the person's initial at 800. Squares,
because everything here is a brick. "Ours" (no owner) shows "O".

### 5.23 Lookup results (`.lookup__results`)

A list under the lookup field, `--paper`, 1px border. Each result is a 56px button: the name in
bold, then number (mono) · year · pieces · theme, and "On Ada Admin’s wishlist" when it applies.
Hover and keyboard-active: `--surface`. Picked: `--surface-2`. `role="listbox"` and `option`.
Mantine: `Combobox`.

### 5.24 Skip link and focus

`.skip` is the first element, off-screen until focused, then pinned 8px from the top left as an ink
button. Everything focusable shows a 3px solid ring at 2px offset with `:focus-visible`:
`--focus` normally, `--focus-field` on a field.

## 6. Screen by screen

Each entry gives the page head, the content in order, what changes by width, and what a kid profile
gets. "Kid: no access" means the route refuses a kid on the server and no link to it is rendered.

### 6.1 Sign in and first-run setup (`login`, `login-error`, `setup`)

No shell. Two parts:

- **Art panel** on `--field`: the logo, and from 900 the headline "Know what’s in every box." with one
  sentence, then the built pile sitting on its floor line at the bottom. Under 900 it is a short band:
  logo and pile only.
- **Form:** `h1` "Welcome back", "Sign in to your household’s bin.", Email, Password (with show/hide),
  "Sign in" (primary, full width), "Forgot your password? Ask an admin to set a new one.", then the
  credit and non-affiliation line. 480px maximum. From 900 the two parts sit side by side and the
  form is centered vertically.
- **Error:** an error banner above the fields, "Incorrect email or password." The email stays filled
  in and the password is cleared.
- **Setup** (first run): `h1` "Set up your bin", the sentence "You’re the first one here, so this
  account becomes the admin. Nothing is stored anywhere but on this server.", then Household name,
  Your name, Email, Password ("At least 8 characters"), and "Create the household".

### 6.2 Library (`library`, `library-search`, `library-filtered`, `library-filters-sheet`, `kid-library`)

- **Head:** "Library". Line: "14 sets · 3 sets have missing pieces" (the second part links to the
  shopping list). Actions from 768: "Shopping list for these…" (quiet) and "Add set" (primary).
  Under 768 the head has no actions: Add is in the tab bar, and "Shopping list for these…" is a
  full-width quiet button after the list.
- **Sorter:** the six states with their counts. It is the build-state filter. Picking one or more
  filters the list and updates the line in the head ("4 of 14 sets · LEGO, Sealed").
- **Toolbar:** search (full width under 1024), then "Filters" (under 1024 only; shows a count of
  active filters) and Sort.
- **Body:** from 1024 a 220px filter column (the "Include sets with no copies" switch with its line
  "Showing sets we own.", then Brand, Theme, Completeness as collapsible checkbox groups with counts)
  beside the sets. Under 1024 the same controls are in the Filters sheet, whose main button reads
  "Show 14 sets".
- **Sets:** rows under 768, tiles above (5.9). Then pagination when there is more than one page, then
  the Rebrickable credit.
- **Search with results:** line "1 set matches “crane”". Sorter counts follow the results.
- **Kid:** "13 sets". No actions, no Add, no "Shopping list for these…". The hidden set is absent and
  every count is computed without it. The "have missing pieces" link is not shown, since it leads to
  the shopping list.

### 6.3 Set detail (`set`, `set-missing`, `set-five-copies`, `set-no-copies`, `kid-set`)

- **Head:** breadcrumb Library / brand / theme / name. `h1` the set name. Line: brand and set number
  (mono). Action: "Edit set" (quiet).
- **About:** the cover (full width under 768; a 300px column from 768) and beside or below it the
  facts strip (Year, Pieces, Minifigs, Age) and a key-value panel: Retail price, Tags, and for a
  linked set "Catalog: Linked to Rebrickable 10294-1. Catalog data from Rebrickable." with
  "Re-sync from catalog".
- **Copies:** section title "Copies" with the count, and "Add copy" (primary) at the right. One card
  per copy:
  - Head: the owner's tile, "Mo Member’s copy" with "copy 1 of 2" in muted, the place with a
    `map-pin`, and the state button. Under 768 the state button sits on its own line under the
    name, at the left, on every card. From 768 it is at the right of the head.
  - Facts: Pieces (a "Missing 1 piece" link, "Not checked", "Complete", or "Sealed"), Box and
    booklets (check or dash for each of "Has the box" and "Has paper booklets"), Condition notes
    ("None" in muted when empty), Paid / value ("$109.99 / $129.00", "valued Oct 2026" beneath; a
    muted dash for a missing number). Stacked label-and-value rows under 768, four columns above.
  - Actions: "Edit copy", "Missing pieces" (both small quiet), "Remove copy" (danger text, pushed to
    the right).
- **Instructions:** title with a count, "Find on LEGO.com" at the right. A list of items (a
  `file-text` or `link` icon, the title as a link, a 14px line such as "PDF · Saved from lego.com" or
  "Link · rebrickable.com", "Remove") or the inline empty state. Then "Upload PDF", "Add link",
  "Save PDF from a link".
- **Delete set:** danger text, at the bottom right.
- **Kid:** no Edit set, no Retail price, no Re-sync, no Add copy. Each copy shows a state **tag**,
  not a button. "Paid / value" is replaced by "Acquired", as now. The "Missing 1 piece" tag is plain
  text, not a link. No copy actions, no instruction buttons, no Delete set. No price appears anywhere
  in the response.

### 6.4 Copy dialogs and confirms (`set-edit-copy`, `set-add-copy`, `set-remove-copy`, `set-delete`, `settings-places-delete`)

- **Edit copy N / Add a copy:** Build state and Owner, Place and Acquired on, Price paid and Estimated
  value, Pieces last checked ("Leave empty if never"), Has the box, Has paper booklets, Condition
  notes, Notes. Two columns from 640, one below. Buttons: "Cancel", and "Save copy" or "Add copy".
- **Confirm:** the title is a question naming the thing ("Remove copy 1?", "Delete Dune Rover 4x4?",
  "Delete Shelf 2?"). One or two sentences say what moves to the trash and what happens to things
  that depended on it. Buttons: "Cancel" and "Move to trash" (danger). Every delete in the app goes
  through this.

### 6.5 Instruction dialogs (`set-instructions-*`)

Small dialogs, one job each. "Upload a PDF": a file field; pressing Upload with no file shows
"Choose a PDF first." under it. "Save a PDF from a link": one sentence saying the file is downloaded
once, now, and never checked again; an address field; the button shows "Saving…" while it works.
"Add a link": address (required) and title. Keep whatever fields the app's dialogs have today; the
mockups show the minimum.

### 6.6 Missing pieces (`missing-picker`, `missing-picker-figs`, `missing-picker-search`, `missing-picker-other`)

- **Head:** breadcrumb Library / set / Missing pieces. `h1` "Missing pieces". Line "Titanic · copy 1
  of 2", then the copy's state tag and "Missing 12 pieces".
- **Still missing** (with the total): one line per part with its quantity and four small actions:
  "Found", "Bought", "Substituted" (quiet) and "Remove" (danger text). Under 768 the actions wrap to
  a row under the part; from 768 they sit at the right of the line. Then "Everything else is here"
  (quiet, `check`) with "Pieces have not been checked yet." beside it.
- **Add missing pieces**, with the credit under the title. Tabs: Set parts, Minifigs, Whole catalog,
  Other.
  - Set parts: search, Color, Category, "Show spare parts (1)", "3 parts · inventory version 1", then
    one line per part with "In the set: ×4", a stepper and "Add 1" (quiet; the number follows the
    stepper).
  - Minifigs: name, id (mono), "In the set: ×1", "Add 1".
  - Whole catalog: the same search and selects, results in the same line layout, marked "Not in this
    set’s inventory".
  - Other: a free-text name and a quantity. Keep the app's existing fields.
- **Kid: no access.**

### 6.7 Shopping list (`shopping-list`, `shopping-list-export`, `shopping-list-filters-sheet`, `shopping-list-empty`, `shopping-list-many`)

- **Head:** "Shopping list". Line "16 pieces on 4 lines". Actions: "Store-trip mode" (primary,
  `shopping-cart`), "Print" (quiet, from 768), "Export" (quiet; a menu with BrickLink wanted list,
  Rebrickable CSV, Plain CSV).
- **Controls:** "Sort by" with a segmented control (Color, Category, Set). From 1024 the five filters
  (Brand, Theme, Owner, Place, Color) sit in one row with "Apply". Under 1024 a "Filters" button opens
  them in a sheet. Then the BrickLink note when it applies.
- **List:** one panel of lines (5.11), each with its "needed by" line, which wraps. Paging at the end
  when the list is long ("1 to 100 of 1,184 lines"). Then the credit.
- **Kid: no access.**

### 6.8 Store-trip mode (`shopping-trip`, `shopping-trip-progress`)

- **Head:** same title. Line "Store-trip mode. Tap a part when it is in the cart." Action: "Leave
  store-trip mode" (quiet).
- **List:** each line is one big label: a 30px checkbox, a 72px part, the name and color, the
  quantity. 96px tall. The whole line is the target. Checked: name and quantity struck through and
  muted, the picture dimmed. The line stays where it is.
- **Bar:** fixed above the tab bar on phones, sticky at the bottom of the list from 768: "2 of 4
  checked off" over a progress bar, and "Done" (primary; disabled until something is checked).
- No sort, filters, export or "needed by" lines here.

### 6.9 Collection (`collection`)

- **Head:** "Collection". Line "14 sets · 22 copies · 44,130 pieces".
- **Totals:** one panel in three cells (stacked under 768): Paid, Estimated value, Difference. A 14px
  label, a 28px/800 figure, a 14px line saying what it covers. No icons, no color. The difference
  carries its sign.
- **By build state:** the state wall, then a legend of state tags with counts.
- **Missing pieces:** a dashed "16 pieces" tag, "missing from 3 copies.", and "Open the shopping
  list".
- **Sealed sets:** set links with `×5` where there are several copies.
- **By brand** and **By theme:** tables (Name, Copies, Paid, Value).
- **Value not set in over a year** (with its count): a table of Set, Estimate, Last valued.
- From 1024: build state beside Missing pieces and Sealed sets; brand beside theme. Panels in a pair
  stretch to the same height.
- **Kid: no access.**

### 6.10 Wishlist (`wishlist`, `wishlist-add-sheet`, `wishlist-bought`, `wishlist-bought-marked`, `wishlist-we-got-it`, `wishlist-empty`, `kid-wishlist`)

- **Head:** "Wishlist". Line "Everyone’s lists. Purchase marks stay private." Under 1024 one action:
  "Add a wish" (primary), which opens the form as a sheet.
- **Lists first:** "My wishlist", then one section per other person ("Kit Kid’s wishlist"). Each wish:
  a 72px cover or baseplate, the name (17px/750), the price seen, the note, then actions: "I bought
  this" and "We got it" (small quiet), "Edit" (ghost), "Remove" (danger text). Your own wishes have
  no "I bought this".
- **Form:** from 1024 a sticky 380px column on the right, titled "Add to my wishlist": the catalog
  lookup, Name, Set number and Price seen, Link, Notes for gift-givers, and "Add to my wishlist".
- **A wish you have marked:** a solid "You bought this" tag with a `lock`, then the date, your note
  and "Only you see this." "I bought this" is replaced by "Undo" (the app's existing label; its
  accessible name stays "Undo").
- **Privacy, as a build rule:** the mark, its date, its note and the Undo button are sent only to
  the person who made it. No other person's page contains any trace of it: no tag, no count, no disabled button, no
  different order. Admins get no extra view. It is not in the activity trail.
- **"I bought <name>" dialog:** a note with a `lock` ("Only you will see this…"), Date, Note to
  yourself, "Mark as bought".
- **"We got <name>" dialog:** a dashed note saying what happens, Brand (required), "Add a sealed
  copy", "Hide it from kid profiles for now", "Add to the collection".
- **Kid:** only "My wishlist". No prices, no Price seen field, no "I bought this", no "We got it".
  Line: "Your list. The rest of the household can see it." They can add, edit and remove their own
  wishes.

### 6.11 Add a set, Edit set (`add-set`, `add-set-lookup`, `add-set-picked`, `add-set-errors`, `edit-set`, `edit-set-saving`, `edit-set-failed`)

One column, 760px at most.

- **Head:** breadcrumb, "Add a set", and the line "Look it up, or type it in. One form covers the
  design and the box."
- **Look up a LEGO set:** its own panel with the credit. Results appear under the field as you type.
- **Scan a barcode** (`add-set-scan`): an icon button (Tabler `barcode`, 24px, ink) inside the right
  end of the lookup field, 44px wide, accessible name "Scan a barcode". **Render it only when the
  browser supports barcode detection**, as the app does today; where it does not, the button is
  absent and the field keeps its full width. In practice that means phones. (The mockup shows it
  under 1024 as a stand-in for that check.) Pressing it opens a small sheet titled "Scan a barcode":
  the camera view (4:3, with a light 3px frame marking where to hold the code), one sentence, and
  "Cancel". When a code reads, the sheet closes, the number is in the lookup field and the matches
  show. If the camera cannot be used, close the sheet and show a dashed toast: "Couldn’t use the
  camera. Type the number instead."
  Picking one fills the form and adds a note at the top of "The set": "Linked to Rebrickable set
  10294-1. The theme is added for you, and the cover is downloaded once when you save." with "Unlink".
- **The set:** Brand (with "New brand") and Set number; Name; Theme; Year, Pieces, Minifigs, Min age
  (four across from 640, two by two below); Description; Retail price and Designer; Tags; Cover
  image; Notes; "Hide from kid profiles" with its explanation.
- **A copy I own:** the "Add a copy I own" checkbox, "How many?" as a stepper, then the copy fields
  from 6.4.
- **Actions:** "Add set" (primary) and "Cancel". Under 768 they are a bar pinned just above the tab
  bar, with the primary taking the width. From 768 they sit at the end of the form.
- **Errors:** an error banner at the top says how many things need fixing; each field shows its own
  message; focus moves to the first one.
- **Edit set:** the same "The set" panel filled in, "Save changes" and "Cancel". While saving the
  button shows a spinner and "Saving…". If it fails, a dashed toast: "Couldn’t save the set. Nothing
  was changed." with "Try again".
- **Kid: no access.**

### 6.12 Import (`import`)

Head "Import", line "Sets from a CSV file". One column, 760px at most. Three states. **Kid: no
access.**

- **Before a file** (`import`): the explanation, a panel with the "CSV file" field and its hint ("Up
  to 2,000 rows and 2 MB. Nothing is saved until you press Import."), and a note, "Two things to know
  first", about the catalog and covers.
- **After a file is chosen** (`import-preview`), top to bottom:
  1. One panel with the file and its settings: "CSV file" with the same hint; "File format" (a
     select) with a hint under it, either "Detected from the column names." or "The file looks like
     <format>."; the column-mapping selects, one per column in the file, labeled with the file's own
     column name, two across from 640; "Build state for the copies" with the hint "Applied to every
     copy this file creates. You can change them one by one afterwards."
  2. If the file is too long, a dashed note directly under that panel: "Only the first 2,000 rows are
     read. Import the rest in a second file."
  3. "Preview": a panel with one line per fact, 1px rules between: "N new sets", "N rows add copies
     to sets you already have", "N copies in all", "N wishlist entries" (only if any), "New brands:
     …", and "N rows cannot be imported" as a dashed tag (only if any).
  4. "First rows": a table with the columns Line, Row, What happens, Problem. Line is right-aligned;
     set numbers are mono; an empty Problem is a muted dash. On a phone the table scrolls sideways
     inside its panel.
  5. "Import" (primary) and "Cancel". Under 768 they are the pinned bar above the tab bar.
- **After the import** (`import-finished`): a panel titled "Import finished" with a `check` and the
  counts as the same kind of list (`role="status"`). If rows were skipped, a dashed note, "N rows were
  skipped.", holding the small button "Download the skipped rows". Then "Open the library" (primary)
  and "Import another file".

The mockup's format names, column names and mapping options are placeholders. Keep the app's.

### 6.13 Settings (`settings`, `settings-places`, `settings-brands`, `settings-people`, `settings-activity`, `settings-trash`, `settings-trash-items`)

- **The area list** replaces the tab row: Places (`map-pin`), Brands and themes (`tags`), People
  (`users`), Catalog (`database`, admins only), Activity (`history`), Trash (`trash`). Each has a
  one-line description.
- **Under 1024:** `/settings` is that list (60px rows with a chevron). Tapping one opens the area's
  own page, whose breadcrumb leads back.
- **From 1024:** the list is a 240px column at the left of every settings page with the current area
  marked. `/settings` itself shows Places, as today.
- **Head:** on `/settings`, "Settings" and the household name. On an area, breadcrumb Settings / area,
  the area as `h1`, its description as the line.
- **Places:** an add row (New place, Inside, "Add place"), then the tree: child places are indented
  44px with an elbow line, each row with its counts and "Delete". Then "Rename or move a place".
- **Brands and themes:** two sections, each an add row, a list with counts and "Delete", and its
  disclosures.
- **People:** the list (tile, name, what the role can do, role tag), then "Add a person" (Name,
  Email, Password, Role, "Add person").
- **Activity:** the sentence about what never appears, then rows: tile, "**Ada Admin** added the set
  Space Shuttle Discovery", the time at the right (under the text on phones).
- **Trash:** the 30-day sentence, then rows with "Restore" (`arrow-back-up`), or the empty state.
- **Kid: no access to any of it.**

### 6.14 Catalog (`settings-catalog*`)

Admins only. Top to bottom: a status panel, the import panel, the history, the diagram link, the
credit.

- **Status panel:** title "Last imported Oct 29, 2026, 11:24 AM" with "19 days ago" in muted, or "No
  catalog yet" with one sentence. Below, a facts strip: Sets, Parts, Colors, Part images on disk,
  Free disk space.
- **Import panel**, by state:

  | State | What shows |
  | --- | --- |
  | Never imported | An explanation that names the size (about 6 GB of part images, plus the archive), the three steps, the paste box, "Check the page" disabled with "Paste the page source first." If the disk is short, a dashed note above the panel: "Not enough free disk space", with both numbers. |
  | Ready | The three steps, the paste box, "Check the page" (disabled until something is pasted). |
  | Checked | A note, "The page checks out", with what was found and what would be downloaded and skipped. "Import the catalog" (primary) and "Check the page". One line: "After this run, the next one is available 48 hours later." |
  | Nothing new to import | The page was checked and none of its dates are newer than the last import. A quiet note (not dashed: nothing is wrong) titled "Nothing new to import", saying so with the date of the last import. Under it the existing checkbox, "This page is older than your last import. Use it anyway." The import button stays disabled until the box is checked; "Check the page" stays. No behavior change. |
  | Running | Title "Import running: 41 of 196 files", the progress bar, the file being downloaded, and that it is safe to leave. The paste box is gone. `aria-busy`. |
  | Locked | A note titled "Available again Oct 31, 2026, 11:10 AM" with the 48-hour reason. Paste box and button disabled. |

- **Import history:** a table of Started, Result (a quiet "Succeeded", an outline "Running", a dashed
  "Failed"), Source, Files, Details. On a phone it scrolls sideways inside its panel.

### 6.15 More, 404

- **More** (`more`, `kid-more`): see 4.3. At desktop widths the same page renders in the shell; the
  sidebar's person tile links to it.
- **404** (`not-found`): no shell. The wall with a missing brick on a baseplate, the logo, `h1`
  "That’s not in the bin.", the existing paragraph, the missing-part box, and "Back to the library".
  Two columns from 900.
  - **The missing-part box** (`.partsline`): the missing page written up as a missing part. A box
    with a **3px dashed ink outline**, 3px corners and no fill, sitting on the page ground, up to
    420px wide, 14px by 16px padding. Inside it is laid out like one shopping-list line: at the left
    the quantity "1 ×" in the quantity style (24px/800, smaller "×"); beside it the name "Page, color
    unknown" (16px/750); under the name a muted 14px line, "Not added to your shopping list. We
    checked." It is not a link and has no hover. `role="note"`.
  - For a kid, drop the muted line, since kids have no shopping list. The quantity and name stay.

## 7. Empty, loading, error and edge states

### 7.1 Empty

| Where | Title | Text | Action |
| --- | --- | --- | --- |
| Library, new household | The bin is empty. | Add the first set and it shows up here, with a row for every box you own. Got a spreadsheet already? Import it instead. | Add set · Import a CSV file |
| Library, search with no matches | Nothing in the bin matches that. | Check the spelling, try the set number, or clear the search. Sets with no copies are left out unless you include them. | Clear the search |
| Set with no copies | No copies of this set. | The design is in the library, but nobody has said they own a box of it. Add a copy to give it a build state and a place. | Add copy |
| Instructions | No instructions saved for this set yet. | Upload the PDF, or save a link to it. (Kids see the first sentence only.) | The three buttons below it |
| Shopping list | Nothing is missing. | Every copy that has been checked is complete. When a piece goes missing, record it on the copy and it lands here. | Back to the library |
| Wishlist | Nothing on your list yet. | Add a set you have your eye on. The rest of the household can see it, and nobody can see who has already bought it. | Add a wish |
| Activity | Nothing has happened yet. | Add a set, move a copy, rename a place: each change is noted here with who made it. | none |
| Trash | The trash is empty. | Nothing has been deleted in the last 30 days. Tidy household. | none |
| Catalog history | No imports yet. | The first run will be listed here. | none |

In the empty Library the sorter still shows, all six at zero in the "zero" style, and the head line
reads "No sets yet". An empty shopping list hides its sort, filters and export.

### 7.2 Loading

- A list keeps its frame and shows rows at their real size with flat `--surface` and `--surface-2`
  bars where the cover, name, meta line and tags will be. No shimmer, no spinner over the page.
  `aria-busy="true"` on the list.
- A button that is working shows a spinner and a changed label (5.1).
- A refresh of data already on screen keeps the old rows until the new ones arrive.
- The catalog import is the only long-running thing and has its own state (6.14).

### 7.3 Errors

- **A field:** under the field (5.2).
- **A form:** a banner at the top plus the field messages. Nothing is cleared.
- **An action that failed** (save, delete, state change, restore): a dashed toast that says what
  failed and that nothing was changed, with "Try again".
- **A block that failed to load:** inside the block, in its frame: "**Couldn’t load the shopping
  list.** The server didn’t answer." and a small "Try again" button. Never a full-page banner.
- **Sign-in:** the banner in 6.1.

### 7.4 Data extremes (`library-extremes`, `set-five-copies`, `shopping-list-many`)

- **Very long set names:** two lines then an ellipsis in a row or tile; they break anywhere, so one
  unbroken word cannot push the layout. The page-head `h1` wraps without limit.
- **Long set numbers:** the meta line truncates with an ellipsis on one line.
- **No set number:** a dash in the meta line.
- **Five copies or more:** in the Library they collapse into state tags with counts, so the row is no
  taller. On the set page each copy is a card; nothing is collapsed.
- **No cover:** the baseplate (5.10).
- **Hundreds of sets:** the Library pages its results and says the range.
- **Thousands of missing parts:** the shopping list pages; "needed by" wraps and ends "and 9 more
  copies" when long; quantities up to four digits fit.
- **Three-digit sorter counts** fit at every width, which is why the sorter is two across on phones.

## 8. Accessibility

- **Contrast:** all text is at least 5.4:1; body text at least 12.0:1. Control borders are at least
  3.1:1. Focus rings are at least 5.0:1 against what they sit on. Figures are in `TOKENS.md`.
- **Nothing by color alone.** Build state is a fill, a glyph and a word. Completeness is a border
  style and a word. Current nav is a tone step, weight and a marker. A picked sorter brick has a ring
  and a check. A checked store-trip line has a check, a strike-through and a dimmed picture. Errors
  have an icon and words.
- **Landmarks:** `header` (phone top bar), `nav` with labels ("Main", "Household", "Settings",
  "Breadcrumb", "Pages"), `main`, `aside` for the sidebar and the Library filters. One `h1` per page,
  in the page head. Sections use `h2`; cards and tiles use `h3`. No level is skipped.
- **Names:** the stretched link on a set is the set's name. Icon-only buttons have `aria-label`s
  ("Close", "Show password", "One more"). Repeated row actions name their target where the visible
  word is not enough ("Delete Shelf 2", "Remove Dune Rover 4x4, book 1"); the visible text stays
  "Delete" and "Remove". The rail's Add brick keeps the name "Add set".
- **Controls:** the sorter, theme and sort buttons use `aria-pressed`. The switch is `role="switch"`.
  The state button has `aria-haspopup="menu"` and `aria-expanded`. State menu items are
  `menuitemradio`.
- **Dialogs and sheets:** `role="dialog"`, `aria-modal`, labeled by their title, focus trapped,
  Escape closes, focus returns to the opener.
- **Live regions:** success toasts are `role="status"`, failures and error banners `role="alert"`.
  The store-trip count and the import progress are polite live regions.
- **Targets:** at least 44 by 44px for every control on every width where a finger is likely (under
  1024). From 1024 small row buttons are 36px tall.
- **Phones:** inputs are 16px, so nothing zooms on focus. No horizontal page scroll from 360px.
  Fixed bars respect the safe areas.
- **Images:** list covers have empty alt text; the set-page cover is "Box art for <name>"; part
  pictures have empty alt text because the name and color are beside them; the state wall is one
  image with a full sentence as its label.
- **Reduced motion:** every duration becomes 1ms and all lift, drop and slide travel is removed.
  Colors still change. The spinner stops and becomes a dotted ring. Nothing in the app loops,
  auto-plays or moves on load in any case.
- **Zoom:** type is in `rem`. At 200% the phone layout applies and nothing is lost.

## 9. Copy changes

Control labels are unchanged unless listed here. "Tests" marks a change that an automated test
finding a control by its accessible name or text may notice.

| Screen | Old text | New text | Reason | Tests |
| --- | --- | --- | --- | --- |
| Shopping list | Sort option "Colour" | "Color" | US spelling throughout, at the owner's request | **Yes** |
| Shopping list | Filter label "Colour" | "Color" | US spelling | **Yes** |
| Shopping list | Filter option "All colours" | "All colors" | US spelling | **Yes** |
| Shopping list, exports | CSV column header "Colour" (and any other "Colour" header in the exports) | "Color" | US spelling. Anyone with a saved spreadsheet that reads the old header will notice | **Yes** |
| Piece picker | Select label "Colour" (Set parts and Whole catalog tabs) | "Color" | US spelling | **Yes** |
| Piece picker | Placeholder "Part number, name or colour" | "Part number, name or color" | US spelling | **Yes** |
| Catalog | Stat label "Colours" | "Colors" | US spelling | **Yes** |
| Anywhere else | Any remaining "colour" in labels, hints, messages or `aria-label`s | "color" | US spelling. Search the source for it; the screenshots do not show every string | **Yes** |
| Catalog, page older than the last import | No headline. Checkbox "This page is older than your last import. Use it anyway." | A note above the checkbox: "**Nothing new to import** None of the dates on this page are newer than your last import, on Oct 29, 2026. Rebrickable has not published anything since, so you can stop here." The checkbox keeps its label | Says what the state means before offering the override | No (the checkbox label is unchanged) |
| Store-trip mode | "0 of 4 ticked" | "0 of 4 checked off" | US wording; "ticked" is British | Maybe |
| Store-trip mode | (no line) | "Store-trip mode. Tap a part when it is in the cart." | Says what the mode is for | No |
| Confirm dialogs | "It moves to the trash. You can restore it from Settings > Trash." | "It moves to the trash. You can restore it from Settings, then Trash, for 30 days." | No symbol as a word; states the limit the Trash page already states | Maybe |
| Library, search | "1 set match" | "1 set matches “crane”" | Grammar; repeats the search so the count has a subject | Maybe |
| Library tiles | One numbered badge per copy; "+2 more copies" | State tags with counts ("Sealed ×5") | Shorter, and rows stay the same height | Yes |
| Library | Build state checkbox group | Six buttons with `aria-pressed`, named "Sealed", "Opened", and so on | The sorter | Yes |
| Library filters sheet | (none) | A second button, "Clear filters" | A way out of a long sheet. It only unchecks what is checked | No |
| Set detail | "Tags: Christmas 2025", "Retail price $119.99" as sentences | Labels "Tags" and "Retail price" with values | Key-value list | Maybe |
| Set detail | "Linked to Rebrickable 10294-1. Catalog data from Rebrickable." | Same sentence under a "Catalog" label | Key-value list | No |
| Set detail, instructions | "No instructions saved for this set yet." | Same, plus "Upload the PDF, or save a link to it." | Says the next step | No |
| Add a set | "+ New brand" | "New brand" with a plus icon | The plus is decoration | Maybe |
| Add a set | (no line) | "Look it up, or type it in. One form covers the design and the box." | Orients a first visit | No |
| Add a set, errors | (not captured) | "Two things need fixing before this can be saved.", "Give the set a name.", "Use a four-digit year." | Placeholders that show the voice. Keep the app's own messages | No |
| Wishlist | (none) | A button "Add a wish" under 1024, opening the form | The form moves into a sheet. Its submit keeps the name "Add to my wishlist" | Yes |
| Wishlist | (no line) | "Everyone’s lists. Purchase marks stay private." Kid: "Your list. The rest of the household can see it." | States the privacy rule where it matters | No |
| Wishlist, your own mark | (not captured) | Tag "You bought this", then the date, your note and "Only you see this." The button keeps its label, "Undo" | The tag and line are new presentation; the button is unchanged | No |
| Collection | "no estimate · never valued"; "$65.00 · Jul 2025" | Columns "Estimate" and "Last valued": "No estimate", "Never"; "$65.00", "Jul 2025" | A table with headers reads faster than seventeen identical phrases | Maybe |
| Collection | (none) | Under the stale-value title: "Copies whose estimate is missing or old. Open one and edit the copy to set it." | Says what to do | No |
| Import | One paragraph | Two short paragraphs; the second is a note titled "Two things to know first" | Easier to scan. Same facts | No |
| Import, after a file | (not captured) | All labels as the app has them: "File format", "Build state for the copies", "Preview", "First rows", "Import", and the hints. Added: a group label "Columns in the file" over the mapping selects, and a "Cancel" link beside Import | The group needs a name for screen readers. Drop "Cancel" if the app has none | Maybe |
| Import, finished | (not captured) | "Import finished", "N rows were skipped.", "Download the skipped rows", "Open the library", "Import another file", unchanged | Kept as they are | No |
| Add a set, scan | Button "Scan a barcode" | Same name, now an icon-only button inside the lookup field. Sheet title "Scan a barcode"; sentence "Point the camera at the barcode on the box. When it reads, the number goes into the lookup and this closes." | Keep the app's own scanning text if it has some | Maybe |
| Settings | Tabs: Places, Brands and themes, People, Catalog, Activity, Trash | Links with the same names in a list, each with a description | Settings home | Yes (role changes from tab to link) |
| Settings areas | `h1` "Settings" on every tab | `h1` is the area's name; "Settings" is in the breadcrumb | One page per area | Yes |
| People | Role "Kid profile (read-only)" plain text | Same words in a tag, plus a line per person saying what the role can do | Explains roles where they are assigned | No |
| People | Role options (only "Member: can add and edit" was visible) | Keep the app's existing three option labels | I could not see the other two | No |
| Trash | "The trash is empty." | Same, plus "Nothing has been deleted in the last 30 days. Tidy household." | Voice | No |
| Catalog | (button name not captured) | Placeholder "Import the catalog". **Keep the app's existing label** | I could not see it | No |
| Theme | Two icon buttons (sun, moon) in the sidebar and phone top bar | Three buttons: "System", "Light", "Dark", in the sidebar and on More | The brief asks for system plus a manual choice | Yes |
| More | Rows with a name only | Rows with a name and a description; "Theme" section added | Says what is behind each row | No |
| Sign in | (illustration of boxes on shelves) | Panel text "Know what’s in every box." and one sentence; credit and non-affiliation line under the form | Same headline as the site | No |
| 404 | (three blocks) | The wall, plus the missing-part box: "1 ×", "Page, color unknown", "Not added to your shopping list. We checked." | Voice, shared with the site | No |
| Toasts | (not captured) | "Copy 1 is now Built.", "Restored Shelf 2.", "Couldn’t save the set. Nothing was changed." | Keep "Added to your wishlist." as given | Maybe |

Set names such as "Harbour Lighthouse" are data people typed, and are left alone.

## 10. Voice and tone

The app sounds like the site: someone who has sorted a lot of bricks and run a small server for
years. Plain, exact, a little dry. In an app there is less room, so the rules are stricter.

1. **Say the fact first.** If there is a light touch, it comes after, and the sentence works without
   it. "The trash is empty. Nothing has been deleted in the last 30 days. Tidy household."
2. **One light touch per screen at most, and only where nothing is at stake:** empty states, the 404,
   the sign-in panel. None in forms, confirms, errors, the catalog import or anything about money.
3. **Buttons are verbs that name the result.** "Add copy", "Move to trash", "Mark as bought", "Add to
   the collection", "Check the page". Never "OK", "Submit" or "Yes".
4. **A confirm says what will happen and how to undo it.** "It moves to the trash. You can restore it
   from Settings, then Trash, for 30 days."
5. **An error says what failed, what state things are in, and what to do.** "Couldn’t save the set.
   Nothing was changed." "Choose a PDF first." Never "Oops", "Something went wrong" or "Invalid
   input".
6. **Numbers beat adjectives.** "41 of 196 files", "about 6 GB", "48 hours", "30 days".
7. **Name real things:** boxes, copies, the tub, the hall closet, the cart, this server.
8. **Say what is not there, plainly.** "None", "Never", "No estimate", "Not checked", "No copies".
9. **"You" is the person signed in. "We" is the household** ("Showing sets we own.", "We got it").
   The app never says "I". Kids are "kids" in text adults read and are never talked down to in text
   kids read: the same words, minus what they cannot see.
10. **No exclamation marks.** No "simply", "just", "easy", "seamlessly", "powerful", "unlock",
    "awesome". No strings of three adjectives. No "it's not X, it's Y".
11. **Sentence case everywhere.** Full sentences end with a period. Labels, buttons and tags do not.
12. **US spelling and words:** color, catalog, license, gray, store, closet, cart, check off.
13. **Credit Rebrickable, with a link, wherever catalog data shows.** Say "LEGO" only as a brand name
    in data, in the catalog lookup and in the non-affiliation line.

| Where | Do | Don't |
| --- | --- | --- |
| Empty library | "The bin is empty." | "Welcome! Let's get building!" |
| Empty shopping list | "Nothing is missing." | "Hooray, you're all caught up!" |
| Toast | "Copy 1 is now Built." | "Success! Build state updated." |
| Failure | "Couldn’t save the copy. Nothing was changed." | "Oops, something went wrong. Please try again later." |
| Confirm | "Delete Shelf 2?" | "Are you sure you want to delete this item?" |
| Limit | "Available again Oct 31, 2026, 11:10 AM" | "Please wait before importing again." |
| Privacy | "Only you see this." | "Don't worry, your secret is safe with us!" |
| Kid wishlist | "Your list. The rest of the household can see it." | "Tell the grown-ups what you want!" |
| Loading line | "Import running: 41 of 196 files" | "Hang tight while we work our magic…" |

Stock lines to reuse word for word: "Catalog data from Rebrickable" (with the link); "Brick Bin is
not affiliated with the LEGO Group or any other brick maker."; the six state descriptions in 5.7.

## 11. Icons

Tabler Icons, outline, 20px (16px inside small buttons and tags, 24px in the tab bar), stroke 1.75.
The mockups draw them inline from memory to match Tabler closely. In the build, import them from
`@tabler/icons-react` by these names and do not copy the mockup paths.

`layout-grid` Library · `list-check` Shopping list · `heart` Wishlist · `chart-bar` Collection ·
`upload` Import, Upload PDF · `settings` Settings · `dots` More · `plus` add · `minus` stepper, a
"no" in Box and booklets · `x` close, remove a tag · `check` done, complete, current choice ·
`search` · `chevron-down` menus, filter groups · `chevron-right` list rows, disclosures, next page ·
`chevron-left` previous page · `selector` selects · `pencil` edit · `trash` Trash, Delete set ·
`logout` Sign out · `map-pin` places · `eye`, `eye-off` password, hidden from kids ·
`external-link` Find on LEGO.com · `link` Add link, a saved link · `file-text` a saved PDF ·
`download` Export, Save PDF from a link, Import the catalog · `file-download` export formats ·
`barcode` Scan a barcode · `adjustments-horizontal` Filters · `printer` Print · `refresh` Re-sync, Try again ·
`alert-triangle` Missing pieces button, failed toast · `alert-circle` field and form errors ·
`users` People · `user` minifig stand-in · `history` Activity · `database` Catalog · `tags` Brands
and themes · `arrow-back-up` Restore · `shopping-cart` Store-trip mode · `lock` private mark ·
`device-desktop`, `sun`, `moon` theme.

Custom SVG, in `mockups/assets/svg/`: the mark and lockup, the favicon, six state glyphs, the 1×1,
the stud mask, the baseplate tile, the pile (`hero-pile.svg`, used in its Built state on sign-in),
the 404 wall.

## 12. Things to check against the real app

I worked from screenshots, the brief and the project manager's answers. In the places below I could
not see the app's wording. **For every item in this list the developer must keep the app's existing
label, option text and field set. The text in my mockups there is a placeholder that only shows
layout and voice.**

- **The three instruction dialogs** (Upload PDF, Add link, Save PDF from a link): their fields,
  labels, hints and button names. The error "Choose a PDF first." is confirmed.
- **The piece picker's "Other" tab:** its fields and button.
- **The button that starts a catalog import** after "Check the page". The mockups say "Import the
  catalog".
- **The Library's sort options.** Only "Name" was visible.
- **The role option labels** in "Add a person". Only "Member: can add and edit" was visible.
- **Field validation messages** on Add a set and elsewhere, and the text of success and failure
  toasts other than "Added to your wishlist."
- **CSV import:** the format names, the mapping options, and the exact sentences in the "What
  happens" and "Problem" columns.
- **The barcode sheet's sentence**, and what the app says when the camera is refused.
- **"Clear filters"** in the two filter sheets. It is a convenience that only unchecks what is
  checked. Leave it out if the app has no equivalent.
- **"Cancel" beside "Import"** on the import preview. Leave it out if the app has none.

Confirmed by the project manager, so not placeholders: the "Scan a barcode" button and that it
renders only where the browser supports barcode detection; "Undo" on a private purchase mark, seen
only by its maker; the "Nothing new to import" state and its checkbox; every CSV import label in
6.12; "Colour" becoming "Color" everywhere, tests included.

## 13. Deliberately flexible

You may change these without asking:

- Class names, file structure, how components are split, and which Mantine component sits underneath,
  as long as the states in section 5 hold.
- The exact drawing of the six state glyphs, or Tabler stand-ins for them (3.5).
- The tile grid's minimum width (196px) and so the number of tiles per row, by a column either way.
- The 1240 breakpoint for the six-across sorter, and the 900 breakpoint for sign-in, by a few tens of
  pixels.
- The sidebar width (248) and rail width (96), by 16px either way.
- Whether small dialogs are sheets or centered modals between 768 and 1023.
- Toast duration and position on desktop.
- The wording of sample sentences marked "keep the app's own" in section 9.
- Rounding 650 and 750 weights to 600 and 700.
- How the wishlist form column behaves between 1024 and 1239 if it feels tight: it may drop to a
  sheet there too.
- The order of the lower Collection panels.

Please do not change these without asking:

- Which color belongs to which build state, and the rule that bright colors mean build states only.
- A state always shown as fill, glyph and word together.
- The four motif meanings, and where studs must not appear (one primary per block; none on danger,
  disabled or read-only things).
- Albert Sans, sentence case, the 14px floor, 16px inputs.
- One 3px radius, no gradients, no shadows on resting surfaces.
- Missing pieces as dashed ink, with red kept for destructive actions and errors.
- The page head on the field in both themes, and the tab bar as a field brick.
- Kid views: no prices, no shopping list, no Collection, Import or Settings, hidden sets absent,
  enforced on the server, and no element that hints at any of them.
- A private purchase mark reaching only its maker.
- The Rebrickable credit wherever catalog data shows.
- Nothing loading from a third party at runtime.
