# Brick Bin site: design notes (Designer 1)

## Concept: one brick, seen from the side

The whole site is built from a single shape: **a brick in side elevation, a rectangle with a row of
studs along its top edge**. That shape is the hero card, every button, the divider, the tutorial step
numbers, the callouts, the phone menu, the footer wordmark and the 404. Nothing else on the site has
"character". Layouts are plain one- and two-column grids so the shape does the talking.

Why it fits:

- It is the one thing every brand in the content pack shares. A stud row belongs to Mould King and
  COBI as much as to LEGO, so it says "bricks" without saying "LEGO".
- It is a workshop shape, not a toy-aisle shape. Flat, monochrome, squared off. It reads like a parts
  drawer label, which is the product: a well-organised bin.
- It gives an honest meaning to interaction. Things with studs can be pressed or stacked. A button
  lifts on hover and seats on press, the way a plate does.

The palette is a single teal on cool paper, with mint as the second brick colour and one coral that
means "a piece is out of place". It is deliberately far from primary red and yellow.

**The live thing.** The landing page hero has a small pile of bricks and the six build states as
buttons. Tapping a state rearranges the pile (boxed for sealed, stacked for built, scattered for
disassembled, strangers in the tub for mixed) with a line of microcopy. It demonstrates the product's
one-tap build-state menu without a screenshot, works by thumb, and without JavaScript simply shows
"Built".

Direction and process: I used the installed design skill (tasteskill v2). It dealt the "One motif"
direction, seed 2078981630, with Albert Sans and a "Teal on paper" palette, both of which I kept.
Deviations from its sheet are listed at the end.

## The brick-motif rules

There are two views of a stud, and each has one job.

### Side view (the stud row): things you can press, stack or step through

| Where | Rule |
| --- | --- |
| Hero card | The page's one giant brick. Studs 40 to 72px wide. Only on the landing page. |
| Buttons | Every button is a plate. Primary buttons always show studs. Hover lifts 3px, press drops 2px and the studs compress. |
| Selectable rows | Tutorial rows, build-state buttons and header links have **no studs at rest**. Studs rise on hover and stay for the selected or current item. |
| Header nav | The current page's word sits on a short stud row. |
| Docs sidebar | The current page gets a 1 x 1 brick beside it. |
| Tutorial steps | Each step number rides on a 1 x 1 brick. |
| Callouts | A tone-coloured brick. The "What you need" box is the parts call-out from an instruction booklet, with counts (`1 x`, `6 GB`). |
| List bullets | 1 x 1 bricks at text size, in prose only. |
| The course | One full-width row of mixed bricks. The only divider on the site, used once on the landing page. |
| "How self-hosting works" | Four bricks in running bond, read as an ordered list. |
| "What you won't find here" | A sheet with a stud edge, on the teal field. |
| Footer | The wordmark is built from nine bricks of different heights, letters knocked out. On every page. |
| 404 | A wall with one brick missing, the gap dashed in coral. |

### Top view (the dot grid, a baseplate): somewhere waiting for something

Used in exactly two places: behind **screenshot placeholders** and behind the **404 art**. A baseplate
is where a model will go. When real screenshots arrive, the baseplate disappears with the placeholder.

### Where the motif never appears

- Behind body text. Running text sits on a flat ground or a flat tone, never on studs or dots.
- Inside tables, code blocks or the "on this page" list. Reference material stays plain.
- As decoration in docs margins. In docs the motif is functional only: current-page marker, step
  numbers, callouts, bullets, buttons, the "next" tile.
- At more than one stud scale per component. A component picks one `--stud-w`.
- As a partial stud. Stud rows use `mask-repeat: round`, so studs are always whole.

### Coral

Coral means **a piece is out of place**: the missing brick (features tile, 404), stray bricks in the
"mixed" state, "mind this" callouts, required-setting tags, and the focus ring. It is never a button
colour and never text on the page ground.

### Trade dress

No logos on studs, no minifigure shapes, no red or yellow. Studs are drawn square in elevation, with no
perspective or highlights. "LEGO" appears only as a word, where the content needs it (brand lists, the
catalog, the non-affiliation note).

## The mark and wordmark

- **Mark:** a two-stud brick sitting in a bin (a thick U). Flat, two colours. `assets/svg/logo-mark.svg`.
- **Wordmark:** "Brick Bin" in Albert Sans 700, tracking -0.04em, sentence case.
- **Large form:** the footer construction, B R I C K in paper bricks and B I N in mint, with a short
  spacer brick between the words.

## Type

| Role | Face | Licence | Weights used |
| --- | --- | --- | --- |
| Everything | Albert Sans (variable) | SIL OFL 1.1 | 400, 500, 600, 700 |
| Code only | JetBrains Mono (variable) | SIL OFL 1.1 | 400, 600 |

Both are in `assets/fonts/` as self-hosted WOFF2 with their licence texts. Nothing loads from a font
service.

Albert Sans is a geometric grotesque with squared terminals and round bowls, which echoes the brick
(flat sides, round studs from above). One family keeps the page calm and lets the shape be the
personality. Headings are 600 with tight tracking and a line height of 1. Body is 400 at 17 to 19px
with a line height of 1.5. JetBrains Mono is for literal code only: variable names, commands, paths.

Five sizes do the work (see `TOKENS.md`). Headings never run past two lines at any tested width.

## Colour

One ground, one ink, and the ink doubles as the accent. All text is the full ink. There is no black
and no grey. Surfaces are separated by tone steps, not by lines or shadows. The only shadow on the
site is under the open docs menu on phones.

Light is teal ink on cool white paper. Dark is the same family turned over: a deep teal-black ground,
pale ink, and mint taking over as the accent so buttons stay the brightest thing. Dark was designed,
not inverted: the hero card and footer become a mid-teal field so they still read as solid bricks.

Contrast, computed: ink on ground 8.4:1 light and 13.8:1 dark. Muted text at least 5.1:1
on every surface it is used on. Coral is used only for non-text marks and focus rings (above 3:1), and
the coral tag carries near-black text.

## Voice

Plain, specific, a little dry. The jokes are small and sit at the end of a true sentence
("which is a fine excuse to go and build something", "You are the fetch", "Birthday presents are
safe"). Rules for whoever extends it:

- Say the fact first. The joke, if any, comes after and can be deleted without losing meaning.
- One joke per screen at most. None in configuration tables or error steps.
- No exclamation marks. No "simply", "just", "seamlessly", "powerful".
- Say what is not there, plainly: "Not yet." "No." "Nothing."
- FAQ answers start with the short answer in bold, then the reason.
- "We" is the project. "You" is the admin. Kids are "kids".
- Credit Rebrickable, with a link, wherever catalog data is discussed.

## Pages

| File | What it is |
| --- | --- |
| `index.html` | Landing page |
| `tutorials.html` | Tutorials index (ten tutorials in four groups) |
| `tutorial-import-catalog.html` | The tutorial page template, filled in for "Import the LEGO catalog" |
| `docs-setup.html`, `docs-hosting.html`, `docs-configuration.html` | Documentation |
| `faq.html` | FAQ |
| `404.html` | Not found |
| `states.html` | Reference sheet of interactive states. Not a site page. |

All are plain static HTML with one stylesheet and one small script. Open any of them by double-clicking.
Links to pages that were not mocked go to `#not-mocked`, and repository links go to `#repo`.

`tools/` is not part of the design. `tools/stamp.mjs` copied the shared header, sidebar and footer
around each page body in `tools/src/` so the nine pages stay identical where they should be.
`tools/shoot.mjs` took the screenshots. The root `.html` files are the deliverable.

Screenshot helpers: add `?theme=dark`, `?menu=open`, `?docsnav=open`, `?toc=open` or
`?state=sealed|opened|progress|built|apart|mixed` to a page address.

## Responsive behaviour

Designed at 390 first, checked at 360, 390, 768, 1024 and 1440. No page scrolls sideways.

| Width | What changes |
| --- | --- |
| Under 640 | Single column everywhere. Features board is a stack of tiles. Statement is left-aligned. |
| 640 and up | Features board goes to two columns. Phone-shaped placeholders in tutorials put their caption beside the frame. |
| Under 720 | **Config tables become stacked blocks:** each variable is its own small panel with the name, the purpose, and "Default: value". No sideways scrolling, no squeezed columns. |
| Under 768 | **Docs navigation** collapses into a sticky "Docs menu" bar that shows the current section and opens the section list in place. "On this page" is a closed disclosure above the article. |
| 768 and up | Docs sidebar is a sticky left column. Tutorials rows become three columns (title, summary, step count). |
| Under 900 | **Header** shows the mark, the theme toggle and a Menu button. The menu is a full-screen panel of large brick links, with "Set it up" last. Hero stacks: card first, live bricks second. |
| 900 and up | Full header. Hero is a 50/50 split. Self-hosting steps step sideways in running bond. Closing tile runs off both edges. |
| 1024 and up | Features board is the 12-column mosaic. |
| 1100 and up | Docs get a third column: "On this page" on the right, sticky, tracking scroll position. |

Tap targets are at least 44px. The gutter is `clamp(16px, 4vw, 32px)` and the content width tops out
at 1312px.

Without JavaScript: header links wrap under the bar, the docs sidebar sits in the flow above the
article, "On this page" is open, the hero shows the built state, and the theme follows the system
setting (the toggle is hidden because it could not work).

## Accessibility

- One `h1` per page, headings in order. Decorative bricks are `aria-hidden`.
- Focus is a 3px coral ring, offset so it clears the studs. On teal fields it switches to the field's ink.
- Current page is marked with `aria-current`. The theme toggle and build-state buttons use `aria-pressed`. Menus use `aria-expanded`.
- Placeholders are `role="img"` with the alt text from `PLACEHOLDERS.md` as `aria-label`.
- `prefers-reduced-motion` removes all travel. Hover lifts are dropped and the hero bricks change state without moving through the air.
- A skip link is the first focusable element.

## Motion

Small and mechanical. Buttons and rows lift and seat (120ms). Studs grow on hover (120ms). The hero
bricks move between states with a slight overshoot, like a brick clicking home (520ms). The hero card
and the four self-hosting bricks drop into place on load, 70ms apart. Nothing loops and nothing is
scroll-linked.

## Building it in Next.js and Mantine

- Every stud row is one CSS rule: a pseudo-element with a tiny SVG mask and `mask-repeat: round`. A
  `studs` class or a small `Studs` wrapper covers it. No images to manage.
- Tokens map straight onto Mantine theme `other` values or CSS variables with `light-dark()`.
- Buttons, the burger, the docs `NavLink` list, `Table`, and `Code` are ordinary Mantine components
  restyled with the tokens. The config table's phone layout is plain CSS on a real `<table>`.
- The hero bricks are one inline SVG and about sixty lines of script. No canvas, no library.
- Everything is static. No server features are needed.

## Where I left the design skill's sheet, and why

- **No photographs.** The skill asks for at least four real pictures. The brief asks for screenshot
  placeholders only and SVG or CSS art, so there are none.
- **"Drag through the stages" slider** replaced by the four-brick stack. A docs site should not need
  two interactive toys, and the stack reads as an ordered list without script.
- **Step numerals** appear on tutorial steps. They are a real `<ol>` and people need to say "go back
  to step 3".
- **Lint flags** left in place on purpose: monospace (code only), `box-shadow` used as flat inset
  marks on the "on this page" rail and callouts (not shadows), and the 1px visually-hidden helper.
- The skill's browser inspector would not start with Edge on this machine, so I reviewed my own
  screenshots at the same widths instead.
