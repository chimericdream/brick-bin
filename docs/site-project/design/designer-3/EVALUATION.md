# Evaluation of Designs A and B

Designer 3. I judged both designs against the brief, not against my own taste. I looked at every
screenshot each designer supplied, read their HTML, CSS, notes and token files, and checked the
mockups at 360, 390, 768, 1024 and 1440 px through their screenshots and code.

## Summary

The two designs are much closer than you'd expect from separate hands. Both draw a brick from the
side, with whole studs on a CSS mask; both have a feature mosaic, a live build-state control, a
footer wordmark built from bricks, and a 404 about a missing piece. They differ mainly in two places:

- **A ("Sorted by colour")** has the stronger idea and personality. Each section is a brick of its
  own colour, and colour is the way you find your way around. Its mobile menu, footer wall, theme
  toggle and microcopy are the best in either package. Its weak points are the docs (FAQ, tutorials
  index, phone docs navigation), a hero that leads with navigation instead of saying what the product
  is, and two interactive toys more than a docs site needs.
- **B ("One brick, seen from the side")** has the better structure. Its hero says what the product is
  and who it's for in one screen. Its docs are the better reading experience: grouped configuration
  tables, a tutorial sidebar, step counts, "If something goes wrong", an FAQ you can scan. Its
  placeholders are the best-designed. Its weak point is personality: one teal on cool paper makes it
  calm but corporate, and the brief asked for "playful without being silly".

Neither is better in every way that matters, so I did not discard either. I kept **A's visual
system** (colour = section, neutral workshop room, black ink, its mark and wordmark, its menu,
toggle and footer) and **B's information architecture and docs patterns** (hero message, grouped
config, tutorial and FAQ structure, baseplate placeholders, running-bond hosting steps, the dashed
"missing piece"). Then I redrew both into one system, so nothing is pasted in from one side
unchanged except the wordmark drawing (credited below). The type is B's (Albert Sans), because it is
the more legible face for long docs.

## Design A

### First impression and personality
- **Works:** confident and memorable. "BRICK BIN" at poster size over a stack of five coloured
  bricks reads as "bricks, sorted" in one second. The colour-coded sections are a real idea taken
  from the subject (people sort parts by colour), and they keep paying off on every inner page.
- **Works:** the drawn wordmark (lowercase, square terminals, studs as the dots of the i's) and the
  1×2-brick-with-a-label-window mark are distinctive, ownable and have nothing to do with LEGO trade
  dress.
- **Fails:** the hero doesn't say what the product is. The pitch is a 20px line under the name; the
  rest of the first screen is navigation. The brief puts "what Brick Bin is and who it's for" first.
- **Fails (minor):** the five colours at full saturation on a dark field (orange, green, azure, tan,
  pink) sit close to the toy aisle the brief warns against. The discipline of where colour appears
  saves it, but pink next to orange next to green is the most candy-like corner of either design.

### Brick motif: system or decoration
- **Works:** a genuine system, documented with three scales (text, component, architecture), clear
  "never" rules, and a colour rule ("a bright brick colour means a section; anywhere else it would
  lie about where you are"). This is the best motif documentation of the two.
- **Fails:** the FAQ turns questions into staggered drawer tabs in alternating pink and grey. It's
  the one place the motif becomes decoration and hurts scanning.

### Legibility and accessibility
- **Works:** near-black ink on off-white (17:1), muted text still 7:1+, blue focus ring that changes
  per field, skip link, `aria-current`, `aria-pressed`, a real radio group for the build-state
  control, `details name=` for the FAQ, focus trap in the menu, reduced-motion handling.
- **Fails:** small text inside feature tiles and table cells (13 to 15px at 1440 and very light
  weights of Jost) is harder to read than it should be. Jost's geometric single-storey forms are
  lovely large and tiring small.
- **Fails:** on phones the features board has an overlap: the "Mixed" option of the drawn menu sits on
  top of the "Build state" tile label (landing-390-light).

### Mobile
- **Works:** the phone menu is the best component in either package: full-height sheet, five section
  bricks with a short description each, source link, and a theme control with words.
- **Fails:** the docs section switcher on phones is three small bricks in a row, which squeezes
  "Configuration" into "Config-uration" and won't take a fourth section.
- **Fails:** the build-state showcase deliberately overflows the screen edge at 130vw on phones. It's
  clipped, not scrolled, but it reads as a bug.

### Docs experience
- **Works:** coloured page heads make each section unmistakable; the config table has a filter, a
  sticky header and a good stacked phone layout; the tutorial page has a strong "What you need" parts
  box.
- **Fails:** one long ungrouped config table; the tutorials index uses a hover preview with ten grey
  placeholders (complex, and nothing to preview until screenshots exist); tutorial pages have no
  tutorial navigation or "if something goes wrong"; the FAQ is closed accordions in tabs, so you
  can't scan the answers.

### Dark mode
- **Works:** intentional. The room darkens and the bricks stay the same ("bricks don't change colour
  at night"), which is both a good rule and a good line.

### Buildable with Mantine on a static site
- **Works:** studs are one CSS mask; theme with an inline pre-paint script; components named against
  Mantine.
- **Fails:** two custom interactive pieces (the poster menu and a hosting "stages" slider with its own
  diagram), plus the hover-preview tutorials index. Each is buildable, but together they are more
  code than a docs site needs.

### Copy and tone
- **Works:** the best lines in either package: "so you can find out before step three that you
  needed it", "Mixed is a real answer", "it's worth being the grown-up in the room", "Not added to
  your shopping list. We checked."
- **Fails (minor):** uppercase display titles everywhere shout a little; some ledes are long.

## Design B

### First impression and personality
- **Works:** the hero is right. "Know what's in every box." plus a sentence naming the brands and a
  sentence on self-hosting covers what it is and who it's for before you scroll.
- **Fails:** one teal on cool white, used for ink, buttons, tiles and footer, reads as a tidy SaaS
  more than a workshop. Mint is the only second colour. It is calm but not playful, and the brief
  asked for both.

### Brick motif: system or decoration
- **Works:** a clear system with a good extra idea: **two views of a stud**. Side view (the stud row)
  is for things you press, stack or step through; top view (the baseplate dot grid) means "somewhere
  waiting for something" and appears only behind screenshot placeholders and the 404. The dashed
  coral gap as "a piece is out of place" is another good rule.
- **Works:** studs that rise on hover for rows and secondary buttons is a better interaction rule than
  studs on everything.
- **Fails (minor):** the features board has large empty tiles; at phone width the shopping-list tile
  has its drawn rows overlapping its heading (index--390-light).

### Legibility and accessibility
- **Works:** headings in order, `aria-current`, `aria-pressed`, `role="img"` placeholders with
  labels, reduced motion, skip link.
- **Fails:** all text is teal, captions are 13px, and the coral focus ring is only 3.2:1 on the
  surface tone, which is the floor. The header theme toggle is a tiny icon with a 12px "Light" label.

### Mobile
- **Works:** the phone docs navigation is the better pattern: one "Docs menu" bar that shows where you
  are and opens the list in place, plus a closed "On this page" disclosure. It scales to any number of
  pages.
- **Fails:** the phone menu is four grey bars and a teal one, with no theme control inside it.

### Docs experience
- **Works:** the stronger of the two. Config variables are grouped (must set, server, storage,
  catalog) with "Required" tags and shareable anchors; tutorials have a sidebar, "Tutorial 2 of 10 ·
  7 steps · Admins only", a parts box and "If something goes wrong"; the FAQ puts the short answer in
  bold first and leaves everything open.
- **Fails:** inner pages are visually flat. Apart from a small brick by the current sidebar item,
  nothing tells you which section you are in.

### Dark mode
- **Works:** designed, not inverted: deep teal-black, mint takes over as accent.
- **Fails:** monotone. Everything is a shade of the same teal, so hierarchy leans entirely on tone.

### Buildable
- **Works:** the most modest of the two. One live thing (a small SVG pile, about sixty lines of
  script), plain grids, ordinary components.

### Copy and tone
- **Works:** plain and specific, with good small jokes at the end of true sentences: "You are the
  fetch", "Birthday presents are safe", "a good moment to put the kettle on", "Got a spare evening and
  a server?"
- **Fails (minor):** "databases deserve a human in the room" and A's "grown-up in the room" are the same
  joke; I kept one.

### A note on the screenshots
Both packages show a strip of page ground below the footer in some full-page captures. I hit the same
thing: it comes from the browser's "capture beyond viewport" mode re-laying out the page, not from
either design's CSS. I did not count it against either.

## What I kept, what I dropped, and why

| Decision | Source | Why |
| --- | --- | --- |
| Colour = section (five bricks), neutral room, black ink | A | The strongest idea in either design, and it gives the docs real wayfinding. B's inner pages had none. |
| Hero copy and structure: headline, what it is, who it's for, two actions | B | The brief's first requirement. A's hero led with navigation. |
| A's section stack, kept in the hero beside the copy | A | It shows the concept in one glance and serves people who arrive with a problem. Now it supports the message instead of replacing it. |
| Softer palette: pink replaced by lavender, orange and green slightly calmer | New | Takes the candy edge off A's set while keeping five clearly different bricks, all 8:1+ with black text. |
| Albert Sans for everything, JetBrains Mono for code | B | More legible than Jost at docs sizes. Weight 800 headings in sentence case carry the personality A got from uppercase. |
| Mark and drawn wordmark | A (drawing reused, slightly reproportioned for the lockup) | Distinctive, has studs in it, uses `currentColor`, no font dependency. B's mark was a good idea but its wordmark was typed text. |
| Phone menu: full-height sheet of section bricks with descriptions and a worded theme control | A | Best component in either package. |
| Theme toggle System / Light / Dark | A, renamed per PM answer | Icons in the header, words in the menu and footer. Maps directly to Mantine's `auto` colour scheme. |
| Footer wordmark wall in section colours | A | The bin tipped out. The one place all five colours meet besides the hero stack. |
| Docs layout: sidebar, content, "On this page"; phone docs bar and "On this page" disclosure | B (layout), A (current item as a full brick in its colour) | B's phone pattern scales; A's current-item brick tells you where you are. |
| Coloured page head brick on every inner page | A | Instant section recognition on a phone mid-setup. |
| Grouped config tables, "Required" tags, per-variable anchors, stacked blocks on phones | B (grouping, anchors), A (stacked layout detail) | Easier to scan than one long table. I dropped A's live filter: with four short groups and the browser's find, it's code that isn't needed. |
| Tutorial page: meta line, goal, parts box, steps on 1×1 bricks, callouts, "If something goes wrong", "What next" brick, pager | B structure, A parts box and "What next" brick | The most complete template. |
| Tutorials index as grouped rows with step counts | B | Dropped A's hover preview: no screenshots to preview yet, and it's extra code. |
| FAQ: question left, bold short answer first, all open; "Not in version 1" and "Longer answers" aside | B layout, A aside | Scannable and honest. Dropped A's drawer tabs. |
| Screenshot placeholders on a baseplate (top-view dots) with a flat label chip | B | Best-designed placeholder; the "top view = waiting for something" rule is a good one. Captions use A's Screen / State / Viewport / Focus list, which reads better than inline bold. |
| Self-hosting as four bricks in running bond (an ordered list) | B | Dropped A's slider. Same information, no script, reads as a list to a screen reader. |
| One live thing: the build-state menu, CSS only | A's mechanism, B's restraint | A radio group and `:has()`: no script, keyboard-friendly, React state in the build. Dropped B's animated SVG pile and A's off-screen poster size. |
| The missing piece as a dashed outline | B's idea, recoloured | Means "a piece is out of place" (404 gap, missing-pieces chip, "mind this" callouts). Drawn in ink, not coral, so it works with any section colour and never depends on colour alone. |
| 404: "This piece isn't in the set." with the parts-line joke, beside a wall with one dashed gap | A copy, B art | Best line plus the clearest picture. |
| Dark mode: the room darkens, the bricks stay | A | A good rule that also simplifies the build: section colours have one value. |
| "What you won't find here" as one studded plate band with three items and a single "Not in version 1" line | A layout, B content | Short, as the brief asks. The full "not yet" list lives in the FAQ. |
| Closing CTA: a Setup-green brick, "Got a spare evening and a server?" | B headline, A colour logic | The call to action is the Setup section, so it is the Setup brick. |
| Dropped from both | | Uppercase display titles (A), teal-everything (B), A's hosting slider and hover previews, B's animated hero pile, coral as a UI colour, A's live config filter. |

## Things I had to correct in both

- Avoid stating the app's internal table names or script paths in docs examples. Both packages
  guessed at some; mine use visible placeholders (`<catalog tables>`, `<user>`) and SPEC.md lists
  every guess for the developer to check.
- Tap targets: some header and footer links in both were under 44px tall. In the final design,
  buttons, menu items, nav items, footer links and form controls are at least 44px tall. Dense
  reference lists ("On this page", breadcrumbs, the FAQ aside) and the header's icon theme toggle
  (38px) are smaller but at least 32px with spacing, above the WCAG 2.2 minimum of 24px; the phone
  versions of those controls are 44px or more.
