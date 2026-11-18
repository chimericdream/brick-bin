# Evaluation of Design A and Design B

I looked at every screenshot both designers supplied (53 for A, 46 for B), at phone and desktop
widths, and read their HTML, CSS, scripts, notes and token files. Each is judged against the brief.

**The short version.** Neither design wins outright, so I merged them. Design A has the stronger
identity and the better use of colour. Design B has the better structure, the better documentation
experience and the more useful hero. The final design is A's look carrying B's skeleton, with the
weak parts of both removed. It is described in `SPEC.md`.

## Design A: "Sorted by colour"

Charcoal and off-white, one typeface (Jost, uppercase at display size), and five bright brick
colours that each mean a section of the site.

| Criterion | What works | What fails |
| --- | --- | --- |
| First impression and personality | The most memorable of the two. The five-colour wall and the black type feel like a workshop with labelled bins. It is playful and not silly. | The hero is a huge wordmark over five navigation links. What the product is gets one sentence, and no brand other than "any brand" is named. A first-time visitor sees a menu before an explanation. Uppercase page titles ("CONFIGURATION") are louder than the brief's "warm". |
| Motif: system or decoration | A real system. Colour means section, in the hero, page heads, bullets, navigation markers and "next" links. Three stud scales with a rule for each. | The FAQ breaks its own rule: cards alternate pink and grey for no reason. The hand-drawn wordmark dots its i's with studs, which is nearer to a stud mark than it needs to be. Screenshot placeholders are flat grey boxes, the same as every other panel, so they don't read as "a picture goes here". |
| Legibility and accessibility | Near-black on off-white, 17:1. Clear 3px focus rings. Real radio group, real range input. | Jost has a low x-height, so the 13 to 15px captions, table text and footer are small in practice. Tutorial body text on desktop is visibly small. The section colours are about 2:1 against the light ground, and the header's current-page marker relies on them. |
| Mobile quality | The phone menu (five full-width section bricks) is the best single screen in either design. Docs sections as a row of three bricks is quick. | At 390px the features board overlaps itself (the "Build state" label sits under the "Mixed" row). "Configuration" is hyphenated into "Config-uration" in the docs tabs. The tutorials index repeats ten grey frames and runs to about 5,500px. |
| Docs experience | Section-coloured page heads make it obvious where you are. "On this page" is present. | A tutorial page has no list of the other tutorials. The configuration reference is one fourteen-row table with a script-driven filter, which is more machinery than fourteen rows need, and the variables you must set are not separated from the ones you can ignore. The FAQ is an accordion that opens one answer at a time, which hides most answers from someone scanning with a problem. |
| Dark mode | "Bricks don't change colour at night" is the right rule, and it works. Dark looks designed. | The 404 wall is dark grey on near-black and almost disappears. |
| Buildability | Tokens, one mask for studs, components map to Mantine. | Three things need more custom work than they earn: the self-hosting slider (script only, and a mostly empty panel), the `:has()` radio poster, and the hover-preview tutorials index. |
| Copy and tone | Dry and specific. "Not added to your shopping list. We checked." is the best line in either design. | Little to fault. Some captions are very small. |

## Design B: "One brick, seen from the side"

Teal ink on cool paper, mint as a second tone, coral for "a piece is out of place". Albert Sans and
JetBrains Mono.

| Criterion | What works | What fails |
| --- | --- | --- |
| First impression and personality | The hero says what Brick Bin is, who it is for, and names the brands. The live brick pile shows the product's main idea (build state, one tap) with a good line for each state. | A single teal reads as a calm finance or health product. It is tasteful, but it is the less playful of the two, and every page looks the same. |
| Motif: system or decoration | The clearest rules. Side view means "you can press or stack this". Top view (the baseplate dots) means "something is waiting", used only for placeholders and the 404. Coral means "out of place". Studs are always whole. | Callouts with studs blur the "pressable" rule. With one colour, the motif cannot help with wayfinding. |
| Legibility and accessibility | Albert Sans reads well at body size. Config tags, tabular numerals and a proper monospace for code. No-script behaviour is thought through. | Captions and table text at 13 to 14px. All text is teal, including body copy (8.4:1, which passes, but it is tiring over a long docs page). The coral focus ring is 3.2 to 3.5:1 on light surfaces, which only just passes. Coral "Required" tags look like errors. |
| Mobile quality | Config tables become tidy blocks. Tap targets are fine. | The landing page is about 10,300px long on a phone. The features board has a tile where the heading overlaps a row, and several tiles are mostly empty. The phone header's theme control is an unlabelled two-brick icon. Docs open with two stacked disclosures ("Docs menu", "On this page") before any content. |
| Docs experience | The best of the two by a distance. Tutorials have a grouped sidebar. Configuration is split into "The ones you must set", "Server", "Storage and limits" and "Catalog import", and every variable name is a shareable link. The tutorial has "If something goes wrong". The FAQ shows every answer, short answer first in bold. | On a 1440px screen the reading column is narrow and the type small, with wide empty margins. |
| Dark mode | Consistent. | Teal on teal on teal: surfaces sit close together and it feels murky. The theme toggle has two states, and the brief now needs three. |
| Buildability | The simplest to build. Plain grids, one mask, sixty lines of script for the hero. | Nothing significant. |
| Copy and tone | Clear voice rules ("say the fact first; the joke can be deleted without losing meaning"). "You are the fetch." "Birthday presents are safe." The "what you won't find here" list with "None", "$0" and "Not yet" is honest and funny. | The landing section headings are plainer than A's. |

## What I kept, and from where

| Kept | From | Why |
| --- | --- | --- |
| Colour means section: five brick colours on a neutral charcoal and off-white room, and bricks that don't change in dark mode | A | It is the idea that gives the site its own face, and it does a job: you know where you are. |
| Every inner page opens with a studded brick in its section colour | A | Gives the docs personality without touching the reading column. |
| The phone menu of five section bricks, and docs sections as a row of bricks on phones | A | One tap, no nested disclosure, and it teaches the colour code. |
| The footer wordmark wall in five colours | A | The one big, joyful moment on every page. |
| The stack of section bricks with Setup open | A, moved | It was A's hero. It is now the closing call to action, where "pick where to go next" is the right question. |
| The five-copies illustration and the small drawn chips on feature cards | A | They explain "set against copy" faster than a paragraph. |
| The parts-list joke on the 404 | A | Best line in either design. |
| A three-setting theme control | A | The PM asked for System, Light and Dark. |
| The hero: a plain statement of what it is, the brands, who it is for, and the live build-state pile | B | It answers the brief's first requirement. The pile is now in the five section colours on a dark field. |
| The baseplate (studs from above) for screenshot placeholders and the 404 | B | A second view of the same object with a clear meaning, and placeholders finally look like placeholders. |
| Whole studs only (`mask-repeat: round`), and the rule that studs mean "press or stack" | B | Tight, and easy for a developer to apply. |
| Docs structure: tutorials sidebar, grouped configuration tables, variable names as links, stacked blocks on phones, "If something goes wrong" | B | Better for people who arrive with a problem. |
| The FAQ with every answer open and the short answer in bold | B | Scannable, searchable, works with scripts off. |
| Self-hosting as four bricks in running bond | B | Readable at a glance with no script. |
| The "what you won't find here" ledger with "None", "$0" and "Not yet" | B | Honest and funny. |
| Albert Sans and JetBrains Mono | B | Better x-height than Jost for long docs pages, and code deserves a real monospace. |
| Most of the documentation and FAQ copy, and the voice rules | B, with A's best lines | B's docs copy was the more complete. |

## What I discarded, and why

| Discarded | From | Why |
| --- | --- | --- |
| The teal, mint and coral palette | B | Too quiet for "playful", and it cannot do wayfinding. |
| Coral as "out of place" | B | With five section colours, a sixth colour with a meaning is one too many, and coral sits between the orange and the pink. The same idea is now carried by a shape: **a dashed outline means something is missing or needs you.** |
| Jost, uppercase titles, the hand-drawn wordmark | A | Legibility at small sizes, tone, and distance from a stud mark. The wordmark is now plain bold text beside a new mark. |
| The wordmark-and-links hero | A | It did not say what the product is. |
| Both feature mosaics | A and B | Both had overlap bugs at 390px and empty tiles. A plain grid of nine equal cards cannot break. |
| The self-hosting slider, the `:has()` poster, the hover-preview tutorials index | A | Custom machinery that hides content. |
| The accordion FAQ and its offset tabs | A | Hides answers. |
| The single config table with a filter | A | Fourteen rows grouped by purpose need no filter. |
| Flat grey placeholders | A | Not distinguishable from panels. |
| Studs on callouts, the "Docs menu" disclosure on phones, the two-state theme control | B | See the tables above. |
| The decorative brick course divider | B | Decoration with no job, once colour is doing the work. |

## Things neither design had, added here

- **Type no smaller than 14px**, and body text at 17 to 18px, because both designs were small in the
  docs.
- **Non-colour cues for every current state** (weight, a tone step, a marker), because the section
  colours are about 2:1 on the light ground and cannot carry a state alone.
- **A rule for real screenshots that exist in only one theme** (see `PLACEHOLDERS.md` and the states
  sheet).
- **The PM's answers**: real repository, issue and licence links, MIT, the copyright line, plain
  links to Rebrickable and Tailscale, and "Mixed" explained correctly (the copy is no longer a set;
  its parts are in with everything else).
