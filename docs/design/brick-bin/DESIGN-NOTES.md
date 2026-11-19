# Design notes: Brick Bin app, Designer 1

Concept: **Sorted by state.** The room is neutral. The bricks carry the color, and in the app a
brick color means a build state.

Open `mockups/index.html` to see everything. `SPEC.md` is the developer handoff, `TOKENS.md` has the
values, `PROPOSALS.md` holds ideas that need new features.

## 1. Critique of the current app

I looked at every screen in the inputs' index: all of them at desktop width, the main ones at phone
width too, and the Library in dark. The app is sound. Its problem is that nothing in it was decided
for this product.

**What is weak**

1. **It could be any admin panel.** A blue primary button, a pale blue-grey ground, 12px-radius white
   cards, a sidebar with a tinted current item. Change the logo and it is a CRM. The marketing site
   is charcoal, off-white and five loud bricks. The app shares none of that: a different typeface,
   a different color logic, round corners where the site has molded edges, and no bricks at all
   outside the logo.
2. **The most important fact is the quietest thing on the screen.** Build state is what people come
   to check and change. It is shown as small pastel pills that look like every status pill in every
   app. Sealed is grey, built is pale green, in progress is pale blue. Nothing about them says
   "bricks", and on a phone they are hard to tell apart at a glance.
3. **The Library wastes the phone.** Two cards per row, each with a large cover, wrapped two-line
   names and badges that stack differently per card. Rows end ragged, there is a stray grey "shelf"
   bar under each row, and you see three or four sets per screen. Above the list sit a title, two
   buttons, a Filters button, a search field and a sort select, each on its own line.
4. **Copies are tall and repetitive.** One copy on a phone takes more than a full screen: five
   labeled blocks stacked with a lot of air. A set with five copies would be six screens long.
5. **Forms and filters are laid out for a desktop.** The shopping list shows five selects, Apply and
   Export before the first part on a phone. The wishlist puts a seven-field form above the lists,
   so the thing you came to read starts below the fold on every visit.
6. **Settings hides its own contents.** Six tabs in a row on a phone means some are off-screen, and
   "Settings" opens on Places for no stated reason.
7. **Warnings are red everywhere.** "Missing 12 pieces", "Remove copy", "Delete" and error banners
   all use the same reds, so a routine fact (a piece is missing) looks as alarming as a destructive
   action.
8. **Empty and edge states are one grey sentence in a box.** "The trash is empty." "No instructions
   saved for this set yet." They work, and they are the places where a product can sound like itself.
9. **Small things.** Text at 11 and 12px in hints and meta lines. A monospace-looking slashed zero in
   every number, including prices. Mixed UK and US spelling ("Colour", "ticked"). The 404 has three
   unlabeled rectangles that are not quite bricks.

**What is worth keeping**

- The information model on screen: one page per set, one card per copy, the state menu on the copy.
- The vocabulary and nearly every control label. They are plain and the tests depend on them.
- The Rebrickable credit wherever catalog data shows.
- Per-copy state in the library, the "sets have missing pieces" link, counts on every filter.
- The store-trip mode idea: big pictures, big checkboxes, a count at the bottom.
- The confirm-then-trash pattern and its wording.
- Dense, honest tables on the Collection page, with zeros printed as zeros.

**What the redesign has to do**

- Look like the site's sibling within one second: same charcoal and off-white, same typeface, same
  3px molded corner, same stud row.
- Make build state the most recognizable thing in the app, by color, shape and word together.
- Show two to three times as many sets per phone screen, with rows that line up.
- Put the main action of each screen within thumb reach and the list near the top.
- Keep every field, number and action. Add none.

## 2. The concept, and why it fits

The site's idea is "Sorted": everyone ends up sorting a tub of bricks, mostly by color, so each site
section is a brick of its own color.

An app has no sections in that sense. What a household sorts in the app is its **copies**, and the
thing they sort by is **build state**. So the app keeps the site's rule and changes what it points
at: a bright brick color means a build state, and nothing else in the app is bright.

The site has five section colors and one grey "stranger" brick that appears only when a set is Mixed.
The app has six build states. That is the whole palette, with nothing invented:

| State | Brick | Why this one |
| --- | --- | --- |
| Sealed | Tan `#D8BC88` | Cardboard |
| Opened | Pink `#F49AC1` | The lightest of the five: bags out, nothing built |
| In progress | Orange `#FF8C1A` | Work under way |
| Built | Green `#6CC04A` | Done. Also the brick in the logo's bin |
| Disassembled | Blue `#4DB3E6` | Cool and tidy: apart on purpose |
| Mixed | Grey `#A0A5A9` | The site's stranger brick: no longer one set |

Each state also has a small glyph drawn from bricks (a taped box, a box with its lid up, a
half-built stack, a finished stack, loose bricks in a row, a tub with pieces askew) and always its
word. Color, shape and word together, so nothing depends on color.

Everything else is the site's room: off-white or charcoal, near-black ink, one typeface, tone steps
instead of shadows. The app's chrome uses no hue at all.

**The signature element is the sorter.** At the top of the Library the six states sit as six bricks
with their counts. They are the build-state filter (which exists today as a checkbox group), so one
tap answers "what's still sealed?" The same six bricks become a proportional wall on the Collection
page and the row of choices in the state menu. This is the one thing in the app that could not
belong to another product.

**Why it fits daily use.** Color sits on data, so a screen full of sets is scannable by state without
reading. The chrome stays out of the way. The brick motif shows up where it means something
("press this", "you are here", "waiting", "missing") and never in tables or forms.

## 3. How it relates to the marketing site

**Carried over unchanged**

- The mark (brick in a bin) and the live-text wordmark, Albert Sans 800.
- Albert Sans for everything, JetBrains Mono for identifiers. Same font files.
- Every room token by name and value: `--ground`, `--surface`, `--surface-2`, `--line`, `--ink`,
  `--muted`, the `--field` set, the focus colors. Light and dark.
- The six brick colors, exact values.
- The 3px radius on everything. No shadows on resting surfaces.
- The stud row, built the same way (a masked `::before`, whole studs only).
- The four motif meanings: stud row, 1×1, baseplate, dashed outline.
- Primary buttons are ink bricks with studs. They lift 2px on hover and squash on press.
- The "field": a surface that is dark in both themes. The site uses it for the hero and footer. The
  app uses it for the page head, the phone tab bar, toasts and the sign-in panel.
- The voice: fact first, dry, numbers over adjectives, no exclamation marks.
- The sign-in panel reuses the site's headline and the hero pile in its Built state. The 404 reuses
  the site's wall with a missing brick.

**Adapted for an app**

- **What color means.** On the site a brick color is a section. In the app it is a build state. This
  is the one rule I changed, and it is the center of the design.
- **The page head** is the site's page-head brick, but always on the field (charcoal) instead of a
  section color, and much shorter: a 26 to 32px title where the site uses 34 to 60.
- **Type scale.** The site reads at 17 to 18px with 60 to 84px display type. The app works at 16px
  with a 32px ceiling. The 14px floor stays.
- **Two added room tokens.** `--paper` (white, or a step above the dark ground) for lists, tables,
  inputs and dialogs, so data sits on the cleanest surface. `--edge`, a border that reaches 3:1, for
  inputs and checkboxes. The site has neither because it has almost no form controls.
- **A danger color.** The site never deletes anything. The app needs one red for destructive
  actions and errors. It is a text and fill color only. There is no red brick, and a danger button
  never has studs.
- **One shadow.** Menus, dialogs and toasts float, so they use the site's reserved `--shadow-float`.
- **The 1×1** is ink, never colored, because color is taken. It marks the current nav item.

**Left on the site**

- The footer wall spelling BRICK BIN, the closing stack, section bricks, the animated pile.
- Display-size type, two-column editorial section heads, the running-bond steps.
- Eyebrows, numbered tutorial bricks, "next" bricks.

## 4. The brick-motif rules, in short

Full rules with placements per breakpoint are in `SPEC.md` section 3.

| Element | Means | Appears on |
| --- | --- | --- |
| Stud row | "Press this" (one per block) or "this is a place" | Primary buttons, state buttons, the sorter, page heads, the phone tab bar, the filled part of a progress bar, the state wall |
| 1×1 | "You are here" | The current sidebar item |
| Baseplate | "Something is waiting to go here" | Empty states, a missing cover, behind the 404 wall |
| Dashed outline | "Something is missing, or needs you" | Missing-pieces tags, warnings that will catch you out, failed-action toasts, the 404 parts line |

Never: in table cells, behind text, on quiet or danger buttons, on form fields, on cards, as dividers
or backgrounds, scattered as decoration. A read-only state tag has no studs. A disabled button loses
its studs. A kid's view shows state as a tag because a kid cannot change it, so the difference
between "pressable" and "not" is visible in the shape.

## 5. Type and color reasoning

- **One family.** Albert Sans at 400, 600, 650, 700, 750 and 800. Titles are 800 with tight tracking,
  as on the site. Body is 16px on every width, which also satisfies the 16px minimum for inputs on
  phones.
- **JetBrains Mono has one job:** identifiers a person may have to match against a box or a web page
  (set numbers, part numbers, element ids, catalog ids, file names). Prices and counts stay in Albert
  Sans with tabular figures, so money reads as money.
- **The floor is 14px.** The brief allows 13. The site says 14, and one floor across both is simpler.
- **Ink does the work.** All running text is `--ink`. `--muted` is for secondary lines and passes
  6.2:1 on every surface it sits on.
- **Brick colors are fills with ink text on them** (7.5:1 to 10.2:1). They are never text colors and
  never tints.
- **Dark mode** darkens the room and leaves the bricks alone. The field goes a step darker than the
  ground, so the page head still reads as a separate block.

## 6. Density and responsive behavior

- **Phone (under 768).** A top bar that scrolls away, a page-head brick, content, and a fixed tab bar.
  The Library is a list of rows: an 88px cover, name, one meta line, state tags. About six sets per
  screen where the current app shows three or four. Dialogs are bottom sheets with the main action
  on top. Forms pin their Save bar above the tab bar. Long filter sets live in a sheet.
- **Tablet (768 to 1023).** The sidebar folds to a 96px rail of icons over labels. Set tiles appear,
  three across. The page head stacks.
- **Desktop (1024 and up).** A 248px labeled sidebar. The Library gets its filter column; the sorter
  goes six across from 1240. Copies lay their four facts in a row. The wishlist form sits in a
  sticky right column.
- **One set of markup per component.** A set is the same `li` as a row and as a tile. A copy is the
  same card with its facts stacked or in columns.
- Rows are 48 to 96px. Controls are 48px tall on phones and 44px from 1024. Nothing a finger has to
  hit is under 44px.

## 7. Structural changes worth knowing about

These change where things are, and none adds a feature. Each is listed again in `SPEC.md`.

1. **Build-state filter moves out of the checkbox list** into the sorter at the top of the Library.
2. **Library tiles group copies by state** ("Sealed ×5") in place of one numbered badge per copy.
   Per-copy detail is one tap away on the set page.
3. **Settings home is a list of its six areas.** On desktop the list sits beside the content and
   replaces the tab row. On a phone it is the first screen, so every area is visible and reachable.
4. **The wishlist form** is a right column on desktop and a sheet on phones, so the lists come first.
5. **Shopping-list filters** go into a sheet below 1024, and the three exports become one Export menu.
6. **The theme choice** is a three-way control (System, Light, Dark) in the sidebar, and on the More
   page on phones. It leaves the phone top bar.
7. **Missing pieces are dashed, and ink.** Red is kept for destructive actions and errors.

## 8. What I chose not to do

- **No dark sidebar.** The field is strong enough once per screen. A full-height charcoal sidebar on
  a light page would make the app heavier than the site.
- **No section colors.** A green Library and an orange Shopping list would match the site more
  literally and would leave no clean way to color build states.
- **No tinted state pills.** Pale tints with colored text are what every app does, and on the site's
  pale bricks they would fail contrast.
- **No illustration per empty state.** The baseplate is the illustration. One motif, one meaning.
- **No animation on load, no skeleton shimmer, no confetti when a set is finished.**
- **No grid and list toggle, no dashboard home.** Each needs something the app does not have. See
  `PROPOSALS.md`.
- **No icons in colored circles, no gradient, no glass.** The only pictures are covers, parts and
  bricks.

## 9. Process notes

- I used the design skill available to me (its app-screen guidance and inspector). Its style deal
  suggested an achromatic chrome with color on the data, which is the same instinct as the site's
  "calm room, loud bricks". Two of its house rules I overrode on purpose, for the brand: a dark page
  head on every page, and saturated state fills in place of pale tints.
- From the injected `CLAUDE.md` and `AGENTS.md`: I followed the stack rules (Mantine, no Tailwind,
  no CDN, self-hosted fonts, CSS variables) and the "no LEGO trade dress" rule. The current fonts
  and `--app-*` tokens described there are replaced, as the brief asked.
- Covers and part pictures in the mockups are generated stand-ins. Real box art and part renders
  replace them, and the cover frame accepts any shape.
