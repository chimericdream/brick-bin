# Brick Bin site: developer handoff

This is the final design for the Brick Bin marketing and documentation site. It merges two earlier
designs. `EVALUATION.md` says what came from where and why.

**How to use this package.** Open the `.html` files in the package root by double-clicking. They are
the reference. `assets/css/site.css` is the source of truth for every value, and this document
explains it. Where this document and the stylesheet disagree, the stylesheet wins, and that is a bug
in this document.

## 0. What is in the package

| Path | What it is |
| --- | --- |
| `index.html` | Landing page |
| `tutorials.html` | Tutorials index |
| `tutorial-import-catalog.html` | The tutorial template, filled in for tutorial 2 |
| `docs-setup.html`, `docs-hosting.html`, `docs-configuration.html` | Documentation |
| `faq.html`, `404.html` | FAQ and not-found page |
| `states.html` | Reference sheet of every interactive state. Not a site page. |
| `assets/css/site.css` | All styles. Tokens are at the top. |
| `assets/js/site.js` | Theme, phone menu, "On this page" tracking, copy buttons, the hero pile |
| `assets/fonts/` | Albert Sans and JetBrains Mono (variable WOFF2) with their licenses |
| `assets/svg/` | Mark, lockup, favicon, icons, motif pieces, the 404 wall, the hero pile |
| `screenshots/` | PNGs of every page and state (section 10 lists them) |
| `PLACEHOLDERS.md` | Every screenshot placeholder: ID, file name, caption, alt text |
| `EVALUATION.md` | Assessment of the two input designs |
| `tools/` | `build.py` stamps the shared header, menu and footer into the pages from `tools/src/`. `shoot.mjs` takes the screenshots. Neither is needed to view the mockups. |

Screenshot helpers: add `?theme=system|light|dark`, `?menu=open`, `?toc=open`, `?tutnav=open`,
`?state=sealed|opened|progress|built|apart|mixed` or `?nojs=1` (the page as it is with scripts off)
to a page address. These exist only for the
mockups. Do not ship them.

## 1. The concept in one paragraph

**Sorted.** Anyone with a tub of bricks ends up sorting it, and most people sort by color. The site
does the same: each section is a brick of its own color, and you find your way by color.
Tutorials is orange, Setup is green, Hosting is blue, Configuration is tan, FAQ is pink. Around
the bricks, the room is calm and nearly colorless: off-white or charcoal, near-black type, one
typeface. Every page opens with a brick. The only moving thing is a small pile of bricks on the
landing page that shows the six build states.

## 2. Tokens

All tokens are CSS custom properties on `:root`. In the build, keep the same names as CSS variables
(for CSS modules) and mirror them in the Mantine theme's `other` object.

### 2.1 Color: the room (changes with the theme)

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--ground` | `#F5F5F2` | `#141517` | Page background |
| `--surface` | `#EAEAE5` | `#1E2023` | Cards, callouts, placeholders, disclosures, table row highlight |
| `--surface-2` | `#DCDCD5` | `#2A2D31` | Quiet buttons, current item in a sidebar, toggle track, alternate step brick |
| `--line` | `#CFCFC7` | `#34373C` | 1px rules, table rows, frame borders. Decorative only (1.4:1). |
| `--ink` | `#121212` | `#EFEFEA` | All running text, headings, 2px rules, dashed outlines |
| `--muted` | `#4D4D48` | `#ABAEB2` | Captions and secondary notes. Never body copy. |
| `--field` | `#17191C` | `#0B0C0D` | Hero and footer. Dark in both themes. |
| `--field-2` | `#26292E` | `#1C1E21` | Panels and controls on a field |
| `--field-line` | `#3A3E44` | `#2C2F33` | Rules on a field |
| `--field-ink` | `#F5F5F2` | `#EFEFEA` | Text on a field |
| `--field-muted` | `#B8BBBF` | `#ABAEB2` | Secondary text on a field |
| `--btn` / `--btn-ink` | `#121212` / `#F5F5F2` | `#EFEFEA` / `#121212` | Primary button |
| `--btn-hover` | `#34342F` | `#FFFFFF` | Primary button, hover |
| `--focus` | `#0B5FC4` | `#7CC0FF` | Focus ring. On a field: `#7CC0FF` in both themes. On a bright brick: `#121212`. |
| `--code-bg` | `#E6E6E0` | `#202326` | Inline code and code blocks |
| `--dot` | `rgb(18 18 18 / .13)` | `rgb(239 239 234 / .12)` | Baseplate dots |
| `--shadow-float` | `0 18px 48px rgb(0 0 0 / .28), 0 2px 6px rgb(0 0 0 / .18)` | same | Reserved. Nothing in the mockups uses it. See 2.6. |

### 2.2 Color: the bricks (never change with the theme)

| Token | Value | Means | Text on it |
| --- | --- | --- | --- |
| `--brick-tutorials` | `#FF8C1A` | Tutorials | `#121212`, 8.0:1 |
| `--brick-setup` | `#6CC04A` | Setup, and "start here" | `#121212`, 8.3:1 |
| `--brick-hosting` | `#4DB3E6` | Hosting, and the self-hosting section of the landing page | `#121212`, 7.9:1 |
| `--brick-config` | `#D8BC88` | Configuration | `#121212`, 10.2:1 |
| `--brick-faq` | `#F49AC1` | FAQ | `#121212`, 9.1:1 |
| `--brick-ink` | `#121212` | Text on any brick, in both themes | |
| Setup hover | `#7FD45C` | The "start" button, hover | `#121212`, 10.2:1 |
| `--part-gray` `#A0A5A9`, `--part-tan` `#958A73` | | The two "stranger" bricks in the hero's Mixed state, and the part swatch on a feature card | |

The PM confirmed these are not to be matched to the app's palette.

**Section color is applied through one variable, `--sec`.** `<body data-section="tutorials|setup|hosting|config|faq">`
sets it for the page. A `.sec-*` class sets it for one element (a sidebar link, a "next" brick that
leads to another section). Components read `var(--sec)` and never name a brick color directly.
The landing page and the 404 have no section, so `--sec` falls back to `--ink`.

### 2.3 Contrast (computed, WCAG 2.1)

| Pair | Light | Dark |
| --- | --- | --- |
| Ink on ground / surface / surface-2 | 17.2 / 15.5 / 13.6 | 15.8 / 14.2 / 12.0 |
| Muted on ground / surface / surface-2 | 7.8 / 7.0 / 6.2 | 8.2 / 7.3 / 6.2 |
| Field ink on field | 16.1 | 16+ |
| Field muted on field / field-2 | 9.1 / 7.6 | 8.8 / 7.5 |
| Focus ring on ground / surface-2 | 5.6 / 4.4 | 9.4 / 7+ |
| Brick ink on the five bricks | 7.9 to 10.2 | same |
| **A section color against the ground** | **1.7 to 2.2** | 8 to 10 |

The last row matters. On the light ground the brick colors are too pale to carry meaning alone.
So **every state that uses a section color also has a second cue**: heavier type, a tone step, a
marker, or `aria-current`. Keep that rule when you add components.

### 2.4 Type

| Face | Use | License | File |
| --- | --- | --- | --- |
| **Albert Sans** (variable, 100 to 900) | Everything except code | SIL OFL 1.1 (`assets/fonts/AlbertSans-OFL.txt`) | `assets/fonts/AlbertSans-Variable.woff2` |
| **JetBrains Mono** (variable, 100 to 800) | Code, variable names, keys, placeholder IDs, sidebar numbers | SIL OFL 1.1 (`assets/fonts/JetBrainsMono-OFL.txt`) | `assets/fonts/JetBrainsMono-Variable.woff2` |

Weights in use: Albert Sans 400, 500, 600, 650, 700, 750, 800. JetBrains Mono 400, 600, 700. If you
would rather ship static files, 400, 500, 600, 700 and 800 are enough for Albert Sans: map 650 to
600 and 750 to 700.

**Getting the fonts.** The two WOFF2 files in `assets/fonts/` are ready to use with
`next/font/local`. They came with one of the input designs and I could not inspect their glyph
coverage, so check that they are not a narrow subset before shipping. To fetch fresh copies:
Albert Sans from `github.com/usted/Albert-Sans` (or the `@fontsource-variable/albert-sans` npm
package), JetBrains Mono from `github.com/JetBrains/JetBrainsMono` (or
`@fontsource-variable/jetbrains-mono`). Both packages copy files into your build, so nothing loads
from a third party at runtime. Do not use the Google Fonts stylesheet.

Fallback stacks: `"Albert Sans", system-ui, "Segoe UI", sans-serif` and
`"JetBrains Mono", ui-monospace, "Cascadia Mono", Consolas, monospace`. `font-display: swap`.
Preload Albert Sans only.

| Token | Value | px, 360 to 1440 | Use |
| --- | --- | --- | --- |
| `--step-small` | `0.875rem` | 14 | Captions, meta, table heads, tags, footer base. **Nothing is smaller than 14px.** |
| (fixed) | `1rem` | 16 | Card text, table cells, sidebar, callouts |
| `--step-body` | `clamp(1.0625rem, 1.04rem + 0.1vw, 1.125rem)` | 17 to 18 | Running text |
| `--step-lead` | `clamp(1.25rem, 1.16rem + 0.4vw, 1.5rem)` | 20 to 24 | Ledes, `h3`, FAQ questions, row titles |
| `--step-h2` | `clamp(1.625rem, 1.5rem + 0.56vw, 2rem)` | 26 to 32 | `h2` inside prose, group headings |
| `--step-head` | `clamp(2.125rem, 1.53rem + 2.6vw, 3.75rem)` | 34 to 60 | Page titles, landing section titles |
| `--step-display` | `clamp(2.75rem, 1.64rem + 4.9vw, 5.25rem)` | 44 to 84 | The landing `h1` only |

| Role | Weight | Tracking | Line height |
| --- | --- | --- | --- |
| `h1`, `h2` | 800 | -0.03em (landing `h1` -0.04em) | 1.02 (landing `h1` 0.96, prose `h2` 1.1) |
| `h3` | 700 | -0.02em | 1.15 |
| Body | 400; `b` and `strong` 700 | 0 | 1.55 |
| Lede | 400 | 0 | 1.35 |
| Buttons | 650 | 0 | 1.2 |
| Navigation | 600; current page 800 | 0 | |
| Wordmark | 800 | -0.035em | |

Sentence case everywhere. No uppercase, no letter-spaced small caps, no italics. Headings use
`text-wrap: balance`, paragraphs `text-wrap: pretty`. Running text in docs follows the one measure in
6.17.

### 2.5 Space

A 4px base. Tokens are numbered by step, and the spec refers to them by pixel value.

| Token | `--s1` | `--s2` | `--s3` | `--s4` | `--s5` | `--s6` | `--s7` | `--s8` | `--s9` | `--s10` |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| px | 4 | 8 | 12 | 16 | 24 | 32 | 48 | 64 | 96 | 128 |

| Token | Under 768 | 768 to 1023 | 1024 and up |
| --- | --- | --- | --- |
| `--gutter` (page margin, each side) | 16 | 24 | 32 |
| `--section` (gap between landing sections) | 88 | 120 | 144 |
| `--max` (content width, without gutters) | 1280 | 1280 | 1280 |

Gap between cards in a grid: 8px. Gap between stacked bricks: 4px (steps) or 12px including studs
(closing stack).

### 2.6 Radii and shadows

- `--r: 3px` on everything: buttons, bricks, cards, frames, inputs, tags. A molded edge. No pills,
  no circles.
- **No shadows.** Depth is tone steps and 1px lines. `--shadow-float` is defined for a future
  floating element (a dropdown or toast) and is not used. The phone menu is a full-screen sheet, so
  it needs none.

### 2.7 Breakpoints

All `min-width`. Designed at 390 first, checked at 360, 390, 768, 1024 and 1440.

| Min width | What changes |
| --- | --- |
| 0 | One column. Phone header (logo and Menu button). |
| 640 | Feature cards in two columns. Footer wall on one line. |
| 720 | Tables stop stacking and become real columns. |
| 768 | Wider gutter. Page-head studs grow. Screenshot pair sits side by side. Closing stack shows descriptions. Steps are indented under their number. |
| 900 | Full header (links, theme toggle, "Set it up"). Two-column section heads. The copies illustration puts state and place on one line from 1100. Self-hosting bricks step sideways. Tutorials index rows on one line. Footer in five columns. 404 in two columns. |
| 960 | Hero splits into text and pile. |
| 1024 | Widest gutter. Feature cards in three columns. Docs and tutorials get the left sidebar. FAQ gets its right column. |
| 1280 | Docs and tutorials get the right "On this page" column. |

Suggested Mantine breakpoints: `xs: 40em (640)`, `sm: 48em (768)`, `md: 56.25em (900)`,
`lg: 64em (1024)`, `xl: 80em (1280)`. Keep 720 and 960 as two local media queries.

Two components respond to **their own size, not the window's**, with CSS container queries: the
hero's build-state buttons (6.7) and the screenshot placeholder (6.14).

### 2.8 Motion

| Token | Value | Use |
| --- | --- | --- |
| `--t-fast` | 120ms | Hover and press on buttons, arrows, number bricks, background tints |
| `--t-med` | 240ms | Section bricks and "next" bricks lifting, opacity in the hero pile |
| `--t-slow` | 520ms | Hero pile pieces moving between states |
| `--ease` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | Everything except the pile |
| `--snap` | `cubic-bezier(0.3, 1.4, 0.5, 1)` | The pile: a slight overshoot, like a brick clicking home |

Travel: buttons lift 2px on hover and drop 2px on press (their studs squash to half height).
Section bricks and "next" bricks lift 4px. Tutorial number bricks lift 3px. Arrows slide 3 to 4px.
Transform and opacity only. Nothing loops, nothing is tied to scrolling, nothing animates on load.

`prefers-reduced-motion: reduce`: all durations become 1ms and all hover and press travel is
removed. Color changes stay. The hero pile still changes state, without moving through the air.

## 3. The brick-motif system

One object, seen four ways. Each way has one meaning.

| # | Element | What it looks like | It means | CSS |
| --- | --- | --- | --- | --- |
| 1 | **Stud row** (side view) | A row of rectangular studs along the top edge of a block | "You can press this", or "this is a place" (a page, a section, a step) | `.studs` |
| 2 | **1×1** | A tiny one-stud brick at text size, in the section color | "This is a list item", or "you are here" | `.b1`, prose bullets |
| 3 | **Baseplate** (top view) | A grid of dots | "Something is waiting to go here" | `.baseplate` |
| 4 | **Dashed outline** | A 2px dashed ink border, no fill | "Something is missing, or needs you" | `.tag--missing`, `.note--mind`, the 404 gap |

### 3.1 The stud row

Built with one rule. `.studs` needs `--brick` (its color). A `::before` sits on top of the block,
filled with `--brick` and masked by `assets/svg/stud-mask.svg` (inlined as a data URI in
`--stud-mask`).

- **Geometry.** One module is `--pitch` wide. The stud is the middle 60% of it. Height is
  `--stud-h`, roughly 0.28 to 0.3 of the pitch. `--stud-inset` holds the row in from both ends by
  about half a pitch, so the row never touches the corners.
- **Whole studs only.** `mask-repeat: round` stretches the pitch slightly so a whole number fits.
  Never crop a stud.
- **Space above.** `.studs` adds `margin-top: var(--stud-h)` so the studs never overlap what is
  above. Components that set their own top margin add the stud height to it.
- **Studs are flat.** No highlights, no perspective, no lettering, no logo on a stud.

| Scale | Pitch / height | Where it appears |
| --- | --- | --- |
| Text | 0.8em wide body, 0.2em stud | The 1×1 (element 2) |
| Small | 16 / 5 to 6px | Header "Set it up" button, step numbers, tutorial number bricks, the header's current-page plate (10 / 3) |
| Component | 20 / 6px | Buttons |
| | 26 to 32 / 7 to 9px | Phone-menu bricks, self-hosting steps (28 / 8), closing stack and "next" bricks (32 / 9) |
| Architecture | 40 to 56 / 11 to 15px | Page heads (40 / 11 under 768, 48 / 13 above), the hero (44 / 12 under 960, 56 / 15 above), footer letters (two studs each, 50% pitch) |

**Where the stud row appears**

| Component | Phone | Tablet and desktop |
| --- | --- | --- |
| Primary buttons | Yes, full width of the button | Same |
| Page head (every inner page) | Yes | Yes, larger studs from 768 |
| Hero (landing) | Yes | Yes, larger studs from 960 |
| Phone-menu section bricks | Yes | Not shown (no phone menu from 900) |
| Self-hosting steps | Yes, stacked, full width | From 900 each is 58% wide and steps right by 14% |
| Closing stack | Yes, names only | From 768 with descriptions |
| "Next" brick at the end of a page | Yes | Yes |
| Step numbers, tutorial number bricks | Two studs each | Same |
| Header current-page plate | Not shown (no header links) | Yes |
| Footer wordmark wall | Two rows: BRICK, then BIN, equal heights | From 640 one row, heights varied |

**Where it must not appear**

- Behind or under running text. Text sits on a flat ground or a flat brick face.
- On callouts, cards, tables, code blocks, form fields, disclosures, the docs sidebar, "On this
  page", quiet buttons or tags. If you cannot press it and it is not a place, it has no studs.
- Loose: no scattered bricks, no tilted bricks in layouts, no stud dividers, no stud backgrounds.
  The hero pile is the one exception, and it is a picture of bricks, not page furniture.
- At architecture scale more than once in a viewport. In practice: one page head or hero at the
  top, the footer wall at the bottom.

### 3.2 The 1×1

`.b1` is an inline block, 0.8em by 0.56em with a 0.2em stud, filled with `var(--sec)`. Prose list
bullets draw the same shape with `::before` and `::after`.

- **Appears:** bullets in docs and tutorials, beside each link in the docs sidebar and phone docs
  tabs (as a color key), beside the current heading in "On this page", before FAQ questions, in
  callout titles, in the landing eyebrow.
- **Never:** on its own as decoration, in tables, in the footer, or larger than 1em.
- On a current docs tab (which is itself the section color) the 1×1 turns ink.

### 3.3 The baseplate

`.baseplate`: `--surface` with a 9px `--dot` circle on a 20px grid (`radial-gradient`), centered.

- **Appears in exactly two places:** every screenshot placeholder frame, and behind the 404 wall.
- **Never** behind text. The placeholder label sits on its own solid `--ground` card.
- When a real screenshot arrives, the baseplate goes with the placeholder.

### 3.4 The dashed outline

2px dashed, `--ink` (or `currentColor`), 3px radius, no fill.

- **Appears:** `Required`, `Set it`, `None`, `$0`, `Not yet`, `4 missing`, `× 4`, `3 stale` tags;
  the "mind this" callout; the missing brick and the parts line on the 404.
- **Never** for decoration, for focus (focus is a solid ring), or for things that are merely
  optional.

### 3.5 Color rules

1. A bright brick color means a section. Used anywhere else it would lie about where you are.
2. Things that belong to no section are neutral: cards, placeholders, callouts, self-hosting steps.
3. All five colors appear together in four places only: the hero pile, the phone menu, the closing
   stack and the footer wall (plus the 404 wall, which is the wall with a piece gone).
4. A "next" brick takes the color of the section it leads to, not the one you are in.
5. Bricks do not change color in dark mode. The room darkens.
6. A button that sits on a bright brick is always ink (`#121212` with `#F5F5F2` text) in both
   themes.

### 3.6 Trade dress

No LEGO logo or wordmark, no logos or letters on studs, no minifigure shapes, no red-and-yellow
scheme. "LEGO" appears only as a word where the content needs it: the brand list, the catalog, the
non-affiliation note. Do not add a red brick or a yellow brick to the palette.

## 4. Logo

- **Mark** (`assets/svg/logo-mark.svg`): a two-stud brick sitting in a bin, drawn on a 32 unit grid.
  One color, `currentColor`. Minimum size 20px. `logo-mark-color.svg` has a green brick in an ink
  bin, for light backgrounds outside the site. `favicon.svg` is the mark on a charcoal tile.
- **Wordmark:** the words "Brick Bin" as live text, Albert Sans 800, tracking -0.035em. It is never
  an image on the site. `logo-lockup.svg` holds mark and text together for other uses. Its text is
  a real `<text>` element, so **outline it before using the file anywhere the font is not loaded**
  (social cards, app icons). I had no tool to outline it here.
- **Lockup:** mark, 10px gap, wordmark at 22px. Clear space: the height of the mark's stud on all
  sides.
- **Large form:** the footer wall (6.3).

## 5. Page shell

```
<a class="skip">            skip link, first focusable element
<header class="site-header"> logo · main nav · theme toggle · "Set it up"   (phone: logo · Menu link)
<div class="menu">           phone menu sheet (dialog)
<main id="main">             page content, inside .wrap
<footer class="site-footer"> wall · link columns (id="site-nav") · credit · base line
```

`.wrap` is `max-width: 1280px` plus gutters, centered. The header is not sticky. In docs, the sidebar
and "On this page" are sticky instead.

## 6. Components

Class names are the mockup's. Rename them freely. Suggested Mantine starting points are given
where one fits. Everything is ordinary CSS: grid, flex, masks, `aspect-ratio`, `clamp()`.

### 6.1 Header (`.site-header`)

| | Under 900 | 900 and up |
| --- | --- | --- |
| Height | 72px minimum | 72px minimum |
| Left | Logo (mark 30px, wordmark 22px), 48px tall target | Same |
| Right | "Menu" control: 48px tall, `--surface-2`, label and icon. It is a link to `#site-nav` that scripts upgrade to a button (6.2). | Nav links, theme toggle (icons), "Set it up" (small primary button, links to Setup) |

Nav links (`.nav a`): Tutorials, Docs (goes to Setup), FAQ. 44px tall, 14px side padding, weight
600.

| State | Appearance |
| --- | --- |
| Rest | Ink text, no background |
| Hover | `--surface` background |
| Focus | 3px `--focus` ring, 3px offset |
| Current (`aria-current="page"`) | Weight 800, and a small plate under the word: 5px bar with a 3px stud row above it (pitch 10px), in `--sec`. "Docs" is current on all three docs pages and takes that page's color. |

Mantine: `Group`, `Anchor`, `Button`, `Burger` (or a plain button, as here, with the word "Menu").

### 6.2 Phone menu (`.menu`)

A full-screen sheet on `--ground`, `position: fixed; inset: 0`, shown under 900px.

1. Bar: logo, and a "Close" button in the Menu button's place.
2. Five section bricks, 8px apart, each 60px tall minimum: name (22px, weight 750) on the left and
   a hint on the right. Order and hints: Tutorials "Ten walk-throughs", Setup "Start here", Hosting
   "Proxmox, Tailscale, backups", Configuration "Every setting", FAQ "Short answers". The current
   section's brick adds " · you are here" after its name.
3. Two text links: Home, Source code.
4. Pinned to the bottom: "Theme" label, the theme toggle with words (three equal buttons, 44px
   tall), and one small line: "Free and open source. It runs on your server, so there is nothing to
   sign in to here."

Behavior: `role="dialog"`, `aria-modal="true"`, labeled "Menu". Opening moves focus to Close.
Tab is trapped inside. Escape closes. Closing returns focus to the Menu control. The page behind
does not scroll. No animation.

**The Menu control, with and without scripts.** In the HTML it is a plain link:
`<a class="menu-btn" href="#site-nav">Menu</a>`. `#site-nav` is the footer's link columns
(6.3), which hold every destination the menu does.

- **Scripts off:** tapping Menu jumps to the footer links. Nothing else is needed. The footer
  already has "Back to the top". See `state-nojs-menu-jump-390-light.png`.
- **Scripts on:** on load, the script adds `role="button"`, `aria-expanded="false"` and
  `aria-controls="menu"` to the link, cancels the jump, and opens the sheet on click, Enter or
  Space.

In Next.js, render the anchor on the server and attach the behavior in a client component, so the
link works before hydration and when scripts fail.

Mantine: `Drawer` with `position="top"`, `size="100%"`, no overlay, `trapFocus` and
`returnFocus` on.

### 6.3 Footer (`.site-footer`)

On `--field`, text `--field-ink`. Padding 48px top, 32px bottom. Margin above: `--section` on the
landing page, 48px after docs and FAQ.

1. **The wall.** Eight letter bricks spelling BRICK BIN. Each is a `.studs` block with two studs
   (pitch 50%, 8% inset), a section color, and its letter (Albert Sans 800, ink) sitting on the
   bottom edge. Colors in order: orange, green, blue, tan, pink, then blue, orange, green.
   - Under 640: two rows (five, then three), each brick one fifth of the width, height 21vw,
     letters 15vw.
   - 640 and up: one row with a gap 0.45 of a brick wide between the words. Height
     `clamp(120px, 17vw, 230px)`. Bricks 2, 4, 5, 7 and 9 (counting the gap as 6) are 72%, 80%,
     90%, 78% and 86% of full height, bottoms aligned.
   - The wall is one image to assistive technology: `role="img"`, label "Brick Bin, spelled out in
     bricks".
2. **Columns** (`id="site-nav"`, the target of the Menu link when scripts are off, with
   `scroll-margin-top: 16px`; two across on phones, five from 900): "Get it running" (Setup, Hosting,
   Configuration), "Use it" (Tutorials, FAQ), "The project" (Source code, Report a problem, MIT
   license), "Theme" (the toggle, icons), and the credit block.
3. **Credit block**, required on every page: "Catalog data comes from [Rebrickable](https://rebrickable.com/).
   You import it yourself, onto your own server. Thank you, Rebrickable." Then, in
   `--field-muted`: "Brick Bin is an independent project. It is not affiliated with, endorsed by or
   sponsored by the LEGO Group or any other brick maker. LEGO is a trademark of the LEGO Group."
4. **Base line**, above a 1px `--field-line` rule: "© 2026 Bill Parrott. Free and open source under
   the MIT license. Nothing on this site tracks you." and a small "Back to the top" button
   (`--field-2`, no studs).

Links: source `https://github.com/chimericdream/brick-bin`, issues `/issues`, license
`/blob/main/LICENSE` (check the file name). Footer links are 44px tall, not underlined, underlined
on hover.

### 6.4 Theme toggle (`.theme`)

Three buttons in a `--surface-2` track with 3px padding: **System**, **Light**, **Dark**. System is
the default.

| | Header and footer (`.theme--icons`) | Phone menu (`.theme--words`) |
| --- | --- | --- |
| Content | Icon only (monitor, sun, moon). The word is visually hidden and also the `title`. | Icon and word |
| Button size | 44 by 38px minimum | Equal thirds, 44px tall |

| State | Appearance |
| --- | --- |
| Rest | `--muted` icon and text |
| Hover | `--ink` |
| Selected (`aria-pressed="true"`) | `--ground` background, `--ink`, a 1px `--line` bottom edge |
| Focus | 3px ring |
| In the footer | Track `--field-2`. Selected: `--field-ink` background with `--field` icon. |

Behavior: no `data-theme` attribute on `<html>` means System, and the stylesheet follows
`prefers-color-scheme`. Light and Dark set `data-theme`. The choice is stored in `localStorage`
under `bb-theme` and applied by a small inline script in `<head>` before first paint. Without
script the toggle is hidden and the site follows the device.

In Mantine this is `useMantineColorScheme()` with `'auto' | 'light' | 'dark'`, `ColorSchemeScript`
in the head with `defaultColorScheme="auto"`, and a `SegmentedControl` or three `ActionIcon`s.
Mantine writes `data-mantine-color-scheme`, so key the dark tokens off that attribute.

### 6.5 Buttons (`.btn`)

48px tall minimum, 20px side padding, weight 650, 3px radius, 8px gap to an arrow.

| Variant | Fill / text | Studs | Use |
| --- | --- | --- | --- |
| Primary (`.btn.studs`) | `--btn` / `--btn-ink` | Yes: pitch 20, height 6, inset 10 | The main action in a block. One per block. |
| Start (`.btn--start.studs`) | `--brick-setup` / `--brick-ink` | Yes | Only the hero's "Read the setup guide", on the dark field |
| Quiet (`.btn--quiet`) | `--surface-2` / `--ink` | No | Secondary actions |
| Small (`.btn--small`) | as its variant | pitch 16, height 5 | Header "Set it up", footer "Back to the top". 44px tall, 14px padding, 15px text. |
| On a bright brick | `#121212` / `#F5F5F2`, both themes | Yes | Closing stack |

| State | Appearance |
| --- | --- |
| Hover | Lifts 2px. Fill goes to `--btn-hover` (primary), `#7FD45C` (start) or `--line` (quiet). An arrow slides 3px right. |
| Active | Drops 2px. Studs squash to half height. |
| Focus | 3px ring, 3px offset. `--focus` normally, `#7CC0FF` on a field, ink on a brick. |
| Disabled | Not used on the site. If needed: `--surface-2` fill, `--muted` text, no studs, no travel. |

### 6.6 Page head (`.page-head`)

Every inner page opens with one. A `.studs` block filled with `--sec`, ink text in both themes.

- Contents, top to bottom: breadcrumb (6.26), `h1`
  (`--step-head`, 16px above), then either a lede (`--step-lead`, max 34em, 16px above) or a meta
  row (tutorials: "Tutorial 2 of 10", "7 steps", "Admins only", 14px, weight 650, 24px above).
- Padding 24 / 16 / 32px under 768, and 32 / 32 / 48px above.
- On the tutorials index and FAQ it spans the content width. On docs and tutorial pages it spans
  the article column only.
- Focus rings inside it are ink.

### 6.7 Hero (`.hero`, landing only)

A `.studs` block on `--field`. One column under 960, two above (text 1.05fr, pile 1fr).

- **Text:** `h1` "Know what's in every box." (`--step-display`), lede naming the product and
  brands, a second paragraph in `--field-muted` saying where it runs and who it is for, then the
  actions: the Start button "Read the setup guide", and two text links ("See the tutorials",
  "Source code"). Padding 32 / 16px under 960, 64 / 48px above.
- **Pile panel (`.toy`):** `--field-2`, inset 8px from the hero's edges. Contents: the SVG, a note line (min-height 3.2em so the layout does not jump), the six
  state buttons, and a hint in `--field-muted`.
- **State buttons:** a `fieldset` with a hidden legend "Build state of this copy". Each button is
  44px tall, 14px, weight 650, `--field` fill, 4px side padding, `white-space: nowrap`. Selected
  (`aria-pressed="true"`): `--field-ink` fill, `--field` text. Hover lifts 2px.
- **Button layout: two rows of three, at every window width.** There is no six-across layout. The
  longest label, "Disassembled", is about 90px wide, so six in a row would need a panel about
  760px wide, and the hero never gives the panel that much (it is at most about 565px, at 1440). The
  grid follows the panel's own width with a container query on `.toy`, not the window:

  | Panel content width | Layout | Where that happens |
  | --- | --- | --- |
  | 306px and up | 3 columns, 2 rows | Windows of about 378px and wider, at every breakpoint |
  | Under 306px | 2 columns, 3 rows | Windows narrower than about 378px (360 and 320 phones) |

  At 306px each button is 98px wide, which leaves "Disassembled" 4px of air on each side. Below
  that it would touch the edges, so the grid drops to two columns instead of wrapping or shrinking
  the type. Measured in the mockups: no label wraps or clips at 320, 360, 390, 480, 640, 768, 900,
  959, 960, 1024, 1280 or 1440 (`state-build-buttons-<width>-light.png`). The tightest case is
  390px, with 11px to spare. If you add or rename a state, re-check the 306px figure.
- The panel's padding is 12px under 640 and 24px above.

**The pile.** `assets/svg/hero-pile.svg`, viewBox `-40 52 560 220`. Nine bricks in the five section
colors, two gray "strangers", a box with a lid, a tub outline and a floor line. One stud is 40 units wide and a
brick is 32 high. Each state gives every piece `[x, y, rotation]`. Pieces not in a state sit inside
the box at opacity 0.

| State | Picture | Note text |
| --- | --- | --- |
| Sealed | A closed box. No bricks. | **Sealed.** Still in the shrink-wrap. Admire from a distance. |
| Opened | The lid is tipped back and three bricks poke out. | **Opened.** The bags are out. No promises were made. |
| In progress | Seven bricks stacked, two lying beside the model. | **In progress.** Bag three of seven. The table is spoken for. |
| Built | All nine stacked: rows of 3, 3, 2 and 1. | **Built.** Done, on display, and due for dusting. |
| Disassembled | All nine loose in a tidy heap. No strangers. | **Disassembled.** Back in pieces, on purpose, and still all together. |
| Mixed | A tub outline appears, with the nine bricks and two strangers jumbled in it. | **Mixed.** No longer a set. Its parts are in the big tub with everything else. |

**Everything rests on the floor line.** The line is 2 units thick with its top edge at y=260. Brick
bottoms, the box and the outside of the tub all end at exactly y=260, in all six states. The tub's
stroke is 6 units, so its floor is drawn at y=257 and the bricks inside it rest at y=254. A loose
brick that is tilted is raised so its lowest corner stays above the line. The SVG scales as one
piece, so this holds at every width. `tools/shoot.mjs` measures it at every landing capture.

The exact coordinates are the `S` object in `assets/js/site.js`. Disassembled and Mixed must look
different: the first is still one set, the second is not. That difference is the tub and the
strangers.

Default state: Built. The note is `aria-live="polite"`. Without script the page shows Built, and the
buttons and hint are hidden. The SVG is `role="img"` with a general label, because the note carries
the meaning.

### 6.8 Section head (`.section__head`, landing)

`h2` at `--step-head` and one supporting paragraph (max 36em). Stacked under 900. Above 900, two
columns (5fr and 6fr), bottoms aligned, 48px below. An optional eyebrow sits above: a 1×1 and a
14px bold label (used once, "How self-hosting works", in Hosting blue).

### 6.9 Feature card (`.feature`)

`--surface`, 3px radius, 16px padding (24px from 640), three parts 12px apart:

1. **Chip row** (44px tall, `aria-hidden`): one or two small drawn pieces of app interface. A chip
   is a 36px-tall `--ground` pill-less rectangle, 12px padding, 16px text, weight 650. `.chip--on`
   is ink with ground text. `.chip--big` is 24px, weight 800. A dashed tag may follow.
2. `h3` at 20px.
3. One paragraph at 16px.

No hover state, because the cards are not links. Grid: one column, two from 640, three from 1024,
8px gaps. Nine cards. If the count changes, keep it a multiple of three or accept a short last row.
Do not span cards.

The chips are illustrations, not screenshots. They show labels, never invented prices or counts
beyond the brief (48 h and the dashed "× 4" are from the content pack; "p. 37 of 112" and "3 stale"
are illustrative and can be changed).

### 6.10 Copies illustration (`.copies`)

A `figure` on `--surface`. A header line (set name, "5 copies") over a 2px ink rule, then five rows:
copy number (bold), state, place (14px, muted). A caption says it is an illustration. Under 900 the
place wraps under the state. One row carries a dashed "4 missing" tag. The fifth copy is "Mixed" at
"Somewhere in the big tub".

### 6.11 Self-hosting steps (`.bond`)

An `ol` of four `.studs` bricks, 4px apart, alternating `--surface` and `--surface-2`. Each has a
large number (from a CSS counter, weight 800, `--step-lead`), an `h3` and a 16px paragraph.
Padding 16px, 24px from 900.

- Under 900: full width, stacked.
- 900 and up: each is 58% wide. Bricks 2, 3 and 4 are pushed right by 14%, 28% and 42%, so they
  overlap like a running bond.

Two short notes follow in two columns (one under 900), each starting with a bold lead-in.

### 6.12 Ledger (`.ledger`)

A list under a 2px ink rule. Each row: a name on the left, a dashed tag on the right, an optional
16px muted line beneath, and a 1px rule. 16px row padding (`.ledger--tight`: 10px).

### 6.13 Closing stack (`.stack`, landing)

Five section bricks. Four are links (FAQ, Configuration, Hosting, Tutorials, top to bottom), each at
least 60px tall: name (`--step-lead`, weight 750), a description (hidden under 768), and an arrow.
The fifth, Setup, is open: `h2` "Got a spare evening and a server?", a paragraph, and the ink
primary button "Start the setup guide". From 768 the button sits bottom right.

| State (link bricks) | Appearance |
| --- | --- |
| Hover | Lifts 4px. Arrow slides 4px. |
| Focus | 3px ink ring |

### 6.14 Screenshot placeholder (`.shot`)

A `figure` holding one frame. **Everything about a placeholder is inside the frame**, and all of it
leaves when the real image arrives.

- **Frame (`.shot__frame`):** fixed `aspect-ratio`, 1px `--line` border, 3px radius,
  `overflow: hidden`. Desktop 16:10. Phone 9:19.5, max width 280px. Crop 4:5, max width 320px.
  The frame is a size container (`container-type: size`), so its contents can never stretch it:
  the ratio holds whatever the notes say.
- **Baseplate layer (`.shot__art`):** fills the frame. It is `role="img"` with the alt text as
  `aria-label`.
- **Label (`.shot__label`)**, centered in the space above the notes, on a solid `--ground` card:
  ID in mono (14px, bold), screen name (16px, bold), then shape and theme (14px).
- **Shot notes (`.shot__notes`)**, along the bottom edge of the frame: a panel of `--ground` at 90%
  opacity (so the dots show through faintly), a 1px `--line` rule on top, 12px by 16px padding,
  14px `--muted` text. Four lines: **Screen**, **State**, **Viewport and theme**, **Focus**, with
  the labels in bold ink. These are instructions for whoever takes the screenshot. They are never
  site content, and nothing about a placeholder sits outside the frame.

The notes adapt to the frame's own size:

| Frame | Notes layout |
| --- | --- |
| 600px wide or more | Two columns: labels in a 10.5em column, text beside them |
| Narrower, and taller than 400px (phone-shaped frames, large crops) | Each label on its own line above its text |
| Narrower, and 400px tall or less (a desktop frame on a phone or beside other content) | The center label is dropped. Its ID and screen name become the first line of the notes, and each label runs into its text ("**Screen:** Set detail page."). The baseplate shows above the notes. |

If the notes are still taller than the frame, the notes panel scrolls inside the frame (it is
focusable, with a group label, so a keyboard can scroll it). In the mockups that happens in one
place only: LND-01 at 360px. Keep notes short and it will not happen.

**When the real image arrives.** Put an `img` in the frame (`object-fit: cover`, filling it) and
remove the baseplate layer, the label and the notes. Keep the frame's border and radius.

**Under a real image: one caption line.** A `figcaption`, 8px under the frame: 14px, `--muted`,
line height 1.45, as wide as the frame. It says what the picture shows, in one short sentence in
the site's voice ("One set, five copies, each with its own build state and place."). Rules:

- One sentence, about 80 characters at most, ending in a period. It may wrap to a second line on a
  phone. No "Figure 1", no "Screenshot of", no ID.
- It says what to notice, not what the reader should do. Instructions belong in the step text.
- Every placeholder has its caption written out in `PLACEHOLDERS.md` ("Caption under the real
  image"). Use those, and write new ones the same way.
- The caption is not the alt text. The `alt` (also in `PLACEHOLDERS.md`) describes the picture for
  someone who cannot see it. The caption is for someone who can.
- The shot notes are never carried over as a caption.
- A placeholder has nothing under its frame. The caption appears only with the real image.

**When the image exists in one theme only.** Show that image in both themes, unchanged, in the
same frame, and add the theme note **to the end of the same caption line, as a second sentence**:
"One set, five copies, each with its own build state and place. Shown in the light theme." (or
dark). It is not a separate line and has no different style. The frame's border is what makes a
light screenshot look deliberate on a dark page. Do not invert, dim or tint the image. A simple
build rule: look for `<name>.<current theme>.png`, fall back to the other, and append the sentence
when you fell back. With both files present, use `<picture>` or two images switched by the theme
attribute. `states.html` shows the three cases side by side: placeholder, real image with caption,
and real image in the other theme.

A phone-shaped placeholder in prose sits at the left of the column at its 280px maximum, with
nothing beside it.

### 6.15 Docs layout (`.docs`)

| Width | Columns |
| --- | --- |
| Under 1024 | One. Section navigation sits above the page head (6.16). "On this page" is a closed disclosure under the page head. |
| 1024 to 1279 | Sidebar 232px, article (max 760px). 48px gap. "On this page" stays as the disclosure. |
| 1280 and up | Sidebar 232px, article 760px, "On this page" up to 200px, spread across the content width. |

The sidebar and the right column are `position: sticky; top: 16px`. The sidebar scrolls inside
itself if it is taller than the window.

### 6.16 Docs and tutorial navigation

**Sidebar (`.sidenav`, 1024 and up).** Group labels at 14px bold ("Documentation", "Elsewhere"; on
tutorials the four group names). Links are 44px tall, 16px, weight 500, 12px padding, with a
leading marker: a 1×1 in that section's color (docs) or a two-digit number in mono (tutorials).

| State | Appearance |
| --- | --- |
| Hover | `--surface` background |
| Current (`aria-current="page"`) | `--surface-2` background, weight 750 |
| Focus | 3px ring |

**Docs tabs (`.doctabs`, under 1024).** The three docs sections as a row of three flat bricks,
4px apart, each 48px tall, 15px text, weight 650, with a 1×1 color key. Widths follow the words,
so "Configuration" is never broken. The current one is filled with its section color, weight
800, and its 1×1 turns ink. They fit at 360px.

**Tutorials disclosure (`.tutnav`, under 1024).** A `details` on `--surface`: summary "Tutorial 2
of 10 · all tutorials" with a plus (minus when open), 48px tall. Open, it shows the same grouped,
numbered list as the sidebar.

**"On this page" (`.toc`).**
- Under 1280: a `details` on `--surface`, closed by default, 48px summary, links 44px tall.
- 1280 and up: a plain list with a 14px bold heading and a 1px `--line` rule down its left. Links
  36px tall, 15px.
- The heading currently in view gets weight 750 and a 1×1 in `--sec` to its left (in the gutter on
  desktop). It also gets `aria-current="location"`. Tracking uses an `IntersectionObserver` with
  `rootMargin: 0px 0px -70% 0px`.

Mantine: `NavLink` for the sidebar, `TableOfContents` (or `useScrollSpy`) for "On this page",
native `details` or `Collapse` for the disclosures.

### 6.17 Prose (`.prose`)

Starts 48px below the page head. Blocks are 16px apart.

**One measure.** The article column is the measure: 760px at most (about 42em of body text), and
the full width between the gutters on smaller screens. **Every block in the column spans it
exactly**: paragraphs, lists, callouts, code blocks, tables, placeholders, the "What you need" box,
the "next" brick and the pager. So does the page head above it. No block sets its own
`max-width`, so left and right edges always line up.

There are two deliberate exceptions, and both are narrower for a reason you can see:

- **Nested blocks** (a code block or callout inside a list item or a numbered step) start at the
  item's indent and end at the column's right edge.
- **Phone-shaped placeholders** (280px) and crops (320px) keep their own width, at the left.

If the column is ever widened past 760px, cap paragraphs and lists at 42em and let the boxed blocks
follow the same cap. Do not let boxes run wider than the text.

- `h2`: `--step-h2`, 64px above, `scroll-margin-top: 24px`. `h3`: `--step-lead`, 32px above.
- `ul`: 1×1 bullets in `--sec`, 1.5em indent, 8px between items. `ol`: bold numerals.
- Links: ink, underlined (1.5px, offset 0.18em). Hover thickens the underline to 3px. Links are
  never a color.
- Inline `code`: mono at 0.875em, `--code-bg`, 3px radius, may break anywhere. `kbd`: `--ground`
  with a 1px `--line` border and a 3px bottom edge.
- Figures, code blocks, callouts and tables have 24px above them.
- A small muted credit line closes any page that discusses catalog data: "Catalog data comes from
  Rebrickable." with a link.

### 6.18 Code block (`.codeblock`)

`--code-bg`, 3px radius. A 44px bar with a label in mono ("Terminal", ".env") and a "Copy" button
(text, 44px tall, hover `--surface-2`, changes to "Copied" for 1.6s). Then a `pre`: 16px padding,
mono 0.875em, line height 1.6, **scrolls sideways inside itself** and never widens the page.
Comments are `--muted`. No syntax coloring. Mantine: `Code block` plus `CopyButton`.

### 6.19 Callouts (`.note`)

Flat. Never studded. 16px padding, 16px text, full column width (6.17).

| Variant | Appearance | Use |
| --- | --- | --- |
| Note (`.note`) | `--surface` fill. Title: a 1×1 in `--sec`, then bold text. | Background and reasons ("Why the copy and paste?") |
| Mind this (`.note--mind`) | No fill, 2px dashed ink border. Bold title, no 1×1. | Something that will catch you out ("Catalog images are not backed up") |

One or two per page. There is no "tip", "success" or "danger" variant.

### 6.20 Tables and the config table (`table`, `.table-stack`)

- 16px text, line height 1.45. Header row: 14px bold, 2px ink rule beneath. Body rows: 12px
  vertical padding, 1px `--line` rule. No zebra stripes, no vertical lines, no outer border.
- First column is a row header (`th scope="row"`).
- **Config tables:** the first column is the variable name in mono (14px, weight 600), and it is a
  link to itself (`<tr id="APP_PORT">`, `href="#APP_PORT"`). The second is the purpose. The third,
  "Default", is mono for literal values (`3000`, `false`, `./data`), plain text for descriptions
  ("Rebrickable's CDN", "Empty"), and a dashed tag for `Required` and `Set it`.
- A row reached by its link (`:target`) gets a `--surface` background that bleeds 8px each side.
- **Grouping.** Fourteen variables in four tables: "The ones you must set" (2: `POSTGRES_PASSWORD`,
  `TS_AUTHKEY`), "Server" (6, including `DATABASE_URL`, whose default reads "Built for you"),
  "Storage and limits" (2), "Catalog import" (4). Each has an `h2` that appears in "On this page".
  (The mockup still shows the earlier 3 and 5 split. The built site is right.)
- **Under 720px** (`.table-stack`): the header row is visually hidden and every row becomes a
  block: the name, then the purpose, then the compose note if there is one, then "Default: value"
  (the label comes from `data-label`). Blocks are separated by 1px rules, with a 2px ink rule above
  the first. Long variable names may wrap. No sideways scrolling.

**The compose note (added in the build; not in the mockups).** Most variables do not reach the app
straight from `.env`, because the compose files pass some on, set others themselves and leave some
out. A row whose variable is treated differently carries one extra line saying so.

- **Where:** inside the purpose cell, on its own line under the purpose text (a block-level
  `span`). Rows that behave as the Default column says have no note.
- **Style:** 14px, weight 400, `--muted`, line height 1.45, 4px above (6px if the rows feel
  crowded). No label, no icon, no tag, no background. The muted second line is the whole treatment.
- **Code in a note:** every literal value is `code`, as everywhere else (`true`, `3000`, `/data`,
  variable names). Inside a note, code is `font-size: 1em` (14px, so it stays on the 14px floor),
  weight 500, `color: inherit`, no background and no padding. Without this rule it inherits
  0.875em and drops to about 12px.
- **Wording rule:**
  - One or two short sentences, each ending in a period.
  - Name the files with exactly these terms and no others: "the try-out compose file", "the
    Tailscale install", "both compose files" (or "the compose files").
  - Say what the file does first, then what the reader should do, if anything.
  - Contractions, as on the rest of the site. No jokes.
  - The standard note for a variable the files leave out: "The compose files don't pass this on.
    To set it, add it to the app's environment." Repeat it word for word on every such row. Rows
    are reached one at a time by their links, so the repetition is correct.
  - Other examples: "Not used by the try-out compose file." "The Tailscale install sets it to
    `true` itself." "Always `/data` in the Docker image, on the app-data volume."
- **The Default column keeps one meaning: the app's own default.** It does not change to show what
  a compose file sets. The note carries that.

**The callout that goes with it.** A "mind this" callout (6.19) sits between the opening paragraph
and the first table, titled "Not every variable reaches the app from .env". It explains that the
compose files pass some variables on and set others, and how to set one they leave out. It must
end with these two sentences: "The Default column is the app's own default. The note under a row
says what the compose files do instead." With the page-fetch callout further down, that makes two
on the page, which is the limit.

Mantine: `Table` with borders and stripes off. The stacked layout is plain CSS on the same markup.

### 6.21 Tutorial pieces

- **What you need (`.parts`):** a `--surface` box, modeled on the parts call-out in an instruction
  booklet. An `h2` at `--step-lead`, then rows with a bold count on the left (`1 ×`, `6 GB`,
  `48 h`) and text on the right, separated by 1px rules.
- **Steps (`ol.steps`):** each step has an `h3` at `--step-lead` with a number brick before it: 40
  by 34px in `--sec`, two studs (pitch 16, height 6), the number in ink at 18px, weight 800. 48px
  between steps. From 768, the step's content is indented 52px so it lines up with the heading
  text. A step holds paragraphs, a list, a placeholder or a callout. The numbers come from a CSS
  counter on a real `ol`.
- **If something goes wrong:** a plain `h2` and a bullet list. Each item starts with the symptom in
  bold.
- **What next (`.next`):** a `.studs` brick, 64px above, full column width. A 14px bold label ("What
  next", "Next in the docs", "Questions?"), a title at `--step-h2` with an arrow, and one 16px line.
  It takes the color of where it leads. Hover lifts 4px. Focus ring is ink.
- **Pager (`.pager`):** under the "next" brick, plain links: previous on the left, "All tutorials"
  on the right.

### 6.22 Tutorials index (`.tutgroup`, `.tutlist`)

Four groups, each an `h2` (`--step-h2`) over a 2px ink rule, 48px apart. Each tutorial is one link
row with a 1px rule beneath:

- A number brick (as in steps, numbered 1 to 10 across groups), the title (`--step-lead`, weight
  750), a one-sentence summary (16px), and "N steps" (14px, muted).
- Under 900: the number sits left, and title, summary and step count stack beside it.
- 900 and up: one line. Number, title (up to 22em), summary, step count.

| State | Appearance |
| --- | --- |
| Hover | Row background `--surface`. The number brick lifts 3px. |
| Focus | 3px ring around the row |

### 6.23 FAQ (`.faq`)

Every answer is visible. No accordion. The list column is 760px at most, the same measure as the
docs, and every paragraph spans it.

- Each item is a `section` with an `id`: an `h2` (`--step-lead`, weight 750) led by a pink 1×1,
  then the short answer (first words in bold: "No.", "Not day to day.", "Nothing."), then one
  16px paragraph of reasons. 24px padding and a 1px rule between items.
- From 1024 a sticky right column holds "Jump to" (the nine questions as links, shortened where long) and "Still stuck?"
  (a primary and a quiet button). Under 1024 that column follows the list.

### 6.24 404 (`.lost`)

Two columns from 900, one below.

- **Art:** `assets/svg/wall-404.svg` on a baseplate panel with a 1px border. Four rows of bricks in
  the five colors, studs on the top row only, and one brick missing in the second row: a dashed
  ink outline with "404" inside.
- **Text:** `h1` "This piece is missing." A lede. A dashed parts line: "1 ×", "Page, color
  unknown", "Not added to your shopping list. We checked." Three buttons (one primary). One small
  muted line with the plain error.
- The normal header and footer stay.

### 6.25 Tags (`.tag`)

14px, weight 700, 3px radius. Solid: ink fill, ground text, 5px by 8px padding. Dashed
(`.tag--missing`): see 3.4.

### 6.26 Breadcrumb (`.crumbs`)

An `ol` inside `nav aria-label="Breadcrumb"`, at the top of every page head. 14px, weight 500, line
height 1.4, ink (it sits on a bright brick).

- **One baseline.** The list and each item are flex rows with `align-items: baseline`. Links are
  inline (not inline-block), so an underlined link sits on the same baseline as the plain words.
- **Separators are drawn, not typed:** a 1.5px line, 0.95em tall, slanted 18 degrees, at 55%
  opacity, with exactly 10px on each side. They are a `::before` on every item after the first, so
  spacing never depends on a typed slash or a space character.
- **Three kinds of item:** a link (underlined, offset 0.22em, thickens to 3px on hover), a plain
  step with no page of its own ("Docs"), and the current page (weight 750, not a link,
  `aria-current="page"`).
- **Tap area:** links carry 6px of vertical padding with a matching negative margin, which grows
  the target to 32px tall without moving the text. (They are inline text links, so the 44px rule
  for controls does not apply.)
- Focus ring is ink. The breadcrumb wraps onto a second line if it must.

### 6.27 Skip link and focus

`.skip` is the first element, off-screen until focused, then pinned 8px from the top left as an ink
button. Every focusable thing shows a 3px solid ring at 3px offset, with `:focus-visible`.

### 6.28 Social card (`og.png`)

Added in the build; there is no mockup. One card for the whole site, 1200 by 630, the same in both
themes. It is rendered from live type, because the lockup's wordmark is live text (section 4).

| Piece | Values |
| --- | --- |
| Background | `#F5F5F2` (the light ground) |
| Field brick | `#17191C`, 3px radius, x 48 to 1152, y 56 to 486, with a whole-stud row on top (studs flat, inset from both ends) |
| Lockup | Top left of the brick, in line with the headline's left edge (x 115): the mark with a green (`#6CC04A`) brick in a `#F5F5F2` bin, as on the favicon, then "Brick Bin" in Albert Sans 800, `#F5F5F2` |
| Headline | "Know what’s in every box." on two lines. Albert Sans 800, 100px, line height 0.96, tracking -0.04em, `#F5F5F2`, top at y=190. Curly apostrophe. |
| Descriptor | "A free, self-hosted app for your household's building-brick sets." Albert Sans 500, 30px, line height 1.3, `#B8BBBF`, max width 900px, left-aligned with the headline, top at y=406. **It must stay on one line** (it is about 884px wide and ends at y=445), which leaves about 40px of field under it. If the wording grows past 900px, shorten the wording; do not let it wrap or shrink the type. |
| Wall | Along the bottom, x 48 to 1152: the eight footer bricks in footer order (orange, green, blue, tan, pink, blue, orange, green), two studs each, varied heights, **no letters**, running off the bottom edge |

- The card has no other text, no screenshot, no URL and no tagline beyond these two lines.
- In the page head: `og:image:alt` = "Brick Bin: know what's in every box. A row of colored
  bricks." and `twitter:card` = `summary_large_image`.
- If the headline or the descriptor changes on the site, change the card to match.

## 7. Pages

Copy in the mockups is final for the landing page, FAQ and 404. Docs and tutorial text is
representative: check every command, menu name and file name against the real app (section 11).

### 7.1 Landing (`index.html`)

No section color. In this order:

1. **Hero** (6.7). What it is, the brands, who it is for, the setup call to action, the pile.
2. **Set against copy.** `h2` "A set is the design. A copy is a box you own." with a lede, beside
   the copies illustration (6.10). Two columns from 900.
3. **What it keeps track of.** Section head, nine feature cards (6.9), then one line: "Also in the
   bin: …" for CSV import, the activity trail, the trash, themes and phone layouts.
4. **One page per set, one row per box.** Section head and two placeholders: LND-01 (desktop) and
   LND-02 (phone), side by side from 768: the desktop frame takes the remaining width and the
   phone frame's column is 260px.
5. **How self-hosting works.** Eyebrow, `h2` "Four bricks, bottom to top", the four steps (6.11),
   two notes.
6. **What you won't find here.** Two columns from 900: the ledger of three (account "None",
   subscription "$0", tracking "None"), and "Not in version 1, either" with eight "Not yet" rows
   and one closing line.
7. **Closing stack** (6.13), ending on the Setup brick and its button.
8. Footer.

### 7.2 Tutorials index (`tutorials.html`)

Orange. Page head (title and lede), then four groups of rows (6.22): Getting going (First run,
Import the LEGO catalog, Add your first set), Day to day (Track several copies and change build
state, Record missing pieces and work the shopping list, Attach instructions), The household (Set
up a kid profile, Run a wishlist), Bigger jobs (Import from CSV, Check collection value). No
placeholders on this page.

### 7.3 Tutorial template (`tutorial-import-catalog.html`)

Orange. Docs layout with the tutorials sidebar. In this order: page head with meta, "On this
page", **The goal** (one lede sentence starting "By the end,", one paragraph), **What you need**
(6.21), **Steps** (numbered, with a placeholder wherever the screen changes), **If something goes
wrong**, the "What next" brick, the pager, the Rebrickable credit if catalog data is discussed.

Every tutorial uses these same five headings, so "On this page" is always the same five links.

### 7.4 Setup, Hosting, Configuration

Green, blue, tan. Docs layout with the docs sidebar. Page head with a lede, "On this page", prose.

- **Setup:** Before you start; Quick try-out, without Tailscale; Recommended install, with
  Tailscale; First visit (placeholder SET-01); Import the catalog; Staying up to date. Ends with a
  blue "next" brick to Hosting.
- **Hosting:** What runs (table of four containers); Storage (table); Backups (list and a "mind
  this" callout); Restoring (numbered); Running without Tailscale; What it downloads, and when.
  Ends with a tan "next" brick to Configuration.
- **Configuration:** one paragraph, a "mind this" callout about how the compose files treat the
  variables, then the four tables with their compose notes (6.20), a "mind this" callout about the
  page fetch, "A typical .env", and a pink "next" brick to the FAQ.

### 7.5 FAQ and 404

See 6.23 and 6.24. The FAQ is pink. The nine questions, in order: Is this a LEGO app? Does it need
the internet? Where does the catalog come from? Why do I have to wait 48 hours between imports from
Rebrickable? Can my kids see prices? Can I run it without
Tailscale? How do I back it up? Can I track loose bricks? What does it cost?

### 7.6 Heading order

One `h1` per page. Landing: `h1`, then an `h2` per section, `h3` in cards and steps. Docs: `h1` in
the page head, `h2` per section, `h3` for steps. Sidebar, "On this page" and footer group labels are
`h2`s inside their own `nav` landmarks.

## 8. Accessibility

- **Contrast:** all text is at least 6.2:1 (section 2.3). The focus ring is at least 4.4:1 against
  whatever it sits on.
- **Color is never the only cue.** Current nav item: weight 800 plus the plate. Current sidebar
  item: tone step plus weight. Current tab: fill plus weight. Current heading: weight plus marker.
  Tags and callouts that mean "missing" use a dashed shape and say so in words.
- **Landmarks:** `header`, `nav` (each with its own label: "Main", "Documentation", "Tutorials",
  "On this page", and the footer groups), `main`, `aside`, `footer`. A skip link first.
- **Current page:** `aria-current="page"` in the header, sidebar, tabs, phone menu and breadcrumb.
  `aria-current="location"` on the current "On this page" link.
- **Controls:** theme buttons and build-state buttons use `aria-pressed`. The Menu button uses
  `aria-expanded` and `aria-controls`. Disclosures are native `details`.
- **Phone menu:** a modal dialog with a focus trap, Escape to close, and focus returned.
- **Tap targets:** 44px minimum, 48px for primary actions and the Menu button.
- **Decoration:** the pile, the chips and the 1×1s are `aria-hidden` or carry one summary label.
  The footer wall is one image with a label.
- **Placeholders** are `role="img"` with their alt text. Real images take the same text as `alt`.
- **Tables:** real `table` markup with `scope`. When stacked on phones the header cells are
  visually hidden, not removed, and each value is labeled.
- **Zoom and reflow:** no horizontal page scroll at 360px or above (checked by script at every
  capture). Code blocks scroll inside themselves. Type is in `rem`, so it follows the reader's
  setting.
- **Without script:** every page reads in full. The theme follows the device and the toggle is
  hidden. The pile shows Built. "On this page" works as plain links. The Menu control is a link
  that jumps to the footer navigation (6.2).
- **Reduced motion:** see 2.8.

## 9. Voice and tone

The site sounds like someone who has sorted a lot of bricks and run a small server for years:
plain, exact, and a little dry.

### Rules

1. **Say the fact first.** If there is a joke, it comes after, and the sentence still works with
   the joke deleted.
2. **One light touch per screen at most.** None in the configuration tables, none in error steps.
3. **Numbers beat adjectives.** 48 hours, about 6 GB, port 3000, five minutes, fourteen variables.
4. **Name real things.** Boxes, tubs, the hall closet, the living-room shelf, the store aisle, the
   coffee pot.
5. **Say what is not there, plainly.** "Not yet." "No." "Nothing." "None." Never "coming soon".
6. **"You" is the person reading, usually the admin. "We" is the project.** Kids are "kids".
7. **No exclamation marks.** No "simply", "just", "easy", "seamlessly", "powerful", "unlock".
   No strings of three adjectives. No "it's not X, it's Y".
8. **Say "building-brick sets"**, or "sets". Say "LEGO" only for the Rebrickable LEGO catalog, the
   brand list and the non-affiliation note.
9. **Credit Rebrickable, with a link, wherever catalog data comes up.**
10. **FAQ answers start with the answer**, in bold, in one to three words where possible.
11. **US spelling**: color, license, gray, center, labeled, catalog. US words too: "store" for
    a shop, "closet" for a cupboard, "check off" for tick. Brand names keep their own spelling
    ("Mould King").
12. **Sentence case** for every heading, button and label. Buttons are verbs: "Read the setup
    guide", "Report a problem".

### Examples

| Where | Do | Don't |
| --- | --- | --- |
| Hero | "Know what's in every box." | "The ultimate brick collection manager!" |
| Feature | "Read-only, with no prices and no shopping list." | "Powerful, flexible, kid-safe profiles." |
| Limit | "An import can run at most once every 48 hours." | "Please note that imports are rate-limited." |
| Not in v1 | "Can I track loose bricks? **Not yet.**" | "Loose-brick tracking is on our exciting roadmap." |
| Wit, after the fact | "Postgres is never auto-updated, because databases deserve a human in the room." | "Because databases deserve a human in the room, we…" |
| Wit, small | "Not added to your shopping list. We checked." | "Oopsie! This brick rolled under the sofa!" |
| Step | "Paste into the box and press **Check**." | "Now simply paste your HTML and you're good to go." |
| Honesty | "You do supply the server, the disk and the bricks." | "Completely free forever!" |
| Docs aside | "For now, you are the fetch." | A paragraph apologising for the inconvenience. |

### Stock lines to reuse

- Catalog credit: "Catalog data comes from Rebrickable."
- Non-affiliation: the footer sentence in 6.3, word for word.
- The six build-state notes in 6.7. "Mixed" always means the copy is no longer a coherent set and
  its parts are in with everything else.
- Empty states, should the site need any: state what is missing and the one thing to do next. For
  example, a search with no results: "Nothing in the docs matches that. The FAQ is short enough to
  read whole."

## 10. Screenshots in this package

All in `screenshots/`, taken with one headless browser, one at a time, at 1x. `tools/shoot.mjs`
holds the list.

| Pattern | What |
| --- | --- |
| `<page>-390-light.png`, `-390-dark.png`, `-1440-light.png`, `-1440-dark.png` | Every page, full height, phone and desktop, both themes. Pages: `landing`, `tutorials`, `tutorial`, `docs-setup`, `docs-hosting`, `docs-configuration`, `faq`, `404`, `states`. |
| `landing-360-light`, `-768-`, `-1024-`; `docs-configuration-360-`, `-768-`, `-1024-`; `docs-setup-768-`, `-1024-`; `tutorial-768-`; `tutorials-768-` | The in-between widths |
| `state-menu-open-390-light`, `-dark` | Phone menu |
| `state-nojs-header-390-light`, `state-nojs-menu-jump-390-light` | Scripts off: the header, and where the Menu link lands (the footer navigation) |
| `state-build-buttons-<width>-light` (320 to 1440, twelve widths) | The build-state buttons at each width where they used to get tight |
| `state-docs-nav-phone-390-*` | Docs tabs with "On this page" open |
| `state-tutorial-nav-phone-390-*` | Tutorials disclosure open |
| `state-docs-nav-tablet-768-light`, `state-docs-nav-1024-light`, `state-docs-nav-desktop-1440-*` | Docs navigation at each layout. The 1440 shots are scrolled, to show the sticky columns and the tracked heading. |
| `state-hero-<state>-1440-*`, `state-hero-mixed-390-light` | The six build states |
| `state-theme-toggle-system-light-device`, `-system-dark-device`, `-light`, `-dark` | Header crops: System on a light device, System on a dark device, Light forced on a dark device, Dark forced on a light device |
| `state-hover-primary-button-`, `state-hover-tutorial-row-`, `state-hover-stack-brick-` | Real pointer hover |
| `state-focus-keyboard-1440-light`, `state-focus-docs-nav-1440-dark` | Real keyboard focus |
| `state-config-row-target-1440-light` | A config row reached by its link |
| `states-*` | The states sheet: every hover, focus, active and current state side by side |

## 11. Check against the real app

The brief allows representative docs text. These are guesses:

- Menu paths and button names: "Settings, then Catalog", "Check", "Import", "Add a set".
- Commands: `docker compose up -d`, passing `POSTGRES_PASSWORD` inline for the try-out, the
  `.env.example` file name, and the `DATABASE_URL` format in "A typical .env". If the production
  compose file builds `DATABASE_URL` itself, remove that line and say so under "The ones you must
  set".
- That the Catalog page shows when the next import is allowed.
- The restore order on the Hosting page.
- The step counts on the tutorials index (4, 7, 6, 5, 7, 4, 5, 6, 6, 4).
- Kid profiles "covered by tests": from the content pack. Keep it true.
- The license link path (`/blob/main/LICENSE`).
- Rebrickable's downloads page address (`https://rebrickable.com/downloads/`).

Confirmed by the project owner, so not on this list: the FAQ answer about the 48-hour wait,
including both sentences quoted from Rebrickable's downloads page. If Rebrickable changes that
wording, update the quotes.

## 12. Deliberately flexible

You may change these without asking:

- Class names, file structure, and how components are split.
- Which Mantine components sit underneath, as long as the states in section 6 hold.
- Exact wording of docs and tutorial body text (keep the voice in section 9).
- The feature-card chips: redraw, simplify or replace them with tight real crops later.
- The hero pile's exact coordinates, as long as six states stay distinguishable and Disassembled
  differs from Mixed by the tub and the strangers.
- The heights of the footer wall's bricks, and the wall's two-row break point.
- 650 and 750 weights (round to 600 and 700).
- Adding a search field to the docs sidebar later. Give it a `--ground` fill, a 1px `--line`
  border, a 3px radius and a 48px height.
- Adding a sticky header, if testing shows people want it. Keep it 72px and flat.
- The number of tutorials and config variables. The layouts take more rows.
- The 720 and 960 breakpoints, by a few tens of pixels either way.
- The article measure, by a few tens of pixels either way from 760px, as long as every block still
  shares it.

Please do not change these without asking:

- Which color belongs to which section, and the rule that brick colors mean sections.
- The four motif meanings in section 3, and where studs must not appear.
- Albert Sans for text, sentence case, and the 14px floor.
- No shadows, one 3px radius, no gradients.
- The FAQ staying fully open, and the config table's grouping and stacked phone layout.
- Shot notes staying inside the placeholder frame, and one short caption line under a real image.
- Build-state labels never wrapping.
- The Rebrickable credit and the non-affiliation note in the footer of every page.
- Nothing loading from a third party: no font service, no analytics, no embeds.
