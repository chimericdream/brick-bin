# Tokens

The source of truth is the top of `assets/css/site.css`. Everything else in that file refers to these
custom properties. In the Next.js build, map them onto a Mantine theme (colours, fonts, spacing,
radius, breakpoints) and keep the same names as CSS variables for the CSS modules.

## Colour

Two groups. **The room** changes with the theme. **The bricks** mean sections and never change
with the theme: bricks don't change colour at night, the room around them does.

### The room

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--ground` | `#F5F5F2` | `#141517` | Page background |
| `--surface` | `#EAEAE5` | `#1E2023` | Panels, tiles, placeholders, notes, the plate band |
| `--surface-2` | `#DCDCD5` | `#2A2D31` | One step up: second tile tone, quiet buttons, selected rows |
| `--surface-3` | `#C9C9C1` | `#363A3F` | Third tile tone (one tile on the board) |
| `--tile-strong` | `#17191C` | `#464B52` | Strong tiles on the features board |
| `--ink` | `#121212` | `#EFEFEA` | All running text, primary buttons |
| `--muted` | `#4D4D48` | `#ABAEB2` | Secondary notes only, never body copy |
| `--hero` | `#17191C` | `#0B0C0D` | Hero, showcase, 404 and footer fields (dark in both themes) |
| `--hero-2` | `#23262A` | `#1A1C1F` | Controls on the dark fields |
| `--hero-ink` | `#F5F5F2` | `#EFEFEA` | Text on dark fields |
| `--hero-muted` | `#B8BBBF` | `#ABAEB2` | Secondary text on dark fields |
| `--btn` / `--btn-ink` | `#121212` / `#F5F5F2` | `#EFEFEA` / `#121212` | Primary button |
| `--btn-hover` | `#34342F` | `#FFFFFF` | Primary button hover |
| `--focus` | `#0B5FC4` | `#7CC0FF` | Focus ring (`--focus-on-dark` `#7CC0FF` on dark fields; `#0B3F86` on bright bricks) |
| `--code-bg` | `#E3E3DC` | `#202326` | Inline code and code blocks |
| `--table-line` | `#CFCFC7` | `#34373C` | Table rows only |
| `--scrim` | `rgb(18 18 18 / .45)` | `rgb(0 0 0 / .6)` | Behind the phone menu |

### The bricks (colour = section)

| Token | Value | Section | Text on it |
| --- | --- | --- | --- |
| `--brick-tutorials` | `#FF8C1A` | Tutorials | `#121212`, 8.0:1 |
| `--brick-setup` | `#6CC04A` | Setup, and the "start here" action | `#121212`, 8.3:1 |
| `--brick-hosting` | `#4DB3E6` | Hosting, and the self-hosting section of the landing page | `#121212`, 8.0:1 |
| `--brick-config` | `#D8BC88` | Configuration | `#121212`, 10.2:1 |
| `--brick-faq` | `#F49AC1` | FAQ | `#121212`, 9.1:1 |
| `--brick-ink` | `#121212` | Text on any brick, both themes | |

Part colours, used only when a part itself is shown: `--part-dark-tan #958A73`,
`--part-reddish-brown #82422A`, `--part-light-grey #A0A5A9`.

### Contrast (checked)

Ink on ground 17.2:1 (dark theme 15.8:1). Muted on ground 7.8:1 (dark 8.2:1), muted on surface
7.0:1 (dark 7.3:1). Hero-muted on hero 9.1:1. Focus ring against ground 5.6:1 (dark 9.4:1); the
`#0B3F86` ring on bright bricks is 4.3 to 4.5:1. All text pairs pass WCAG AA; most pass AAA.

## Type

One family: **Jost** (variable, weights 300 to 800, roman and italic), self-hosted from
`assets/fonts/`. Code uses the system monospace stack (`ui-monospace, "Cascadia Mono", "Segoe UI Mono",
Menlo, Consolas, monospace`), never anything else.

| Token | Value | px at 360 → 1440 | Use |
| --- | --- | --- | --- |
| `--step-small` | `0.9375rem` | 15 | Captions, notes, footer, tile lines |
| `--step-body` | `clamp(1.125rem, 1.07rem + 0.22vw, 1.25rem)` | 18 → 20 | Running text |
| `--step-lead` | `clamp(1.3125rem, 1.15rem + 0.7vw, 1.75rem)` | 21 → 28 | Ledes, h3, group headings |
| `--step-head` | `clamp(2.125rem, 1.35rem + 3.3vw, 4.25rem)` | 34 → 68 | Section and page titles |
| `--step-display` | `clamp(4rem, 0.6rem + 10.4vw, 10.5rem)` | 64 → 160 (phone hero: 24vw) | The hero name, the 404 numeral |

| Role | Weight | Tracking | Leading | Case |
| --- | --- | --- | --- | --- |
| Display and section titles | 700 | -0.03 to -0.035em | 0.86 to 0.92 | Uppercase |
| Docs and step headings (h2, h3) | 700 / 600 | -0.02em | 1.05 | Sentence case |
| Body | 400, 500 for emphasis, 600 for strong | 0 | 1.55 | Sentence case |
| Buttons and nav | 600 / 500 | 0 | 1.2 | Sentence case |

Measure: running text max 66 to 70ch. Headings use `text-wrap: balance`, paragraphs `pretty`.
Uppercase only at `--step-head` and above. No letter-spaced small caps anywhere.

## Space

An 8px pitch, the same idea as the stud pitch.

`--s1 4` · `--s2 8` · `--s3 12` · `--s4 16` · `--s5 24` · `--s6 32` · `--s7 48` · `--s8 64` ·
`--s9 96` · `--s10 128` · `--s11 192` (px)

| Token | Phone | ≥768 | ≥1024 |
| --- | --- | --- | --- |
| `--margin` (page gutter, both sides) | 16 | 24 | 32 |
| `--section` (gap between sections) | 96 | 128 | 160 |
| `--max` (content width) | 1440 | 1440 | 1440 |

## Shape

| Token | Value | Use |
| --- | --- | --- |
| `--radius` | `3px` | Everything: buttons, bricks, tiles, frames, inputs. One radius, like a real brick's softened edge |
| Stud width | 0.6 × pitch | The real ratio (4.8mm stud on an 8mm pitch) |
| Stud height | ≈ 0.28 × pitch | |
| Studs, text size | `.b1`: 0.8em × 0.62em body, 0.17em stud | Bullets, chips, markers |
| Studs, component | pitch 16 to 26px, height 5 to 8px | Buttons (two studs, pitch 20, height 6), frames, cards, step numbers, page heads |
| Studs, architecture | pitch 28 to 48px, height 9 to 12px | Hero stack, plate band, footer wall, 404 wall |
| `--stud-mask` | SVG data URI of one stud (`assets/art/stud-tile.svg`) | Repeated with `mask-repeat: round` so studs always fit a whole number |

## Shadows

None at rest. One shadow, for things that truly float:
`--shadow-float: 0 18px 48px rgb(0 0 0 / .28), 0 2px 6px rgb(0 0 0 / .18)`, on the phone menu
sheet and on the open build-state menu. The range thumb has a 3px ring in `--ground` so it reads on
both halves of the self-hosting section.

## Breakpoints

| Name | Min width | What changes |
| --- | --- | --- |
| phone | 0 | One column. Phone hero name on two lines at 24vw. Section bricks without descriptions |
| small | 480 | Hero name on one line |
| tablet | 768 | Wider gutters; footer link columns go four across; band goes three across |
| desktop | 1024 | Header shows nav and theme toggle (menu button goes); features board becomes the 12-column mosaic; docs get the left section nav; tutorials get the sticky preview (on devices that hover) |
| wide | 1280 | Docs get the right "On this page" column |

Designed and checked at 360, 390, 768, 1024 and 1440.

## Motion

| Token | Value | Use |
| --- | --- | --- |
| `--ease` | `cubic-bezier(.2, .7, .2, 1)` | Everything |
| `--t-fast` | 120ms | Button press and hover, arrows, toggles |
| `--t-med` | 240ms | Section-brick lift, tutorial preview crossfade, stage swap, menu sheet |
| `--t-slow` | 520ms | Entrances |

- **Entrances**: heading, then text, then picture, each rising 24px and fading in, staggered 75ms
  (`.rise` with `--d`), once, as the section enters. Content is visible if scripts fail.
- **Press**: hover lifts a button's studs 2px; pressing drops the button 3px ("seating the brick").
- **Section bricks** in the hero lift 8px on hover; pager and next-step bricks 3 to 4px.
- **Signature move**: the tutorials index. Pointing at a row brings its screenshot into the sticky
  frame (240ms crossfade) and quietens the other rows. On touch, each row shows its picture inline.
- **`prefers-reduced-motion: reduce`**: all travel is removed (no lifts, drops or rises); colour
  changes stay; durations drop to 1ms.
