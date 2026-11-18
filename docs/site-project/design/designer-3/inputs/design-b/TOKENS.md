# Brick Bin site: tokens

The source of truth is the `:root` block at the top of `assets/css/site.css`.

## Colour

| Token | Light | Dark | Used for |
| --- | --- | --- | --- |
| `--bg` | `#f7f9f8` | `#04262b` | Page ground |
| `--surface` | `#ebf0ee` | `#08343a` | First tone step: tiles, code blocks, table stripes, placeholders |
| `--surface-2` | `#dbe5e2` | `#0e444c` | Second tone step: quiet buttons, table heads, inline code |
| `--ink` | `#06525c` | `#e4f1ee` | All text, dark bricks |
| `--muted` | `#27666f` | `#a3c9c2` | Captions and secondary notes only |
| `--accent` | `#06525c` | `#9fd6c4` | Primary button fill, selected state |
| `--accent-ink` | `#f7f9f8` | `#04262b` | Text on the accent |
| `--field` | `#06525c` | `#0c4a53` | Full colour fields: hero card, sheet band, closing tile, footer |
| `--field-ink` | `#f7f9f8` | `#e4f1ee` | Text on a field |
| `--field-muted` | `#c3dfd9` | `#b4d5cf` | Secondary text on a field |
| `--field-btn` / `--field-btn-ink` | `#f7f9f8` / `#06525c` | `#9fd6c4` / `#04262b` | Button on a field |
| `--mint` | `#9fd6c4` | `#9fd6c4` | Second brick colour, mint tiles, text selection |
| `--mint-ink` | `#053f47` | `#04262b` | Text on mint |
| `--mid` | `#3d8791` | `#4fa39a` | Third brick colour, bullets, logo brick |
| `--coral` | `#e4573d` | `#f0755a` | "A piece is out of place": missing brick, mind-this callouts, focus ring. Never body text. |
| `--dot` | ink at 16% | ink at 14% | Baseplate dots behind placeholders and the 404 |

Contrast (WCAG, computed): ink on bg 8.4:1 light, 13.8:1 dark. Muted on bg 6.2:1, on surface 5.7:1,
on surface-2 5.1:1 (light); 8.9, 7.5 and 6.0 (dark). Field ink on field 8.4:1 light, 8.5:1 dark. Mint
ink on mint 7.1:1. Coral tag text 5.0:1. Coral on bg 3.5:1 light and 5.6:1 dark, on surface 3.2:1; it
is used for non-text marks and focus rings only.

## Type

Faces: **Albert Sans** variable (400, 500, 600, 700) for everything. **JetBrains Mono** variable
(400, 600) for code. Both SIL OFL 1.1, self-hosted from `assets/fonts/`.

| Token | Value | Range | Used for |
| --- | --- | --- | --- |
| `--step-small` | `clamp(0.8125rem, 0.79rem + 0.1vw, 0.875rem)` | 13 to 14px | Captions, meta, table heads |
| `--step-body` | `clamp(1.0625rem, 1rem + 0.25vw, 1.1875rem)` | 17 to 19px | Running text |
| `--step-lead` | `clamp(1.25rem, 1.1rem + 0.7vw, 1.625rem)` | 20 to 26px | Lead paragraphs, `h3`, row titles |
| `--step-head` | `clamp(2rem, 1.3rem + 3.2vw, 4rem)` | 32 to 64px | Section `h2`, inner page `h1` |
| `--step-display` | `clamp(2.5rem, 1rem + 3.4vw, 4.25rem)` | 40 to 68px | Landing page `h1` |

Two fixed in-between sizes exist for dense spots: prose `h2` at `clamp(1.5rem, 1.3rem + 1vw, 2rem)`
and tile or table text at `1rem`.

| Setting | Headings | Body |
| --- | --- | --- |
| Weight | 600 (wordmark and footer letters 700) | 400, emphasis 600 |
| Tracking | -0.035em (`h3` -0.02em) | 0 |
| Line height | 1.0 (`h3` 1.15) | 1.5 (lead 1.35) |
| Measure | Two lines at most | 44rem max in prose, about 70 characters |

Numbers that line up use `font-variant-numeric: tabular-nums`.

## Spacing

Base unit 4px.

| Token | Value |
| --- | --- |
| `--s-1` to `--s-10` | 4, 8, 12, 16, 24, 32, 48, 64, 96, 144px |
| `--gutter` | `clamp(16px, 4vw, 32px)`, the one outer margin |
| `--section` | `clamp(72px, 11vw, 160px)`, the gap between landing sections |
| Content width | 1312px (1376px including gutters) |
| Board and tile gap | 8px |
| Brick-to-brick gap | 4px |

## The stud

| Token | Value | Notes |
| --- | --- | --- |
| `--stud-w` | 20px default | One module: a 60% stud with 20% space each side |
| `--stud-h` | 6px default | |
| Scales in use | 14 to 16px (nav, small buttons), 20 to 22px (buttons, rows, callouts), 28 to 40px (stack, tiles), 40 to 72px (hero card), 50% (footer letters, two studs each) | |
| Baseplate dot | 12px dot on a 24px grid | Top view |

## Radii

| Token | Value |
| --- | --- |
| `--r` | 2px, everywhere. A moulded edge. Nothing is rounder, and there are no pills. |

## Shadows

| Token | Value | Used for |
| --- | --- | --- |
| `--shadow-float` | `0 12px 32px rgba(4,38,43,.22)` light, `rgba(0,0,0,.5)` dark | The open docs menu on phones. Nothing at rest has a shadow. |

## Breakpoints

| Name | Min width | Main change |
| --- | --- | --- |
| phone | 0 | Single column |
| `sm` | 640px | Two-column board |
| table | 720px | Config tables switch from stacked blocks to real columns |
| `md` | 768px | Docs sidebar appears |
| `lg` | 900px | Full header, split hero |
| board | 1024px | 12-column features board |
| `xl` | 1100px | Docs third column ("On this page") |

Tested at 360, 390, 768, 1024 and 1440.

## Motion

| Token | Value | Used for |
| --- | --- | --- |
| `--t-fast` | 120ms | Hover lift, press, studs rising |
| `--t-med` | 240ms | Theme toggle stud, menu icon, opacity |
| `--t-slow` | 520ms | Hero bricks changing state, bricks seating on load |
| `--ease` | `cubic-bezier(0.2, 0.7, 0.2, 1)` | Opacity and studs |
| `--snap` | `cubic-bezier(0.3, 1.4, 0.5, 1)` | Anything that moves: a slight overshoot, like a brick clicking home |
| Load stagger | 70ms per item | Hero card, self-hosting bricks |
| Hover travel | -3px, press +2px | Buttons, rows, the "next" tile |

`prefers-reduced-motion: reduce` sets all durations to effectively zero and removes hover travel.
Transforms and opacity only.
