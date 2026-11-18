# Placeholders

Every place where the real app will be shown. This file is written by `tools/build.py` from the
`@shot` lines in `tools/src/`, so it always matches the pages.

## How a placeholder works

- **Frame.** A fixed-ratio box with a 1px `--line` border and a 3px radius. Desktop shots are 16:10,
  full phone screens are 9:19.5, tight phone crops are 4:5. The ratio is set on the frame, so nothing
  moves when the image arrives.
- **Until the image exists** the frame shows the baseplate (studs from above), a label (ID, screen
  name, shape and theme) and the **shot notes**.
- **Shot notes** sit inside the frame, on a light panel along its bottom edge: Screen, State,
  Viewport and theme, Focus. They are instructions for whoever takes the screenshot. They are part
  of the placeholder only and are never site content.
- **When the real image goes in**, the baseplate, the label and the shot notes all go. Nothing is
  shown under a real image. The step or section text beside it already says what it shows, and the
  alt text describes it for people who cannot see it.
- **Alt text** is on the baseplate layer (`role="img"` with `aria-label`) and moves to the `<img alt>`.

## File names and themes

`<id>-<slug>.<theme>.png`, lower case, in `public/screenshots/`. Example:
`lnd-01-set-detail-page.light.png` and `lnd-01-set-detail-page.dark.png`.

Capture desktop shots at 1440 wide and phone shots at 390 wide, both at 2x.

The site shows the file that matches the theme being viewed. **If only one theme exists, it shows
that file in both themes**, inside the same frame, and adds one small line under it: "Shown in the
light theme." (or dark). That is the only thing that ever appears under a real image. The frame's border is what makes a light screenshot look deliberate on a dark page, so
do not remove it. If just one can be taken, take the theme listed as "first choice" below. See
`states.html`, "Screenshots", for all three cases drawn out.

## Mocked placeholders

### SET-01: First visit: create the household

- **Used on:** `docs-setup.html`
- **Files:** `set-01-first-visit-create-the-household.light.png`, `set-01-first-visit-create-the-household.dark.png` (ratio 16:10; first choice for this spot: light)
- **Screen:** First visit: create household and admin.
- **State:** Brand-new install. The form is filled in with a sample household name but not yet submitted.
- **Viewport and theme:** Desktop, 1440 wide, light.
- **Focus:** The whole form. Center it and crop the empty margins.
- **Alt text:** The first-visit screen: a form asking for a household name and the details of the admin account.

### LND-01: Set detail page

- **Used on:** `index.html`
- **Files:** `lnd-01-set-detail-page.light.png`, `lnd-01-set-detail-page.dark.png` (ratio 16:10; first choice for this spot: light)
- **Screen:** Set detail page.
- **State:** One polybag set with five copies: one sealed, one built, two disassembled (one of them missing 4 pieces) and one mixed.
- **Viewport and theme:** Desktop, 1440 wide, light.
- **Focus:** The copies list, each row with its own state and place. Crop to the set header and the list; leave out the page footer.
- **Alt text:** The set detail page, showing one set with five copies listed beneath it, each with its own build state and place.

### LND-02: Shopping list, store-trip mode

- **Used on:** `index.html`
- **Files:** `lnd-02-shopping-list-store-trip-mode.light.png`, `lnd-02-shopping-list-store-trip-mode.dark.png` (ratio 9:19.5; first choice for this spot: dark)
- **Screen:** Shopping list in store-trip mode.
- **State:** About twelve missing parts across three sets, grouped by part and color, three checked off.
- **Viewport and theme:** Phone, 390 wide, dark.
- **Focus:** The part pictures and the large checkboxes. Full screen, no browser chrome.
- **Alt text:** The shopping list on a phone in store-trip mode: missing parts with pictures and large checkboxes, three already checked.

### T02-01: Catalog settings, before the first import

- **Used on:** `tutorial-import-catalog.html`
- **Files:** `t02-01-catalog-settings-before-the-first-import.light.png`, `t02-01-catalog-settings-before-the-first-import.dark.png` (ratio 16:10; first choice for this spot: light)
- **Screen:** Settings, Catalog.
- **State:** Fresh install. No import has ever run, the paste box is empty and Import is disabled.
- **Viewport and theme:** Desktop, 1440 wide, light.
- **Focus:** The paste box and the "never imported" status. Crop to the main column.
- **Alt text:** The catalog settings page on a new install: a status line saying no import has run, an empty paste box and a disabled Import button.

### T02-02: Catalog settings, files found

- **Used on:** `tutorial-import-catalog.html`
- **Files:** `t02-02-catalog-settings-files-found.light.png`, `t02-02-catalog-settings-files-found.dark.png` (ratio 16:10; first choice for this spot: light)
- **Screen:** Settings, Catalog.
- **State:** HTML pasted and checked. The list of found files is showing, with dates, and Import is enabled.
- **Viewport and theme:** Desktop, 1440 wide, light.
- **Focus:** The file list and the Import button. Crop out the pasted HTML, which is long and dull.
- **Alt text:** The catalog settings page after checking the pasted page: a list of files found with their dates, and an enabled Import button.

### T02-03: Catalog import in progress

- **Used on:** `tutorial-import-catalog.html`
- **Files:** `t02-03-catalog-import-in-progress.light.png`, `t02-03-catalog-import-in-progress.dark.png` (ratio 16:10; first choice for this spot: dark)
- **Screen:** Settings, Catalog, during an import.
- **State:** Import roughly 40% done, part images downloading.
- **Viewport and theme:** Desktop, 1440 wide, dark.
- **Focus:** The progress display and the current step label. Crop tight to it.
- **Alt text:** The catalog page during an import, with a progress bar at about 40 percent and a label saying part images are downloading.

### T02-04: Catalog search results

- **Used on:** `tutorial-import-catalog.html`
- **Files:** `t02-04-catalog-search-results.light.png`, `t02-04-catalog-search-results.dark.png` (ratio 9:19.5; first choice for this spot: light)
- **Screen:** Add a set, catalog search.
- **State:** A set number typed in, three results with cover images.
- **Viewport and theme:** Phone, 390 wide, light.
- **Focus:** The first result and its cover image. Full screen, no browser chrome.
- **Alt text:** The add-a-set search on a phone, showing three catalog results with cover pictures for a typed set number.

## Planned, for the nine tutorials that were not mocked

Same template as `tutorial-import-catalog.html`. One to three shots each is enough. IDs follow the
tutorial number. Screen names and states are my best guess from the brief and need checking against
the real app.

| ID | Tutorial | Screen | State | Viewport and theme | Focus | Alt text |
| --- | --- | --- | --- | --- | --- | --- |
| T01-01 | First run | First visit: create household and admin | Empty form on a new install | Phone, light | The two groups of fields, household then admin | The first-visit form on a phone, asking for a household name and admin details. |
| T01-02 | First run | Home, empty collection | Just after setup, no sets yet | Desktop, light | The empty state and its "Add a set" button | The home screen of a new household with no sets and a button to add the first one. |
| T03-01 | Add your first set | Add a set, catalog search | A set number typed, results with covers | Desktop, light | The search field and first result | Catalog search results for a set number, each with a cover picture. |
| T03-02 | Add your first set | Add a set, barcode scan | Camera view with a box barcode in frame | Phone, dark | The scan frame | The barcode scanner on a phone, pointed at a box barcode. |
| T03-03 | Add your first set | Add a set, manual entry | Form filled in for an off-brand set (brand, number, name, piece count) | Desktop, light | The brand field and the fields with no catalog match | The manual entry form filled in for a set from another brand. |
| T04-01 | Track several copies | Set detail page | One set, three copies in different states | Desktop, light | The copies list | A set with three copies, each with its own state and place. |
| T04-02 | Track several copies | Build-state menu, open | Menu open on one copy, "Built" selected | Phone, light, 4:5 crop | The six states and the check mark | The build-state menu open on a phone with six states and Built checked. |
| T05-01 | Missing pieces | Copy detail, add missing piece | Picker open on the set's inventory, one part chosen, quantity 2 | Desktop, light | Part pictures and the quantity control | The missing-piece picker showing the set's parts with pictures. |
| T05-02 | Missing pieces | Shopping list, store-trip mode | Twelve parts, three checked | Phone, dark | Checkboxes and part pictures | The shopping list in store-trip mode with large checkboxes. |
| T05-03 | Missing pieces | Shopping list, export menu | Export menu open: BrickLink XML, Rebrickable CSV, CSV | Desktop, light, 4:5 crop | The three export options | The export menu with three file formats. |
| T06-01 | Attach instructions | Set detail, instructions panel | One uploaded PDF, one saved link | Desktop, light | The three ways to add: upload, link, save from address | The instructions panel listing a PDF and a link, with buttons to add more. |
| T06-02 | Attach instructions | PDF viewer | A booklet open at a middle page, page jumper visible | Phone, light | The page jump control | An instruction PDF open on a phone with a control for jumping between pages. |
| T07-01 | Kid profile | People, add kid profile | Form with "kid profile" chosen | Desktop, light | The profile type choice | The add-person form with the kid profile option selected. |
| T07-02 | Kid profile | Set list, seen as a kid | The T04-01 collection viewed by the kid profile: no prices, one hidden set absent | Phone, light | The absence of prices and of the shopping list | The collection as a kid profile sees it, with no prices shown. |
| T08-01 | Wishlist | A person's wishlist | Four wishes, one marked "I bought this" by the viewer | Phone, light | The private mark and its "only you can see this" note | A wishlist with one item privately marked as bought. |
| T08-02 | Wishlist | "We got it" dialog | Confirming a wish becoming a set | Phone, light, 4:5 crop | The confirm button and what will be created | The dialog that turns a wish into a set in the collection. |
| T09-01 | Import from CSV | Import, column mapping | A spreadsheet uploaded, columns matched, two unmatched | Desktop, light | The mapping table | The CSV import screen matching spreadsheet columns to Brick Bin fields. |
| T09-02 | Import from CSV | Import, review | 40 rows ready, 2 needing attention | Desktop, light | The rows that need attention | The import review list with two rows flagged. |
| T10-01 | Collection value | Collection and value | Totals, paid against estimated, three stale values, sealed count | Desktop, dark | The paid and estimated totals side by side | The collection value page with totals and a list of stale values. |
