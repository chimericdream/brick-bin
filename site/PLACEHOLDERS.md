# Placeholders

Every screenshot placeholder on the site, 26 in all. This file is generated from
`src/content/shots.ts` by `pnpm --filter brick-bin-site placeholders`. Edit that file, not this
one, then run the command.

## Adding a real screenshot

1. Capture it as described below: desktop shots at 1440 wide, phone shots at 390 wide, both at 2x.
   No browser chrome. Use made-up household data, never real names or email addresses.
2. Save it as `site/public/screenshots/<file>`, using the file name listed. `.light.png` is the
   light theme and `.dark.png` the dark one.
3. Rebuild. The placeholder (baseplate, label and shot notes) is replaced by the image, inside the
   same fixed-ratio frame, with the caption below it.

One theme is enough. If only one file exists, the site shows it in both themes, and in the other
theme the caption adds "Shown in the light theme." (or dark). If you can only take one, take the
"first choice" theme. Keep the caption and alt text in `shots.ts` true to what the image shows.

## The placeholders

### LND-01: Set detail page

- **Used on:** `/`
- **Files:** `lnd-01-set-detail-page.light.png`, `lnd-01-set-detail-page.dark.png` (desktop, ratio 16:10; first choice: light)
- **Screen:** Set detail page.
- **State:** One polybag set with five copies: one sealed, one built, two disassembled (one of them missing 4 pieces) and one mixed.
- **Viewport and theme:** Desktop, 1440 wide, light.
- **Focus:** The copies list, each row with its own state and place. Crop to the set header and the list; leave out the page footer.
- **Alt text:** The set detail page, showing one set with five copies listed beneath it, each with its own build state and place.
- **Caption under the real image:** One set, five copies, each with its own build state and place.

### LND-02: Shopping list, store-trip mode

- **Used on:** `/`
- **Files:** `lnd-02-shopping-list-store-trip-mode.light.png`, `lnd-02-shopping-list-store-trip-mode.dark.png` (phone, ratio 9:19.5; first choice: dark)
- **Screen:** Shopping list in store-trip mode.
- **State:** About twelve missing parts across three sets, grouped by part and color, three ticked.
- **Viewport and theme:** Phone, 390 wide, dark.
- **Focus:** The part pictures and the large checkboxes. Full screen, no browser chrome.
- **Alt text:** The shopping list on a phone in store-trip mode: missing parts with pictures and large checkboxes, three already checked.
- **Caption under the real image:** Store-trip mode: the shopping list as a checklist on your phone.

### SET-01: First visit: create the household

- **Used on:** `/docs/setup/`
- **Files:** `set-01-first-visit-create-the-household.light.png`, `set-01-first-visit-create-the-household.dark.png` (desktop, ratio 16:10; first choice: light)
- **Screen:** First visit: "Set up your bin".
- **State:** Brand-new install. The form is filled in with a sample household name but not yet submitted.
- **Viewport and theme:** Desktop, 1440 wide, light.
- **Focus:** The whole form. Center it and crop the empty margins.
- **Alt text:** The first-visit screen: a form asking for a household name and the details of the admin account.
- **Caption under the real image:** The first visit: name the household and create the admin account.

### T01-01: First visit, on a phone

- **Used on:** `/tutorials/first-run/`
- **Files:** `t01-01-first-visit-on-a-phone.light.png`, `t01-01-first-visit-on-a-phone.dark.png` (phone, ratio 9:19.5; first choice: light)
- **Screen:** First visit: "Set up your bin".
- **State:** Empty form on a new install.
- **Viewport and theme:** Phone, 390 wide, light.
- **Focus:** The four fields: household name, your name, email and password, then Create household. Full screen, no browser chrome.
- **Alt text:** The first-visit form on a phone, asking for a household name, your name, an email and a password.
- **Caption under the real image:** The first visit, on a phone.

### T01-02: Library, before the first set

- **Used on:** `/tutorials/first-run/`
- **Files:** `t01-02-library-before-the-first-set.light.png`, `t01-02-library-before-the-first-set.dark.png` (desktop, ratio 16:10; first choice: light)
- **Screen:** Library.
- **State:** Just after Create household. No sets yet.
- **Viewport and theme:** Desktop, 1440 wide, light.
- **Focus:** The "No sets yet" message and its "Add your first set" link, with the sidebar.
- **Alt text:** The library of a new household with no sets, a link to add the first one, and the sidebar.
- **Caption under the real image:** A new household, before its first set.

### T02-01: Catalog settings, before the first import

- **Used on:** `/tutorials/import-catalog/`
- **Files:** `t02-01-catalog-settings-before-the-first-import.light.png`, `t02-01-catalog-settings-before-the-first-import.dark.png` (desktop, ratio 16:10; first choice: light)
- **Screen:** Settings, Catalog.
- **State:** Fresh install. "Never imported", the 6 GB warning with free disk space, an empty paste box and a disabled "Check the page" button.
- **Viewport and theme:** Desktop, 1440 wide, light.
- **Focus:** The "Never imported" heading and the paste box. Crop to the main column.
- **Alt text:** The catalog settings page on a new install: a heading saying it was never imported, a note about the 6 GB download, an empty paste box and a disabled button.
- **Caption under the real image:** The Catalog page before the first import.

### T02-02: Catalog settings, files found

- **Used on:** `/tutorials/import-catalog/`
- **Files:** `t02-02-catalog-settings-files-found.light.png`, `t02-02-catalog-settings-files-found.dark.png` (desktop, ratio 16:10; first choice: light)
- **Screen:** Settings, Catalog.
- **State:** Page source pasted and checked. The "This will download" summary is showing, with the Import catalog button.
- **Viewport and theme:** Desktop, 1440 wide, light.
- **Focus:** The summary and the Import catalog button. Crop out the pasted source, which is long and dull.
- **Alt text:** The catalog settings page after checking the pasted page: a summary of what the import will download, and an Import catalog button.
- **Caption under the real image:** After the check: what Brick Bin will download, and the Import catalog button.

### T02-03: Catalog import in progress

- **Used on:** `/tutorials/import-catalog/`
- **Files:** `t02-03-catalog-import-in-progress.light.png`, `t02-03-catalog-import-in-progress.dark.png` (desktop, ratio 16:10; first choice: dark)
- **Screen:** Settings, Catalog, during an import.
- **State:** Import running, roughly 40% of the files done, part images downloading.
- **Viewport and theme:** Desktop, 1440 wide, dark.
- **Focus:** The "Import running" line, the progress bar and the step label. Crop tight to it.
- **Alt text:** The catalog page during an import, with a progress bar at about 40 percent and a label saying which file is downloading.
- **Caption under the real image:** An import under way.

### T02-04: Catalog search results

- **Used on:** `/tutorials/import-catalog/`
- **Files:** `t02-04-catalog-search-results.light.png`, `t02-04-catalog-search-results.dark.png` (phone, ratio 9:19.5; first choice: light)
- **Screen:** Add a set, "Look up a LEGO set".
- **State:** A set number typed in, three catalog matches listed.
- **Viewport and theme:** Phone, 390 wide, light.
- **Focus:** The search field and the first match. Full screen, no browser chrome.
- **Alt text:** The add-a-set lookup on a phone, showing three catalog matches for a typed set number, each with its name, number, year and piece count.
- **Caption under the real image:** Catalog lookup, with the set you looked for.

### T03-01: Add a set, catalog lookup

- **Used on:** `/tutorials/add-a-set/`
- **Files:** `t03-01-add-a-set-catalog-lookup.light.png`, `t03-01-add-a-set-catalog-lookup.dark.png` (desktop, ratio 16:10; first choice: light)
- **Screen:** Add a set.
- **State:** A LEGO set picked from the lookup: the form is filled in and the "Linked to Rebrickable set" note is showing.
- **Viewport and theme:** Desktop, 1440 wide, light.
- **Focus:** The lookup panel and the filled-in fields beneath it.
- **Alt text:** The add-a-set form filled in from a catalog match, with a note saying it is linked to a Rebrickable set.
- **Caption under the real image:** A set picked from the catalog fills the form in for you.

### T03-02: Add a set, barcode scan

- **Used on:** `/tutorials/add-a-set/`
- **Files:** `t03-02-add-a-set-barcode-scan.light.png`, `t03-02-add-a-set-barcode-scan.dark.png` (phone, ratio 9:19.5; first choice: dark)
- **Screen:** Add a set, "Scan the barcode on the box".
- **State:** Camera view with a box barcode in frame.
- **Viewport and theme:** Phone, 390 wide, dark, in a browser that supports barcode scanning.
- **Focus:** The camera view and the barcode. Full screen, no browser chrome.
- **Alt text:** The barcode scanner on a phone, pointed at the barcode on a set box.
- **Caption under the real image:** Scanning the barcode on a box.

### T03-03: Add a set, by hand

- **Used on:** `/tutorials/add-a-set/`
- **Files:** `t03-03-add-a-set-by-hand.light.png`, `t03-03-add-a-set-by-hand.dark.png` (desktop, ratio 16:10; first choice: light)
- **Screen:** Add a set.
- **State:** Filled in by hand for a set from another brand: new brand, set number, name and piece count.
- **Viewport and theme:** Desktop, 1440 wide, light.
- **Focus:** The Brand field and the set fields beneath it.
- **Alt text:** The add-a-set form filled in by hand for a set from another brand.
- **Caption under the real image:** Typing in a set from another brand.

### T04-01: Set page with three copies

- **Used on:** `/tutorials/copies-and-build-state/`
- **Files:** `t04-01-set-page-with-three-copies.light.png`, `t04-01-set-page-with-three-copies.dark.png` (desktop, ratio 16:10; first choice: light)
- **Screen:** Set detail page, Copies.
- **State:** One set, three copies with different owners, places and build states.
- **Viewport and theme:** Desktop, 1440 wide, light.
- **Focus:** The Copies list. Crop to the set header and the three copies.
- **Alt text:** A set with three copies, each with its own owner, place and build state.
- **Caption under the real image:** Three copies of one set, in three states.

### T04-02: Build-state menu, open

- **Used on:** `/tutorials/copies-and-build-state/`
- **Files:** `t04-02-build-state-menu-open.light.png`, `t04-02-build-state-menu-open.dark.png` (crop, ratio 4:5; first choice: light)
- **Screen:** Set detail page, the build-state menu on one copy.
- **State:** Menu open, Built checked.
- **Viewport and theme:** Phone, 390 wide, light, cropped to 4:5.
- **Focus:** The six states, their hints and the check mark.
- **Alt text:** The build-state menu open on a phone, listing six states with Built checked.
- **Caption under the real image:** The build-state menu.

### T05-01: Missing pieces, picking from the set

- **Used on:** `/tutorials/missing-pieces/`
- **Files:** `t05-01-missing-pieces-picking-from-the-set.light.png`, `t05-01-missing-pieces-picking-from-the-set.dark.png` (desktop, ratio 16:10; first choice: light)
- **Screen:** A copy’s Missing pieces page, "Add missing pieces", Set parts tab.
- **State:** The set’s parts listed with pictures, a quantity of 2 entered on one part.
- **Viewport and theme:** Desktop, 1440 wide, light.
- **Focus:** The part pictures and the quantity control.
- **Alt text:** The missing-piece picker showing the set’s parts with pictures and a quantity field.
- **Caption under the real image:** Picking a missing part from the set’s own inventory.

### T05-02: Store-trip mode, part-way through

- **Used on:** `/tutorials/missing-pieces/`
- **Files:** `t05-02-store-trip-mode-part-way-through.light.png`, `t05-02-store-trip-mode-part-way-through.dark.png` (phone, ratio 9:19.5; first choice: dark)
- **Screen:** Shopping list, store-trip mode.
- **State:** Twelve parts, three ticked, the "3 of 12 ticked" bar and the Done button at the bottom.
- **Viewport and theme:** Phone, 390 wide, dark.
- **Focus:** The checkboxes, the part pictures and the Done bar. Full screen, no browser chrome.
- **Alt text:** The shopping list in store-trip mode on a phone, with large checkboxes and three parts ticked.
- **Caption under the real image:** Store-trip mode, part-way through a trip.

### T05-03: Shopping list, export

- **Used on:** `/tutorials/missing-pieces/`
- **Files:** `t05-03-shopping-list-export.light.png`, `t05-03-shopping-list-export.dark.png` (crop, ratio 4:5; first choice: light)
- **Screen:** Shopping list, Export opened.
- **State:** The three formats showing: BrickLink wanted list, Rebrickable parts list, plain CSV.
- **Viewport and theme:** Phone, 390 wide, light, cropped to 4:5.
- **Focus:** The three export links.
- **Alt text:** The shopping list’s export choices: a BrickLink wanted list, a Rebrickable parts list and a plain CSV file.
- **Caption under the real image:** The three export formats.

### T06-01: Set page, instructions

- **Used on:** `/tutorials/instructions/`
- **Files:** `t06-01-set-page-instructions.light.png`, `t06-01-set-page-instructions.dark.png` (desktop, ratio 16:10; first choice: light)
- **Screen:** Set detail page, Instructions.
- **State:** One uploaded PDF and one saved link, with the three buttons to add more.
- **Viewport and theme:** Desktop, 1440 wide, light.
- **Focus:** The two items and the Upload PDF, Add link and Save PDF from a link buttons.
- **Alt text:** The instructions section of a set, listing a PDF and a link, with buttons to upload a PDF, add a link or save a PDF from a link.
- **Caption under the real image:** A set’s instructions: one PDF and one link.

### T06-02: Save a PDF from a link

- **Used on:** `/tutorials/instructions/`
- **Files:** `t06-02-save-a-pdf-from-a-link.light.png`, `t06-02-save-a-pdf-from-a-link.dark.png` (crop, ratio 4:5; first choice: light)
- **Screen:** Set detail page, "Save a PDF from a link" dialog.
- **State:** A PDF address and a name typed in, the download under way.
- **Viewport and theme:** Phone, 390 wide, light, cropped to 4:5.
- **Focus:** The address field and the progress bar.
- **Alt text:** The dialog for saving a PDF from a web address, with the address filled in and a progress bar.
- **Caption under the real image:** Brick Bin downloading a PDF from a web address.

### T07-01: People, add a kid profile

- **Used on:** `/tutorials/kid-profile/`
- **Files:** `t07-01-people-add-a-kid-profile.light.png`, `t07-01-people-add-a-kid-profile.dark.png` (desktop, ratio 16:10; first choice: light)
- **Screen:** Settings, People, "Add a person".
- **State:** Name, email and password filled in, Role set to "Kid profile: read-only, own wishlist".
- **Viewport and theme:** Desktop, 1440 wide, light.
- **Focus:** The Role choice.
- **Alt text:** The add-a-person form with the kid profile role selected.
- **Caption under the real image:** Adding a kid profile.

### T07-02: Library, seen by a kid profile

- **Used on:** `/tutorials/kid-profile/`
- **Files:** `t07-02-library-seen-by-a-kid-profile.light.png`, `t07-02-library-seen-by-a-kid-profile.dark.png` (phone, ratio 9:19.5; first choice: light)
- **Screen:** Library, signed in as the kid profile.
- **State:** The same collection as T04-01, seen by the kid: no prices, no Shopping list tab, and one hidden set absent.
- **Viewport and theme:** Phone, 390 wide, light.
- **Focus:** The tab bar with only Library and Wishlist, and the set tiles. Full screen, no browser chrome.
- **Alt text:** The library as a kid profile sees it on a phone, with only the Library and Wishlist tabs.
- **Caption under the real image:** The collection as a kid profile sees it.

### T08-01: Wishlist with a private mark

- **Used on:** `/tutorials/wishlist/`
- **Files:** `t08-01-wishlist-with-a-private-mark.light.png`, `t08-01-wishlist-with-a-private-mark.dark.png` (phone, ratio 9:19.5; first choice: light)
- **Screen:** Wishlist, another person’s list.
- **State:** Four wishes, one of them marked "I bought this" by the person viewing.
- **Viewport and theme:** Phone, 390 wide, light.
- **Focus:** The marked wish and the note that only you can see it. Full screen, no browser chrome.
- **Alt text:** A wishlist with one item privately marked as bought by the viewer.
- **Caption under the real image:** A wish privately marked "I bought this".

### T08-02: "We got it" dialog

- **Used on:** `/tutorials/wishlist/`
- **Files:** `t08-02-we-got-it-dialog.light.png`, `t08-02-we-got-it-dialog.dark.png` (crop, ratio 4:5; first choice: light)
- **Screen:** Wishlist, "We got" dialog.
- **State:** Confirming a wish: Brand chosen, "Add a sealed copy" ticked.
- **Viewport and theme:** Phone, 390 wide, light, cropped to 4:5.
- **Focus:** The two checkboxes and the Add to the collection button.
- **Alt text:** The dialog that turns a wish into a set in the collection, with options to add a sealed copy and hide it from kid profiles.
- **Caption under the real image:** "We got it" turns the wish into a set.

### T09-01: CSV import, choosing the columns

- **Used on:** `/tutorials/csv-import/`
- **Files:** `t09-01-csv-import-choosing-the-columns.light.png`, `t09-01-csv-import-choosing-the-columns.dark.png` (desktop, ratio 16:10; first choice: light)
- **Screen:** Import.
- **State:** A spreadsheet chosen, File format set to "Other CSV (choose the columns)", columns matched.
- **Viewport and theme:** Desktop, 1440 wide, light.
- **Focus:** The column choices.
- **Alt text:** The CSV import screen matching a spreadsheet’s columns to Brick Bin’s fields.
- **Caption under the real image:** Matching spreadsheet columns to Brick Bin fields.

### T09-02: CSV import, preview

- **Used on:** `/tutorials/csv-import/`
- **Files:** `t09-02-csv-import-preview.light.png`, `t09-02-csv-import-preview.dark.png` (desktop, ratio 16:10; first choice: light)
- **Screen:** Import, Preview.
- **State:** Forty rows ready, two with a problem.
- **Viewport and theme:** Desktop, 1440 wide, light.
- **Focus:** The preview table, the two rows with a problem, and the Import button.
- **Alt text:** The import preview: a table of rows saying what will happen to each, with two rows showing a problem.
- **Caption under the real image:** The preview, before anything is saved.

### T10-01: Collection and value

- **Used on:** `/tutorials/collection-value/`
- **Files:** `t10-01-collection-and-value.light.png`, `t10-01-collection-and-value.dark.png` (desktop, ratio 16:10; first choice: dark)
- **Screen:** Collection.
- **State:** A few dozen copies: paid, estimated value and difference, the breakdowns, and three values not set in over a year.
- **Viewport and theme:** Desktop, 1440 wide, dark.
- **Focus:** The Paid, Estimated value and Difference totals side by side.
- **Alt text:** The collection page with totals for paid and estimated value, breakdowns by brand and theme, and a list of values that need updating.
- **Caption under the real image:** Paid against estimated value, with the values that need a fresh look.
