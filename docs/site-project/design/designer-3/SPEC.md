# Brick Bin site: developer handoff (final design)

This is the implementation spec for `brick-bin.app`, the marketing and documentation site. It is
written so you can build the site without asking anything. Where a value is given, use it exactly.
Where something is deliberately open, §10 says so.

The mockups are the visual reference; this file is the rule book. If they disagree, this file wins,
and please tell the PM so I can fix the mockup.

## Contents

1. Package and how to read it
2. Concept in one paragraph
3. Tokens
4. The brick-motif system
5. Layout and breakpoints
6. Component inventory
7. Page-by-page layout and content
8. Accessibility and reduced motion
9. Voice and tone
10. What is flexible
11. Content to check against the real app
12. Building it with Next.js, Mantine and Netlify

---

## 1. Package and how to read it

| Path | What it is |
| --- | --- |
| `SPEC.md` | This file |
| `EVALUATION.md` | How designs A and B were judged, and what was kept from each, with reasons |
| `PLACEHOLDERS.md` | Every screenshot placeholder: ID, file name, caption, alt text, capture rules |
| `mockups/*.html` | Static mockups. Open by double-clicking. `states.html` is a reference sheet, not a site page |
| `mockups/assets/css/site.css` | One stylesheet. Section 1 of it holds every token; the rest is components in the order of §6 |
| `mockups/assets/js/site.js` | Theme toggle, phone menu, docs bar, copy buttons, scroll spy. About 120 lines |
| `mockups/assets/svg/` | Logo, motif and icon SVGs, one file each (§3.8) |
| `mockups/assets/fonts/` | Albert Sans and JetBrains Mono variable WOFF2 files with their OFL licence texts |
| `screenshots/` | PNGs of every page and state (§1.1) |
| `tools/build_pages.py` | Stamps the shared header, menu, docs navigation and footer around each page body in `tools/pages/`. Only needed to edit the mockups |
| `tools/shoot.mjs` | Takes the screenshots with one headless Edge over the DevTools protocol |

Mockup-only things you should **not** ship: the `.is-hover`, `.is-focus`, `.is-active` classes (they
force states for `states.html`), the `?theme=`, `?menu=open`, `?docs=open`, `?toc=open` URL
parameters, and the `#not-mocked` links (pages that weren't drawn).

### 1.1 Screenshots

File names are `<page>-<width>-<theme>.png`. Full pages at 390 and 1440 in light and dark for every
page; the landing page and the Configuration page also at 360, 768 and 1024; the tutorial at 768;
Setup at 1024. State shots are `state-*.png`:

| File | Shows |
| --- | --- |
| `state-menu-open-390-light/dark` | Phone menu open |
| `state-docs-nav-open-390-light/dark` | Phone docs bar opened on the Hosting page |
| `state-on-this-page-open-390-light` | Phone "On this page" disclosure opened |
| `state-docs-nav-desktop-1440-light/dark` | Desktop docs: sidebar with current page, "On this page" tracking a section |
| `state-header-1440-light/dark` | Header with Docs as current page and the theme toggle |
| `state-build-state-mixed-390-light`, `state-build-state-sealed-1440-dark` | The live build-state menu in two states |
| `state-tutorial-row-hover-1440-light` | Tutorial row hover (real pointer hover) |
| `state-stack-hover-1440-light` | Landing stack brick hover |
| `state-focus-tab-1440-light` | Keyboard focus ring on a header link after three Tab presses |
| `states-390/1440-light/dark` | The full states sheet: every button, link, nav, toggle, row and menu state |

---

## 2. Concept in one paragraph

**Sorted by colour.** Anyone with a big tub of bricks ends up sorting it by colour, and then finds a
part by going to the right pile. The site works the same way: each section is a brick of its own
colour (Tutorials orange, Setup green, Hosting azure, Configuration tan, FAQ lavender), and you find
your way by colour. Everything around the bricks is a calm, nearly colourless workshop: off-white or
charcoal ground, black or off-white ink, one typeface. One shape does the work: **a brick seen from
the side**, with whole studs along its top edge. It replaces the generic rounded rectangle wherever
something can be pressed or stands for a thing (a page, a step, a screenshot). A second view, the
**baseplate seen from above**, means "something will go here" and appears only behind screenshot
placeholders and the 404. A **dashed outline** means "a piece is missing".

---

## 3. Tokens

Name the CSS variables exactly as below (`--bb-*`) so the mockup CSS can be ported with search and
replace. Source of truth: section 1 of `mockups/assets/css/site.css`.

### 3.1 Colour: the room (changes with theme)

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--bb-ground` | `#F5F5F1` | `#141517` | Page background (`body` must set it explicitly) |
| `--bb-surface` | `#EAEAE4` | `#1E2023` | Cards, callouts, parts box, tutorial rows, placeholder ground, plate band, phone docs bar |
| `--bb-surface-2` | `#DDDDD6` | `#2A2D31` | Quiet buttons, hover on rows, selected build state |
| `--bb-line` | `#CFCFC7` | `#34373C` | 1px rules: header bottom, table rows, placeholder frame, pager borders. Decorative only |
| `--bb-line-strong` | `#76766F` | `#8B8F94` | `kbd` border, header link hover plate. 3:1+ on ground |
| `--bb-ink` | `#121212` | `#EEEEE8` | All running text, headings, table header rule, "mind this" dashes |
| `--bb-muted` | `#4A4A45` | `#AEB1B5` | Secondary text only (captions, meta, "On this page" rest state). Never body copy |
| `--bb-code-bg` | `#E4E4DD` | `#202326` | Inline code, code blocks, variable names in tables |
| `--bb-focus` | `#0B5FC4` | `#7CC0FF` | Focus ring on the room |
| `--bb-btn` / `--bb-btn-ink` | `#121212` / `#F5F5F1` | `#EEEEE8` / `#121212` | Primary button fill / text |
| `--bb-btn-hover` | `#34342F` | `#FFFFFF` | Primary button hover fill |
| `--bb-scrim` | `rgb(18 18 18 / .45)` | `rgb(0 0 0 / .6)` | Behind the phone menu |
| `--bb-dot` | `rgb(18 18 18 / .10)` | `rgb(238 238 232 / .09)` | Baseplate dots |
| `--bb-wall-1` / `--bb-wall-2` | `#C4C4BB` / `#A9A9A0` | `#3D4146` / `#50555B` | 404 wall bricks (neutral, no section) |

**Fields** (dark in both themes: footer and the build-state showcase):

| Token | Light theme | Dark theme | Use |
| --- | --- | --- | --- |
| `--bb-field` | `#17191C` | `#0C0D0E` | Field background |
| `--bb-field-2` | `#24272B` | `#1A1C1F` | Controls on a field (quiet button, toggle track) |
| `--bb-field-3` | `#2F3338` | `#26292D` | Hover on field controls, field rules |
| `--bb-field-ink` | `#F5F5F1` | `#EEEEE8` | Text on a field |
| `--bb-field-muted` | `#B9BCC0` | `#B9BCC0` | Secondary text on a field |
| `--bb-field-focus` | `#7CC0FF` | `#7CC0FF` | Focus ring on a field |

### 3.2 Colour: the bricks (colour = section; identical in both themes)

| Token | Value | Section | Black text on it |
| --- | --- | --- | --- |
| `--bb-tutorials` | `#F39237` | Tutorials (index, every tutorial) | 8.0:1 |
| `--bb-setup` | `#74C05A` | Setup, and the closing "start here" call to action | 8.4:1 |
| `--bb-hosting` | `#58B4E2` | Hosting, and "How self-hosting works" on the landing page | 8.1:1 |
| `--bb-config` | `#D9C08F` | Configuration | 10.6:1 |
| `--bb-faq` | `#B9A7EA` | FAQ | 8.7:1 |
| `--bb-brick-ink` | `#121212` | Text and icons on any brick, both themes | |
| `--bb-brick-focus` | `#121212` | Focus ring on any brick (8:1+ on every brick) | |

Part colours, used only when the site draws a specific part: `--bb-part-dark-tan #958A73`,
`--bb-part-reddish-brown #82422A`.

Text selection: `--bb-hosting` background, `#121212` text.

**Scoping.** Set `data-section="tutorials|setup|hosting|config|faq|none"` on a page's main wrapper
(or on any element). It sets `--bb-brick` for that subtree, and every brick component reads
`--bb-brick`. `none` maps to `--bb-surface-2`.

**Contrast (computed, WCAG 2.x):** ink on ground 17.1:1 (dark 15.7:1); ink on surface 15.5:1 (dark
14.0:1); muted on ground 8.2:1 (dark 8.5:1); muted on surface-2 6.5:1 (dark 6.4:1); field ink on
field 16.1:1; field muted on field 9.2:1; focus ring on ground 5.6:1 (dark 9.4:1), on surface 5.0:1.
Bricks on the light ground are about 2:1, which is fine because a brick is never the only boundary
of a control: every brick that is a control carries its text label in `#121212` at 8:1+.

### 3.3 Type

| Font | Files | Licence | Weights used | Use |
| --- | --- | --- | --- | --- |
| **Albert Sans** (The Albert Sans Project Authors) | `AlbertSans-Variable.woff2` (variable, wght 100–900, Latin subset, 32 KB) | SIL Open Font License 1.1 (`AlbertSans-OFL.txt`) | 400, 500, 550, 600, 650, 700, 750, 780, 800 | Everything |
| **JetBrains Mono** (The JetBrains Mono Project Authors) | `JetBrainsMono-Variable.woff2` (variable, 40 KB) | SIL Open Font License 1.1 (`JetBrainsMono-OFL.txt`) | 400, 600 | Code, variable names, file names, keys |

Both files are in `mockups/assets/fonts/`. Use them as they are, or download fresh copies:
Albert Sans from the Google Fonts repository (`github.com/google/fonts`, folder `ofl/albertsans`)
or Fontsource (`@fontsource-variable/albert-sans`); JetBrains Mono from
`github.com/JetBrains/JetBrainsMono` (releases) or `@fontsource-variable/jetbrains-mono`. Self-host
with `next/font/local`. Never load from Google Fonts or any CDN at runtime. Subset to Latin plus
Latin-1 Supplement and the arrows and symbols used (`→ ← ↑ × ✓ ⌥ ⌘ ·`).

Fallbacks: `"Albert Sans", "Segoe UI", system-ui, sans-serif` and
`"JetBrains Mono", ui-monospace, "Cascadia Mono", Menlo, Consolas, monospace`.

**Scale** (fluid between 360 and 1440):

| Token | Value | px 360 → 1440 | Use |
| --- | --- | --- | --- |
| `--bb-step-small` | `0.9375rem` | 15 | Captions, meta, breadcrumbs, footer about text, "On this page" |
| `--bb-step-body` | `clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)` | 17 → 19 | Running text (`body`) |
| `--bb-step-lead` | `clamp(1.25rem, 1.12rem + 0.55vw, 1.5rem)` | 20 → 24 | Ledes, hero lede, page-head lede |
| `--bb-step-h3` | `clamp(1.1875rem, 1.12rem + 0.3vw, 1.375rem)` | 19 → 22 | h3, step titles, card titles, FAQ questions |
| `--bb-step-h2` | `clamp(1.5rem, 1.3rem + 0.9vw, 2.125rem)` | 24 → 34 | Docs h2, plate heading, "What next" title |
| `--bb-step-head` | `clamp(2.25rem, 1.55rem + 3vw, 4.25rem)` | 36 → 68 | Page h1 in page heads, landing section titles, 404 h1 |
| `--bb-step-display` | `clamp(2.75rem, 1.5rem + 5.4vw, 6rem)` | 44 → 96 | Landing h1 only |

Fixed sizes used in components: `1rem` (16) for card text, table text, button text, callout text;
`0.875rem` (14) for code in tables and code blocks, table headers, pager labels; `0.8125rem` (13) for
tags only (always bold).

| Role | Weight | Tracking | Line height | Case |
| --- | --- | --- | --- | --- |
| Landing h1 | 800 | -0.04em | 0.96 | Sentence case |
| Page h1, section titles | 780–800 | -0.035em | 1.0 | Sentence case |
| h2 (docs) | 750 | -0.03em | 1.08 | Sentence case |
| h3, step titles, card titles | 700 | -0.02em | 1.08 | Sentence case |
| Body | 400; `b`/`strong` 700; FAQ short answer 750 | 0 | 1.55 | Sentence case |
| Buttons | 650 | 0 | 1.2 | Sentence case |
| Header nav | 600 (current 700) | 0 | | Sentence case |
| Tags ("Required", "Start here") | 700–750 | 0.01em | | Sentence case |

No uppercase anywhere. No letter-spaced small caps. Headings use `text-wrap: balance`, paragraphs
`text-wrap: pretty`. Measure: prose max `44rem` (about 70 characters); ledes max 34–38ch.
Numbers that line up (parts box counts) use `font-variant-numeric: tabular-nums`.

### 3.4 Space

4px base, 8px rhythm.

| Token | px | | Token | px |
| --- | --- | --- | --- | --- |
| `--bb-s1` | 4 | | `--bb-s6` | 32 |
| `--bb-s2` | 8 | | `--bb-s7` | 48 |
| `--bb-s3` | 12 | | `--bb-s8` | 64 |
| `--bb-s4` | 16 | | `--bb-s9` | 96 |
| `--bb-s5` | 24 | | `--bb-s10` | 128 |

| Layout token | < 768 | 768–991 | ≥ 992 |
| --- | --- | --- | --- |
| `--bb-gutter` (page side margin) | 16 | 24 | 32 |
| `--bb-section` (vertical padding of a landing section) | 80 | 112 | 144 |
| `--bb-max` (content width, gutters excluded) | 1312 | 1312 | 1312 |
| `--bb-prose` | 44rem | 44rem | 44rem |
| `--bb-header-h` | 64 | 64 | 64 |

### 3.5 Shape

| Token | Value | Use |
| --- | --- | --- |
| `--bb-radius` | `3px` | Everything: buttons, bricks, cards, frames, inputs. Small chips and tags use `2px`. Nothing is rounder, no pills (the toggle switch drawn in the wishlist card is the one exception, because it depicts a real switch) |
| `--bb-stud` | SVG mask: a `12 × 6` rounded rect centred in a `20 × 6` tile (`assets/svg/stud.svg`) | Stud width is 0.6 of the pitch, the real ratio of a brick |
| `--bb-b1` | SVG mask of a 1×1 brick in profile (`assets/svg/brick-1x1.svg`) | Text-size glyph |

### 3.6 Shadow

One shadow, only for things that float above the page: the phone menu panel, the phone docs panel
and the build-state menu card.

`--bb-shadow-float: 0 18px 48px rgb(0 0 0 / .28), 0 2px 6px rgb(0 0 0 / .18)`

Nothing at rest has a shadow. Surfaces are separated by tone, not lines or shadows.

### 3.7 Motion

| Token | Value | Use |
| --- | --- | --- |
| `--bb-ease` | `cubic-bezier(.2, .7, .2, 1)` | Everything |
| `--bb-t-fast` | `120ms` | Button hover and press, studs rising, arrows, row lift, nav plate |
| `--bb-t-med` | `240ms` | Stack brick lift |

| Movement | Distance |
| --- | --- |
| Primary button hover | studs rise 2px |
| Any button pressed | button drops 2px (the brick is seated); studs stay with it |
| Arrow in a button or arrow link, on hover | moves 3px right |
| Landing stack brick hover / pressed | lifts 4px / drops 1px; arrow moves 4px |
| Tutorial row hover / pressed | lifts 2px / drops 1px |
| "What next" brick hover / pressed | lifts 3px / drops 1px |
| Header link hover / current | a 4px plate under the word scales in from 0 |

Transforms and colours only. Nothing loops, nothing is scroll-linked, no entrance animations.
`prefers-reduced-motion: reduce` removes every movement (§8.2); colour and height changes stay
but finish in 1ms.

### 3.8 Assets (`mockups/assets/svg/`)

| File | What | Notes |
| --- | --- | --- |
| `logo-mark.svg` | The mark: a 1×2 brick in profile with a label window, like the front of a parts drawer (brick + bin) | `currentColor`. Min 16px tall. viewBox `0 0 96 70` |
| `logo-wordmark.svg` | Drawn lowercase "brick bin"; the dots of the i's are studs | `currentColor`. Not a font: never retype it |
| `logo-lockup.svg` | Mark + wordmark | Header: wordmark 26px tall, mark 28px, gap 10px |
| `favicon.svg` | The mark, ink in light, off-white in dark (media query inside) | Also export 32px and 180px PNGs for `apple-touch-icon` |
| `stud.svg` | One stud pitch, the CSS mask tile | Use as `mask` with `mask-repeat: round` |
| `brick-1x1.svg` | Text-size 1×1 glyph | Bullets, chips, markers |
| `brick-1x2.svg` | 1×2 brick at true proportions | Reference for the "part" chip |
| `missing-piece.svg` | Dashed outline of a 1×2 brick | "A piece is missing" |
| `baseplate-dot.svg` | One baseplate module (10px dot, 22px grid) | Reference; the CSS uses a radial gradient |
| `plate.svg` | Reference drawing of the plate band | The CSS builds it from the stud mask |
| `icon-system.svg`, `icon-light.svg`, `icon-dark.svg` | Theme toggle icons | 24px, 2px stroke, `currentColor` |
| `icon-menu.svg`, `icon-close.svg`, `icon-chevron.svg` | Menu, close, disclosure chevron | Same style. Tabler Icons (MIT, self-hosted via the npm package) are an acceptable substitute if you prefer a set; keep 2px strokes |

No logo or icon is ever loaded from a third party.

---

## 4. The brick-motif system

### 4.1 The elements

| # | Element | What it is | Built with |
| --- | --- | --- | --- |
| M1 | **Stud row** | Whole studs along the top edge of a block, in the block's colour | `::before` on the block: `position:absolute; bottom:100%; left/right: var(--stud-inset); height: var(--stud-h); background: var(--bb-brick); mask: var(--bb-stud) left bottom / var(--pitch) 100% round no-repeat`. The block needs `margin-top` ≥ `--stud-h` so studs never touch what's above |
| M2 | **1×1 glyph** | A one-stud brick at text size (0.8em) | An inline element masked with `--bb-b1`, coloured by `--chip` or `--bb-brick` |
| M3 | **Section brick** | A block in a section colour with black text and a stud row | M1 on a block with `background: var(--bb-brick)` |
| M4 | **Plate** | A full-width flat band with a stud row | M1 on a full-bleed band in `--bb-surface` |
| M5 | **Wall** | Several bricks side by side or stacked | Flex rows of M3 |
| M6 | **Baseplate** | Studs seen from above: a dot grid | `radial-gradient(circle, var(--bb-dot) 0 5px, transparent 5.5px)` at `22px 22px` on `--bb-surface` |
| M7 | **Missing piece** | A brick drawn as a 2px dashed outline in `--bb-ink` | `outline: 2px dashed var(--bb-ink); outline-offset: -2px` or `missing-piece.svg` |

### 4.2 Stud sizes

| Scale | Pitch | Stud height | Inset | Where |
| --- | --- | --- | --- | --- |
| Text | 1 stud on a 0.8em glyph | | | M2 everywhere |
| Small component | 8px | 3px | 0 | (Reserved; header plate is a flat bar, no studs) |
| Component | 16–22px | 5–6px | 8–14px | Buttons (18 / 5 / 12, two studs only), docs current item (16 / 5 / 8), callouts (18 / 5 / 12), parts box (20 / 6 / 12), tutorial rows (20 / 6 / 14), phone-menu bricks (22 / 6 / 10), part chip (16 / 6 / 6) |
| Large component | 28–40px | 8–11px | 12–16px | Landing stack (30 / 8 / 12), "What next" (28 / 8 / 14), bond bricks (28 / 8 / 12), page head (32 / 9 / 14 on phones; 40 / 11 / 14 from 768), CTA (40 / 11 / 16), plate band (28 / 8 / 0) |
| Architecture | `clamp(14px, 2.4vw, 34px)` | `clamp(5px, .8vw, 10px)` | 10% | Footer wall; 404 wall uses `clamp(14px, 2vw, 24px)` / `clamp(5px, .7vw, 7px)` / 8% |

One component uses one stud scale. Studs are always whole (`mask-repeat: round`).

### 4.3 Where each element appears

| Element | Appears on | Rule |
| --- | --- | --- |
| M1 on primary buttons | Every primary button | Always exactly **two** studs at the left (`width: 36px` on the `::before`) |
| M1 on quiet buttons, tutorial rows | Quiet buttons, tutorial index rows | Height 0 at rest; studs **rise** on hover and keyboard focus |
| M2 | Bullets in prose lists, docs sidebar chips, "On this page" current item, tutorial group headings, FAQ aside lists, "What you won't find here" items, phone docs bar | Always next to words, never alone |
| M3 page head | The top of every inner page (Tutorials, tutorial pages, Setup, Hosting, Configuration, FAQ) | One per page, in the page's section colour |
| M3 current docs item | Docs sidebar and phone docs panel | The current page's item becomes a brick in its colour with studs |
| M3 "What next" | Bottom of docs and tutorial pages | Coloured by the **destination** section |
| M3 step numbers | Step lists (`ol.steps`) | 44 × 38 block in the page's section colour, two studs, black numeral |
| M3 stack | Landing hero | Five bricks, one per section, in the fixed order FAQ, Configuration, Hosting, Tutorials, Setup (Setup at the bottom: the foundation, "Start here") |
| M3 bond | Landing "How self-hosting works" | Four Hosting bricks in running bond |
| M3 CTA | Landing closing call to action | One Setup brick |
| M3 phone menu | Phone menu | Five section bricks |
| M4 plate | Landing "What you won't find here" | The only plate band on the site |
| M5 footer wall | Footer on every page | B R I C K / B I N, letters on bricks in the section colours |
| M5 404 wall | 404 page | Neutral wall bricks with one M7 gap |
| M6 baseplate | Behind empty screenshot placeholders; behind the 404 wall | Disappears when a real screenshot replaces the placeholder |
| M7 missing piece | 404 gap; missing-pieces feature chip; "mind this" callouts (as the callout border) | Always ink, never coloured, never filled |

### 4.4 Where the motif must never appear

- Behind running text. Text sits on a flat ground or a flat brick face, never on M6 or a pattern.
  Placeholder labels sit on a flat `--bb-ground` chip above the dots.
- Inside tables, code blocks, form fields or the body of the docs reading column (except M2
  bullets and M3 step numbers).
- As decoration with no job: no scattered, tilted or floating bricks, no stud confetti, no brick
  borders around paragraphs.
- Printed: nothing on a stud (no letters, logos or marks), no stud-logo imitation, no minifigure
  shapes, no red-and-yellow pairing.
- More than one architecture element (stack, plate, CTA brick, footer wall, 404 wall) in one viewport
  at 1440 × 900, except the footer wall, which may share a screen with the CTA.

### 4.5 Colour rules

1. A section colour means that section. Use it only for: that section's page head, its current docs
   item, its sidebar chip, its step numbers and bullets, a "What next" brick pointing to it, its
   brick in the stack, menu and footer wall, and its row markers.
2. Things that belong to no section are neutral (`--bb-surface`, `--bb-surface-2`, `--bb-wall-*`):
   feature cards, placeholders, the plate band, the 404 wall, quiet buttons.
3. All five colours appear together only in the hero stack, the phone menu and the footer wall.
4. Part colours appear only when a specific part is drawn.
5. Bricks never change colour with the theme. The room changes around them.
6. Colour is never the only signal: every coloured item has a text label.

### 4.6 Behaviour at each breakpoint

| Element | < 576 | 576–767 | 768–991 | ≥ 992 |
| --- | --- | --- | --- | --- |
| Hero stack | Full-width bricks, name and arrow only, 64px tall (Setup 88px) | Description appears under the name | Same | Two-column hero; bricks alternate a 32px indent (odd: right margin, even: left margin) for a running-bond stack |
| Page head | Studs 32 / 9, padding 32 × 24 | Same | Studs 40 / 11, padding 48 | Same |
| Bond list | Stacked, full width | Same | Same | Each brick 62% wide, stepping right 12.6% per row |
| Footer wall | Two rows: BRICK (five bricks), BIN (three bricks, same width as above, left-aligned) | Same | One row, 4% gap between the words | Same; letters up to 104px |
| 404 wall | Below the text | Same | Same | Right column beside the text |

---

## 5. Layout and breakpoints

Mobile first. Breakpoints match Mantine's defaults, so use Mantine's `theme.breakpoints` and
`em()` media queries.

| Name | Min width | What changes |
| --- | --- | --- |
| (base) | 0 | One column everywhere. Header: logo + Menu button. Docs: phone docs bar + "On this page" disclosure. Config tables become stacked blocks |
| `xs` | 576px (36em) | Feature cards go two columns; stack bricks show descriptions; pager goes two columns; phone placeholders can sit beside their captions |
| `sm` | 768px (48em) | Gutter 24, section 112. Config tables become real tables. Tutorial rows go three columns. FAQ items go question-left/answer-right. Page head gets bigger studs. Footer wall one row; footer links three columns |
| `md` | 992px (62em) | Gutter 32, section 144. Full header (nav, theme toggle, Set it up). Docs sidebar appears (224px). Hero two columns. Features three columns. Showcase two columns. FAQ aside to the right (300px). 404 two columns. Footer five columns |
| `lg` | 1200px (75em) | Docs third column: "On this page" (208px), and the phone "On this page" disclosure goes |

Checked at 360, 390, 768, 1024 and 1440. No page scrolls sideways at any width (the screenshot tool
checks `scrollWidth` on every capture). Code blocks scroll inside themselves.

**Page frame:** sticky header (64px) → `main` → footer. `html { scroll-padding-top: 80px }` so
anchors land below the sticky header.

---

## 6. Component inventory

Measurements are CSS pixels. "Section colour" means `var(--bb-brick)` from the nearest
`data-section`.

### 6.1 Header

- Sticky, `top: 0`, `z-index: 50`, background `--bb-ground`, 1px `--bb-line` bottom border, 64px tall.
  Content in `.wrap` (max 1312 + gutters).
- **Left:** lockup link to `/` (mark 28px tall + wordmark 26px tall, gap 10px, min 44px hit area,
  visually hidden text "Brick Bin, home").
- **≥ 992:** right-aligned nav: Tutorials, Docs, FAQ, Source code (GitHub). Each link 44px tall,
  12px side padding, 16px, weight 600. Then the theme toggle (§6.2, icon version), 12px gap, then a
  small primary button "Set it up" → Setup.
- **Nav states:** rest: ink, no underline. Hover: a 4px `--bb-line-strong` plate under the word scales
  in (`scaleX` 0 → 1, 120ms). Current (`aria-current="page"`): weight 700, plate in the section
  colour (Tutorials orange; Docs takes the current docs page's colour, Setup green by default; FAQ
  lavender). Focus: 3px `--bb-focus` outline, 3px offset. Source code never shows current.
- **< 992:** logo + a "Menu" button (text + 20px icon, 48px tall, 14px padding, `--bb-surface`
  background, `aria-expanded`, `aria-controls="menu"`).
- Mantine: `AppShell.Header` or a plain `<header>`; `Group`; `Anchor`; `Burger` is not used (we show
  the word "Menu").

### 6.2 Theme toggle (System / Light / Dark)

- A segmented group of three buttons, `role="group"`, `aria-label="Colour theme"`, each
  `aria-pressed`. Order: **System, Light, Dark**. Default: System.
- Track: `--bb-surface`, 1px `--bb-line` border, radius 5px, 3px padding, 2px gap.
- **Icon version (header):** buttons 38 × 38, icon 18px, visible tooltip via `title`, visually hidden
  label text ("System", "Light", "Dark").
- **Word version (phone menu, footer):** full width, each button 44px tall, icon + word, 15px, weight
  600.
- States: rest `--bb-muted`; hover `--bb-ink` on `--bb-surface-2`; chosen `--bb-btn` fill with
  `--bb-btn-ink`; focus ring. On a field (footer): track `--bb-field-2`, chosen `--bb-field-ink` fill
  with `#121212` text.
- Behaviour: System follows `prefers-color-scheme` live; the choice persists in `localStorage`; the
  resolved scheme is applied before first paint (no flash). Mantine: `useMantineColorScheme()` with
  values `auto | light | dark`, `ColorSchemeScript` in the document head, and
  `localStorageColorSchemeManager({ key: 'bb-color-scheme' })`. Style dark mode with
  `[data-mantine-color-scheme="dark"]` (which Mantine sets on `<html>`).

### 6.3 Phone menu

- A modal sheet (`role="dialog"`, `aria-modal="true"`, `aria-label="Menu"`) from the right, full
  height, `width: min(100%, 420px)`, `--bb-ground`, float shadow, over a `--bb-scrim`. Body scroll
  locked while open.
- Top row (64px): logo + "Close" button (same style as Menu, close icon).
- **Five section bricks** in a list, 14px apart: Tutorials "Ten walk-throughs", Setup "Start here",
  Hosting "Proxmox, Tailscale, backups", Configuration "Every setting", FAQ "Short answers". Each is
  60px min height, 10 × 16 padding, name 19px/700 left, description 15px/500 right, studs 22 / 6 / 10.
  The current page's brick gets a 3px ink outline (3px offset) and " · You're here" after the
  description.
- Then links (48px each): Home, Source code on GitHub, Report a problem.
- Then, pinned to the bottom when there is room: "Theme" heading and the word toggle.
- Behaviour: focus moves to Close on open, Tab is trapped, Escape and scrim click close, focus
  returns to the Menu button. Mantine: `Drawer` (position right, `size="420px"` capped at 100%,
  `withCloseButton={false}` and our own Close), which handles trap, Escape and scroll lock.

### 6.4 Footer

- Field background (`--bb-field`, dark in both themes), `--bb-field-ink` text, padding 96 top, 32
  bottom. Focus ring `--bb-field-focus`.
- **Wall** (decorative, `aria-hidden`): letters B R I C K and B I N, each centred at the bottom of a
  brick (weight 800, `clamp(2.5rem, 1rem + 7vw, 7.5rem)`, ≥ 768:
  `clamp(2.5rem, .5rem + 6vw, 6.5rem)`). Colours in order: B orange, R green, I azure, C tan, K
  lavender, gap, B azure, I orange, N green. Heights vary to look stacked by hand: brick 1
  `clamp(64px, 11vw, 150px)`, 2 `clamp(56px, 9vw, 124px)`, 3 `clamp(72px, 12.5vw, 172px)`, 4
  `clamp(60px, 10vw, 136px)`, the rest as brick 1. Gap 6px.
- **Grid** (64px below the wall): Learn (Tutorials, Import the catalog, FAQ), Docs (Setup, Hosting,
  Configuration), Project (Source code, Report a problem, MIT licence), Theme (word toggle), About
  (two paragraphs). Phones: two columns, Theme and About full width. 768: three columns. 992: five
  columns `1fr 1fr 1fr 1.2fr 2fr`. Links 44px tall, underline on hover.
- **About text** (15px): "Catalog data comes from [Rebrickable](https://rebrickable.com), imported
  by you onto your own server. Thank you, Rebrickable." and "Brick Bin is an independent project. It
  is not affiliated with, sponsored or endorsed by the LEGO Group or any other brick maker. LEGO is a
  trademark of the LEGO Group."
- **Base row** (1px `--bb-field-3` rule, 24px above): "© 2026 Bill Parrott. Free and open source
  under the MIT licence. Nothing on this site tracks you." left; small quiet button "Back to top ↑"
  right. Wraps on phones.
- Links: Source code `https://github.com/chimericdream/brick-bin`, Report a problem
  `…/issues`, MIT licence `…/blob/main/LICENSE` (confirm the file name).

### 6.5 Buttons

| Variant | Fill / text | Size | Studs | Hover | Pressed | Focus |
| --- | --- | --- | --- | --- | --- | --- |
| Primary | `--bb-btn` / `--bb-btn-ink` | 48px min height, 12 × 20 padding, 16px/650 | Two, always (18 / 5 / 12) | Fill `--bb-btn-hover`, studs rise 2px, arrow +3px | Drops 2px | 3px ring, 3px offset |
| Primary small | Same | 40px min height, 8 × 14, 15px | Two | Same | Same | Same |
| Quiet | `--bb-surface-2` / ink | As primary | Height 0 at rest | Studs rise to 5px | Drops 2px | Ring, and studs rise |
| On a field | Primary: `--bb-field-ink` / `#121212`; quiet: `--bb-field-2` / field ink | | | Primary hover `#FFFFFF` | | `--bb-field-focus` ring |
| On a section brick | Primary: `#121212` / `#F5F5F1`, both themes | | | `#34342F` | | `#121212` ring |

Every button has `margin-top: 5px` so its studs clear the content above. Buttons sit in a
`.btn-row` (flex, wrap, 12px gaps). One primary button per section at most (the header's small "Set it up"
doesn't count); everything else is quiet or a text link. Mantine: `Button` with `classNames`; the studs are a `::before` in the CSS module.

### 6.6 Links

- Text links: inherit colour, underline 1.5px at 0.2em offset; hover thickens to 3px; focus ring.
- Arrow link (`.go`): weight 650, no underline, 44px min height, arrow `→` in an `aria-hidden` span
  that moves 3px right on hover; underline (2px) on hover.
- External links (GitHub, Rebrickable, Tailscale) open in the same tab and get no icon.

### 6.7 Docs layout

- `<div class="docs">` grid. Phones: one column (`main` only). ≥ 992:
  `224px minmax(0, 1fr)`, gap 48. ≥ 1200: `224px minmax(0, 1fr) 208px`.
- Padding: 24 top on phones, 48 from 992; `--bb-section` bottom.
- Sidebar and "On this page" columns are `position: sticky; top: 88px` and the sidebar scrolls
  itself if taller than the viewport.
- Main column order: phone docs bar (< 992) → page head → phone "On this page" (< 1200) → article
  (48px below the page head) → "What next" brick → pager (tutorials).

### 6.8 Docs sidebar (also the content of the phone docs panel)

- Group headings (15px/700, `--bb-muted`): **Docs** (Setup, Hosting, Configuration) and **Also**
  (Tutorials, FAQ). In tutorials, the sidebar lists the ten tutorials under their four group
  headings instead (Getting started, Day to day, The household, Bigger jobs), without chips.
- Items: 44px min height, 8 × 12 padding, 6px apart, weight 550, M2 chip (1.05rem) in the item's own
  section colour, 10px gap.
- States: hover `--bb-surface` background. Current (`aria-current="page"`): background in the
  section colour, text and chip `#121212`, weight 700, two-plus studs (16 / 5 / 8) on top, 5px top
  margin. Focus: ring (black ring on the current brick).
- Mantine: `NavLink` with `classNames`, or plain anchors.

### 6.9 Phone docs bar

- Shown below 992. A full-width button, 52px tall, `--bb-surface`, 1px `--bb-line` border: M2 chip
  in the current section colour, bold "Docs" (or "Tutorials"), the current page name in
  `--bb-muted`, chevron at the right (rotates 180° when open). `aria-expanded`, `aria-controls`.
- Opens a panel in place (pushes content down, does not overlay): `--bb-ground`, 1px border, float
  shadow, 14px padding, containing the sidebar nav.
- Without script, the panel is simply shown open and the button hidden.
- Mantine: `Button` + `Collapse`.

### 6.10 "On this page"

- **≥ 1200, right column:** heading "On this page" 15px/700. List with a 2px `--bb-line` rail on the
  left; links 15px, 6px vertical padding, 14px left padding, `--bb-muted`. Hover: ink, underline.
  Current: ink, weight 700, 2px ink rail segment, M2 marker before the text. The current item
  tracks scroll (IntersectionObserver, root margin `-80px 0px -70% 0px`). Lists the page's h2s only.
- **< 1200:** a `<details>` disclosure directly under the page head: `--bb-surface`, summary 52px
  tall, bold "On this page", chevron. Items 44px, separated by 1px `--bb-line`. Closed by default.
- Mantine: `TableOfContents` (scroll spy built in) for desktop; `Accordion` or native `details` for
  phones.

### 6.11 Page head

- Section brick at the top of each inner page: section-colour background, `#121212` text, radius 3,
  studs 32 / 9 / 14 (≥ 768: 40 / 11 / 14), `margin-top` equal to stud height. Padding 32 × 24
  (≥ 768: 48).
- Contents in order: breadcrumbs (15px, `/` separators, links underlined), h1 (`--bb-step-head`,
  800, 16px below), lede (`--bb-step-lead`, max 36ch, 16px below), optional meta chips (tutorials:
  "Tutorial 2 of 10", "7 steps", "Admins only", "Mostly waiting"; 15px/600 on `rgb(18 18 18 / .1)`,
  2px radius, 3 × 10 padding, 6–8px gaps). Inline code inside uses `rgb(18 18 18 / .12)`.
- Focus ring inside is `#121212`.

### 6.12 Prose

- Max width `44rem` (the Configuration article allows `52rem` for its tables).
- Rhythm: 16px between blocks; h2 64px above, 12px below; h3 32px above, 12px below.
- Bullets: M2 glyph (0.8em) in the section colour, absolutely positioned at the left of a 1.5em
  indent, 0.36em from the top. Numbered lists use normal numerals with a 1.4em indent.
- "Catalog data comes from Rebrickable" credit line: 15px, `--bb-muted`, link to rebrickable.com.
  Required at the end of any page section that discusses catalog data.

### 6.13 Code

- **Inline code:** JetBrains Mono at 0.86em, `--bb-code-bg`, 0.1em × 0.35em padding, radius 3,
  wraps anywhere (so long variable names never cause sideways scroll).
- **`kbd`:** mono 0.82em, 1px `--bb-line-strong` border with a 2px bottom border, radius 3.
- **Code block:** `--bb-code-bg`, radius 3, 24px above. A bar on top (1px `--bb-line` bottom border,
  14px left padding): label in mono 14px `--bb-muted` (file name, "Terminal", or "Example: check
  against your compose file"), and a "Copy" button at the right (40px tall, 64px min wide, 15px/650;
  hover `--bb-surface-2`; after copying it reads "Copied ✓" for 1.6s). `pre`: 14px mono, line
  height 1.65, 14px padding, scrolls horizontally inside itself, `tabindex="0"` with an
  `aria-label` so keyboard users can scroll it. Comments in `--bb-muted`. No syntax colouring
  beyond that.
- Mantine: `Code` for inline, `CodeHighlight` is not needed (it would pull a highlighter); a plain
  `pre` plus `CopyButton` is enough.

### 6.14 Callouts

| Kind | Look | Use |
| --- | --- | --- |
| Note | `--bb-surface` plate, studs in `--bb-surface` (18 / 5 / 12), 16 × 24 padding, radius 3. Bold title line, then 16px text | Context, reasons ("Why the copy and paste?") |
| Mind this | Same plus a 2px dashed `--bb-ink` outline (inset) and ink studs: the missing-piece line | Anything that can lose data or time ("Leave the page fetch off for now", "Nothing updates by itself") |

24px above. Never more than one "mind this" per screen. No icons. No colour.

### 6.15 Parts box ("What you need")

- `--bb-surface` plate with studs (20 / 6 / 12), 24px padding, radius 3.
- Heading "What you need" (h3 size). Then a two-column definition list: count in weight 800 tabular
  numerals (`1×`, `6 GB`, `48 h`, `~10 GB`), 16px gap, then the item. Rows 10px apart.
- Tutorial page: beside the goal from 768 (`1.2fr 1fr`); stacked below it on phones. Setup page:
  inside "Before you start".

### 6.16 Step list

- `ol.steps`, 48px between steps, 24px below the h2.
- Each step: grid `44px 1fr`, 16px gap. The number: 44 × 38 block, section colour, `#121212`
  numeral 18px/800, 8px from the top, with two studs (15px pitch, 5px tall) on top. The title is an
  h3 (`--bb-step-h3`, 700), then paragraphs, code, callouts and placeholders, 12px apart.
- It is a real `<ol>` so steps can be referred to ("go back to step 3").

### 6.17 Configuration table

- One table per group, each under its own h2: **The ones you must set**, **Server**, **Storage and
  limits**, **Catalog import**. Columns: Variable, What it does, Default. Caption visually hidden.
- Header cells: 14px/700, 10 × 12 padding, 2px ink bottom rule. Body cells: 16px, 12px padding, 1px
  `--bb-line` bottom rule, top-aligned.
- Variable cell: the name as a link to its own anchor (`#APP_PORT`), mono 14px/600 on
  `--bb-code-bg`, 3 × 7 padding, no underline (underline on hover); the row has `id` = the variable
  name, and `:target` highlights the row in `--bb-surface`.
- Default cell: code values don't wrap; plain-language defaults ("Rebrickable's page") wrap.
  Required values are tags: "Required" (DATABASE_URL), "Set it" (POSTGRES_PASSWORD, TS_AUTHKEY):
  13px/750, 1.5px ink border, 2px radius, 2 × 8 padding.
- **< 768:** each row becomes a block: `--bb-surface`, radius 3, 14px padding, 10px apart; name,
  then purpose, then "**Default:** value". `thead` is visually hidden, not removed.
- After the catalog table, a "mind this" callout about `REBRICKABLE_PAGE_FETCH`. Then "A typical
  .env" code block. Then the muted line "Variables used only by tests aren't listed here."
- Content: exactly the fourteen variables in the brief's table, grouped as in the mockup. No filter.

### 6.18 Tutorials index rows

- Group heading: h3 size, M2 chip in orange, 12px below.
- Row: `--bb-surface`, radius 3, 16 × 18 padding, 10px apart. Title (h3 link; its `::after` covers
  the row so the whole row is clickable), one-line summary (16px), step count (15px muted, tabular).
  ≥ 768: three columns `1fr 1.4fr auto`, baseline-aligned.
- States: hover `--bb-surface-2`, lifts 2px, orange studs (20 / 6 / 14) rise from 0 to 6px. Focus
  (on the link): ring around the whole row and studs rise. Pressed: drops 1px.

### 6.19 Feature cards and chips (landing)

- Grid: one column; two from 576; three from 992. Gap 12. Two wide cards span two columns (Sets and
  copies; Private by construction).
- Card: `--bb-surface`, radius 3, 24px padding, 10px internal gap. A drawn chip (`aria-hidden`,
  min 112px tall from 576, natural height on phones), then h3, then 16px text.
- Chips are drawn by the site in its own style. They are illustrations, not fake screenshots: copy
  list (three rows on `--bb-ground`), part + dashed missing part + "× 4", shopping row (tick, colour
  swatch in reddish brown, "Plate 2 × 4, reddish brown", "× 3"), big numbers (52px/800: "48 hours",
  "p. 37 of 112", "$1,284" with a "3 stale" tag, "0 background downloads"), the "I bought this"
  switch, kid-profile rows with "hidden" struck through, a CSV file name.
- Cards are not links and have no hover.

### 6.20 Screenshot placeholders

- `figure.shot` → `.shot__frame` → `figcaption`. Frame: 1px `--bb-line` border, radius 3,
  `aspect-ratio: 16/10` (desktop) or `9/19.5` (phone, max 300px wide). While empty: baseplate
  (M6) background and a centred label chip on `--bb-ground` (ID in bold, then "screen · viewport").
- Caption below (10px gap, 15px): a definition list Screen / State / Viewport / Focus, terms bold,
  values muted. Phone placeholders on tutorial pages sit beside their caption from 576.
- When the real image arrives: drop the baseplate and label, put the `img` in the frame (full bleed,
  `object-fit: cover`), and replace the caption list with one plain sentence that says what to
  notice (for example "Three copies of one set, each with its own state and place."). Keep the
  border. See PLACEHOLDERS.md for single-theme screenshots.

### 6.21 Landing pieces

- **Hero:** padding 48 / 64 (≥ 992: 96 / 128). Left: h1 (max 11ch), lede (24px below, max 34ch),
  second paragraph in muted (16px below, max 46ch), buttons (32px below): primary "Read the setup
  guide →", quiet "See the tutorials". Right (below on phones): label row "Sorted by colour, like any
  good bin" / "5 sections" (15px muted), then the stack. ≥ 992: `1.1fr 1fr`, gap 96, bottom-aligned.
- **Stack bricks:** links; 64px min height (Setup 88px), 12 × 18 padding, name 19px/750, description
  15px (from 576), arrow 20px at the right; "Start here" tag (13px/700, `#121212` fill, `#F5F5F1`
  text) after "Setup". The `nav` is labelled by the "Sorted by colour" text.
- **Statement:** h2 "A set is the design. A copy is the box." and a lead paragraph with three small
  inline pictograms (sealed box, built model, tub with a missing piece; 1.6em × 1.2em chips on
  `--bb-surface-2`, `aria-hidden`). Two columns from 992.
- **Showcase (the one live thing):** field section. Left: h2 "This copy is *built*." whose last word
  and the line below change with the selected state, and a muted note. Right: a `fieldset` card on
  `--bb-ground` with the float shadow, legend "Build state" / "Copy 2 of 5", six radio options
  (52px rows, 20–28px/700, a check mark on the selected row, selected row `--bb-surface-2`, hover
  `--bb-surface`, focus ring inset on the row). Default: Built. Works without script (CSS `:has()`);
  in React it is a `Radio.Group` with state. The text column is `aria-live="polite"`.
- **Bond list:** `ol` of four Hosting bricks (24px padding, studs 28 / 8 / 12, 20px apart), each
  with a 40px black number block, h3 and 16px text. Then two notes side by side from 768 ("Updates
  look after themselves", "Only want a look?" with an arrow link to Hosting).
- **Plate band:** full-bleed `--bb-surface` band with studs across the top, 64px vertical padding.
  h2, then three columns from 768 (M2 + h3 + text), then one "Not in version 1, either: …" line
  linking to the FAQ.
- **CTA:** inside `.wrap`, a Setup brick (studs 40 / 11 / 16), 64px vertical padding, inner padding
  24 (≥ 992: 64), two columns from 992: h2 left (max 14ch), text + primary button + arrow link right.

### 6.22 "What next" brick and pager

- **What next:** a link styled as a brick in the destination's section colour, studs 28 / 8 / 14,
  24px padding, max `44rem`, 72px above. Small label (15px/600: "What next", "Next in Docs", "Still
  wondering?"), title (`--bb-step-h2`, 800, ends in "→"), one line of 16px text. Hover lifts 3px.
- **Pager (tutorials):** two bordered boxes (1px `--bb-line`, 64px min height): "Previous / ← First
  run" and "Back to / All tutorials". Hover `--bb-surface`. Two columns from 576.

### 6.23 FAQ

- Layout below the page head: one column; from 992 `1fr 300px`, gap 64, aside sticky.
- List: `ol`, 2px ink top rule. Each item: 24px vertical padding, 1px `--bb-line` bottom rule. Question
  is an h2 at h3 size, a self-link to its own anchor (`#kids`). Answer: the short answer first in
  bold (750) ("No.", "Not yet.", "Nothing."), then the reason, 10px between paragraphs. From 768,
  question and answer sit side by side (`0.8fr 1.2fr`, gap 32).
- All answers are always visible. No accordion.
- Aside: two `--bb-surface` boxes, 24px padding: "Not in version 1" (M2 bullets in lavender, the
  eight items, then a muted line) and "Longer answers" (links with chips in their section colours).

### 6.24 404

- One column; from 992 two columns, gap 96. Left: h1 "This piece isn't in the set." (max 14ch),
  lede, the parts line (`--bb-surface` box: "1×" in 24px/800, then "**Page, colour unknown.** Not
  added to your shopping list. We checked."), buttons: primary "Back to the start", quiet "Read the
  docs", quiet "Browse tutorials". Small muted "Error 404: page not found." Right: the wall on a
  baseplate (28 / 16 / 16 padding): four rows of neutral bricks, 6px gaps, half bricks at row ends in
  alternate rows; in row two one brick is the dashed gap with "404" centred in it.
- Netlify: `out/404.html` is served automatically for unknown paths in a Next.js static export.

---

## 7. Page-by-page layout and content

The mockup files hold the final copy for every page drawn. Treat it as the content unless §11 flags
it.

### 7.1 Landing (`/`, `index.html`) — `data-section="none"`

1. Hero (§6.21). h1 "Know what's in every box."
2. Statement: set vs copy.
3. "What it keeps track of": section title, lede ("Sets, the boxes you own of each, and everything
   that goes missing from them. All of this is in version 1."), ten cards, the "Also in the box" line,
   placeholders L-01 (desktop) and L-02 (phone) side by side from 768 (`2.3fr 1fr`).
4. Showcase: build state.
5. "How self-hosting works" (`data-section="hosting"`): title, lede, bond list, two notes.
6. Plate band "What you won't find here".
7. CTA "Got a spare evening and a server?"
8. Footer.

### 7.2 Tutorials index (`/tutorials`) — `tutorials`

Page head (no sidebar on the index), then four groups of rows (max 1040px wide, 64px below the head),
then a muted line pointing to the FAQ and docs. Ten tutorials, titles and summaries as in the
mockup; step counts are representative.

### 7.3 Tutorial page (`/tutorials/<slug>`) — `tutorials`, docs layout

Sidebar: all tutorials. Page head with meta chips. Phone "On this page". Then:

1. **Goal and what you need:** goal sentence (lead size, "Goal:" bold), a short paragraph, parts box.
2. **Steps** (h2), the step list with placeholders where the screen changes.
3. Any explanatory h2 sections (in the template: "The 48-hour limit", with a "mind this" callout).
4. **If something goes wrong** (h2): bulleted problems, each starting with the symptom in bold.
5. Rebrickable credit line when the tutorial touches catalog data.
6. **What next** brick (to the next tutorial) and the pager.

"On this page" lists: Goal and what you need, Steps, (extra sections), If something goes wrong, What
next. The template is filled in for **Import the LEGO catalog**; every tutorial uses the same
structure.

### 7.4 Setup (`/docs/setup`) — `setup`

Before you start (parts box) → A quick try-out (3 steps, a code block) → The recommended install
(the four-part stack as a list, 3 steps, `.env` code block, a note) → First visit (S-01) → Import
the catalog (link to the tutorial, credit) → "What next: Hosting".

### 7.5 Hosting (`/docs/hosting`) — `hosting`

Proxmox and Docker → Tailscale and HTTPS (address code block) → Running without Tailscale → Updates
(note: Postgres never auto-updated) → Disk space (list) → Backups (three items, a labelled example
code block) → Restoring (three steps, ending with "run a catalog import again") → credit → "What
next: Configuration".

### 7.6 Configuration (`/docs/configuration`) — `config`

As §6.17, then "What next: FAQ".

### 7.7 FAQ (`/faq`) — `faq`

As §6.23. Ten questions: the eight from the brief in the brief's order, plus "Who can see that I
bought something off a wishlist?" and "Does it update itself?".

### 7.8 404 — `none`

As §6.24.

### 7.9 URLs

`/`, `/tutorials`, `/tutorials/import-the-lego-catalog` (and one slug per tutorial),
`/docs/setup`, `/docs/hosting`, `/docs/configuration`, `/faq`. Every h2 has a stable `id` so docs
links like `/docs/hosting#backups` and `/docs/configuration#APP_PORT` work.

---

## 8. Accessibility and reduced motion

### 8.1 Rules

- WCAG 2.2 AA. All text pairs are 6.4:1 or better (most AAA); see §3.2.
- **Focus:** every interactive element shows a 3px solid outline at 3px offset, in `--bb-focus`
  (room), `--bb-field-focus` (fields) or `#121212` (on bricks). Never remove it. Rows show the ring
  around the whole row. Use `:focus-visible`.
- **Skip link** "Skip to content" as the first focusable element, visible on focus, targets
  `#main`.
- **Landmarks:** `header`, `nav` (each labelled: "Main", "Documentation", "Tutorials", "On this
  page", "Breadcrumb", "Sections" in the menu, footer navs labelled by their headings), `main`,
  `aside`, `footer`.
- **Headings:** one h1 per page; no skipped levels. Visually hidden h2s exist where a section has no
  visible heading (tutorial "Goal and what you need", "What next").
- **State:** `aria-current="page"` on the current nav, sidebar and menu item; `aria-current="true"`
  on the current "On this page" item; `aria-pressed` on theme buttons; `aria-expanded` on Menu and
  the docs bar.
- **Decorative art** (`aria-hidden="true"`): studs, M2 glyphs, the footer wall, the 404 wall, card
  chips, statement pictograms. The logo link has a text alternative.
- **Placeholders:** the empty frame is `role="img"` with the alt text as `aria-label`; the visual
  label chip is `aria-hidden`. Real images get `alt` from PLACEHOLDERS.md.
- **Tables:** real `table` with `th scope="col"` and a caption (visually hidden). The phone layout
  keeps table semantics (CSS only).
- **Build-state demo:** a `fieldset` with a `legend` and real radios; the changing text is in an
  `aria-live="polite"` region.
- **Targets:** buttons, nav items, menu items, footer links, toggles on phones: 44px or more. Dense
  desktop lists ("On this page", breadcrumbs, FAQ aside) and the header icon toggle (38px): 32px or
  more, with spacing.
- **Text resize:** everything is in rem; the layout holds at 200% zoom with no sideways scroll.
- **Language:** `lang="en"`. Spell it US or UK consistently: the site uses **UK spelling** in prose
  ("colour", "licence"), but keeps product terms as they appear in the app ("catalog").
- **Colour alone** never carries meaning (§4.5.6).
- **Visibility claims:** the site describes kid-profile and private-mark behaviour; do not add
  marketing claims beyond the content pack.

### 8.2 Reduced motion

Under `prefers-reduced-motion: reduce`: no translate on hover or press (buttons, stack, rows,
"What next", arrows); stud rise and colour changes happen instantly (1ms); smooth scrolling off.
Nothing else needs to change because nothing loops or enters.

---

## 9. Voice and tone

You will write copy in this voice. Read this section before writing anything.

### 9.1 Who we sound like

A friend who has run Brick Bin at home for a while and is showing you their setup: practical, warm,
a little dry. Like a well-organised workshop, not a toy aisle and not a cloud company.

### 9.2 Rules

1. **Say the fact first.** A joke, if any, comes after a true sentence and can be deleted without
   losing anything.
2. **One light touch per section at most.** None in the configuration table, error steps or
   anything about data loss.
3. **Be specific.** Numbers from the product beat adjectives: 48 hours, about 6 GB, port 3000, every
   five minutes, fourteen variables.
4. **Plain words, short sentences.** Contractions are fine. "You" is the reader (usually the admin);
   "we" is the project; "your household" and "kids" are fine.
5. **Say no plainly.** "No." "Not yet." "Nothing." "Not in version 1." Then the reason.
6. **Name real things:** boxes, tubs, shelves, the hall cupboard, the kettle.
7. **Credit Rebrickable** with a link wherever catalog data comes up.
8. **Brands:** say "building-brick sets", not "LEGO sets", unless you mean the Rebrickable LEGO
   catalog. Never imply affiliation.
9. **Headings** in sentence case. Page titles are short nouns or a plain promise.
10. **Buttons** say what happens: "Read the setup guide", "Back to the start", "Set it up". Not
    "Learn more", not "Get started".

### 9.3 Never

- Exclamation marks.
- "Seamlessly", "unlock", "powerful", "simply", "just", "effortless", "robust", "game-changer".
- "It's not X, it's Y" reveals, or "No X, no Y, no Z" lists in headlines.
- Strings of three adjectives.
- Claims beyond the content pack: no user counts, testimonials, prices, speeds or "secure" claims
  you can't point to.
- Talking down: no "Don't worry!", no "easy".

### 9.4 Examples from the site

| Situation | We write | Not |
| --- | --- | --- |
| Landing headline | Know what's in every box. | The ultimate LEGO collection manager! |
| Why paste the page | Until Rebrickable confirms that automated page reads are fine, Brick Bin won't read that page for you. For now, you are the fetch. | Due to API limitations, manual input is required. |
| Waiting | How long that takes is up to your connection, so this is a good moment to put the kettle on. | Please wait while the import completes. |
| A limit | An import can run at most once every 48 hours. If the Import button is disabled when you come back, that's why. | Rate limiting is in effect. |
| Not supported | **Not yet.** Version 1 tracks sets, the copies you own of them, and the pieces each copy is missing. | Coming soon! |
| Privacy | Your data stays on your server. The app loads nothing from a CDN and makes no background downloads. | Bank-grade security keeps your data safe. |
| Admin role | Whoever does this is the admin, so it's worth being the grown-up in the room. | The first user becomes the administrator. |
| Kid profiles | That rule lives on the server and is covered by tests, so it doesn't depend on a button being tucked out of sight. Birthday presents are safe. | Kid-safe mode! |
| 404 | **Page, colour unknown.** Not added to your shopping list. We checked. | Oops! Something went wrong. |
| Cost | **Nothing.** … You do supply the server, the disk and the bricks. | Free forever! |

### 9.5 Microcopy patterns

- Section intros: one sentence of what, one of why.
- Error/"If something goes wrong" items: **symptom in bold.** Likely cause. What to do.
- Captions for real screenshots: one sentence, what to notice, no "Screenshot of".
- Empty states (if any appear on the site): a true sentence plus a small dry aside.

---

## 10. What is flexible

You may change these without asking:

- **Copy** in docs and tutorials, to match the real app (labels, menu paths, commands). Keep the
  structure and the voice.
- **Step counts** and the number of placeholders per tutorial.
- **Feature card order and chips**, as long as there are cards for every feature in the content
  pack and the two wide cards stay wide.
- **Exact clamp formulas**, if a heading breaks badly at an in-between width. Keep the end values.
- **Breakpoint at which "On this page" appears** (1200) may move between 1100 and 1280.
- **Icons:** my six SVGs or Tabler Icons (self-hosted), 2px stroke.
- **The live build-state showcase** may be dropped if it costs too much; replace it with a feature
  card. Everything else on the landing page stays.
- **Pager** on tutorial pages: may show previous/next tutorial titles instead of "All tutorials".
- **Code block labels** and whether the copy button shows a tick.
- **The FAQ** may gain questions; keep short-answer-first and keep all answers open.
- **Animations** may be removed entirely. They may not be added (no entrances, no scroll effects).

Not flexible: the five section colours and their assignment, the room colours, the type families,
the brick-motif rules in §4, "no third-party anything at runtime", the footer credit and
non-affiliation text, the theme toggle's three settings, the focus rings, and the 44px targets on
phones.

---

## 11. Content to check against the real app

The brief allowed representative docs text. Check these against the app and repository before launch:

1. Menu paths and labels: "Settings → Catalog", "Check", "Import", "Add a set".
2. The production compose file's name (`compose.prod.yml` in the mockup) and whether the commands are
   right.
3. Whether the production compose file builds `DATABASE_URL` from `POSTGRES_PASSWORD` itself. If it
   does, drop `DATABASE_URL` from the example `.env` files and the quick try-out step, and change
   "Four values matter on day one" back to three.
4. `.env.example` exists under that name.
5. The backup example (`pg_dump` flags, the service name `db`, the catalog table names, folder names).
   It is labelled "Example: check against your compose file"; better to replace it with the
   project's own backup command if one exists.
6. That signing in fails over plain HTTP when `COOKIE_SECURE=true` (the Hosting page says so).
7. That the catalog page shows when the next import is allowed (the tutorial says it does).
8. That a catalog import shows progress (placeholder T02-03).
9. That the paste step lists "files it will download, with their dates".
10. The licence file path for the footer link (`/blob/main/LICENSE`).
11. Tutorial step counts on the index.
12. Sample figures in the landing chips ($1,284, p. 37 of 112, three copies) are illustrations, not
    claims. Fine to keep.

---

## 12. Building it with Next.js, Mantine and Netlify

- **Static export:** `output: 'export'` in `next.config`, deploy `out/` to Netlify. No server
  features are used. Docs and tutorials can be MDX; the components above map to MDX components
  (`Callout`, `Steps`, `Parts`, `Shot`, `ConfigTable`, `Next`).
- **Theme:** `createTheme` with `fontFamily: 'Albert Sans, …'`, `fontFamilyMonospace: 'JetBrains
  Mono, …'`, `headings: { fontWeight: '700' }`, `defaultRadius: 3` (as `radius: { xs: '2px', sm:
  '3px' }`), `breakpoints` left at Mantine defaults (§5), `primaryColor` irrelevant (we style
  buttons ourselves). Put every `--bb-*` token in a global CSS file: light values on `:root`, dark
  values under `[data-mantine-color-scheme="dark"]`. CSS modules with `postcss-preset-mantine`.
- **Studs:** one utility class (or a `Studs` wrapper) that adds the `::before` from M1. Components
  set `--pitch`, `--stud-h`, `--stud-inset` and `--bb-brick` (or `--stud-colour`). No images.
- **Fonts:** `next/font/local` with the two WOFF2 files, `display: 'swap'`, preload Albert Sans.
- **No third parties at runtime:** no analytics, no font services, no embeds, no remote images. All
  links to GitHub, Rebrickable and Tailscale are plain links.
- **Netlify:** set long-cache headers on `/_next/static/*` and `/fonts/*`; the default 404 handling
  serves `404.html`.
- **Testing:** check every page at 360, 390, 768, 1024 and 1440 in both themes for sideways scroll;
  check keyboard navigation through the header, menu, docs bar and theme toggle; check reduced
  motion.
