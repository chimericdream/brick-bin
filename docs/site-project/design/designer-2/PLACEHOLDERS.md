# Screenshot placeholders

Every place the site shows the real app is a designed placeholder for now: a flat brick-shaped frame
(studs on its top edge) with the ID, the screen name and the capture spec printed on it. Each frame
has a fixed `aspect-ratio`, so swapping in the real image will not move the layout. The real image
goes inside the same frame: same studs, same 3px corners, no border or shadow.

**File names.** `screenshots/<id>-<slug>.png`, lower case, for example
`lnd-01-set-detail.png`. Capture at 2x. Desktop shots at a 1440px-wide window; phone shots at a 390px
viewport. Crop to the ratio given, not to the full window.

**Captions.** On the site, the caption under each image is the four-part `dl` you see in the mockups
(Screen, State, Viewport, Focus) only while it is a placeholder. When the real image lands, replace
the `dl` with a one-line caption that says what the picture shows (suggested captions below), and
move the `aria-label` text into the image's `alt`.

**Sample data to use in every shot.** Household "Harbour Road", admin "Sam", a polybag set with
five copies (one sealed in the hall cupboard, one built on the living-room shelf, three disassembled
in the blue tub, one of those missing 4 pieces). This matches the landing page copy.

| ID | File name | Page | Ratio | Screen | State to capture | Viewport and theme | Focus and crop | Alt text | Caption when real |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| LND-01 | `lnd-01-set-detail.png` | Landing, under the features board | 16:10 | Set detail page | One polybag set with five copies: one sealed, one built, three disassembled, one of those missing 4 pieces | Desktop, light | The copies list, each copy with its own state and place. Crop to the set header and the list | Brick Bin's set detail page for a polybag set with five copies: one sealed, one built on the living-room shelf, three disassembled in a blue tub, one of them missing four pieces. | One set, five boxes, five answers. |
| LND-02 | `lnd-02-shopping-store-trip.png` | Landing, under the features board | 9:16 | Shopping list, store-trip mode | 12 missing parts across 3 sets, grouped by part and colour; 3 ticked off | Phone, dark | Tick boxes and part pictures. Crop just below the status bar to the end of the list | The shopping list in store-trip mode on a phone: twelve missing parts grouped by part and colour, three ticked off. | Store-trip mode: tick parts off as they go in the basket. |
| LND-03 | `lnd-03-first-run.png` | Landing, closing call to action | 4:5 | First-run setup | Fresh install. Household name filled in as "Harbour Road", admin fields empty | Phone, light, cropped to 4:5 | The two steps, household then admin. Crop from the title to the button | Brick Bin's first-run screen on a phone, asking for a household name, filled in as Harbour Road, and then for the admin account. | The first visit: name the household, then make the admin account. |
| TUT-01 | `tut-01-first-run.png` | Tutorials index, preview for "Your first run" | 16:10 | First-run setup | Fresh install. Household step filled in as "Harbour Road", admin fields empty | Desktop, light | The household field and the admin form below it. Crop to the form card | Brick Bin's first-run screen asking for a household name and an admin account. | Your first run. |
| TUT-02 | `tut-02-catalog-import.png` | Tutorials index, "Import the LEGO catalog" | 16:10 | Catalog import page | Downloads page pasted and checked; three files found; import not started | Desktop, light | The list of found files and the Import button. Crop to the import panel | The catalog import page after pasting the downloads page, listing three files found and an Import button. | Paste the page, check it, import. |
| TUT-03 | `tut-03-add-set.png` | Tutorials index, "Add your first set" | 16:10 | Add a set | Catalog imported. Search for a set number returns three results with pictures | Desktop, light | Results with pictures and the Scan barcode button. Crop to the dialog | The Add set dialog with catalog search results for a set number, each with a picture, and a barcode scan button. | Find it by number, by barcode, or type it in. |
| TUT-04 | `tut-04-build-state-menu.png` | Tutorials index, "Track copies and build state" | 16:10 | Copies and the build-state menu | One set, two copies: copy 1 built, copy 2 opened, its state menu open | Phone, dark, cropped landscape | The open menu and its six states. Crop around the menu and both copy rows | A set with two copies on a phone in dark mode, with the build-state menu open on the second copy. | Each copy keeps its own state. |
| TUT-05 | `tut-05-shopping-export.png` | Tutorials index, "Missing pieces and the shopping list" | 16:10 | Shopping list with export menu | 8 missing parts from 2 sets; export menu open | Desktop, light | The three export options and the grouping. Crop to the list header and first rows | The shopping list grouped by part and colour with the export menu open, offering BrickLink XML, Rebrickable CSV and plain CSV. | Export to BrickLink, Rebrickable or plain CSV. |
| TUT-06 | `tut-06-instructions-viewer.png` | Tutorials index, "Attach instructions" | 16:10 | Instructions viewer | A 112-page PDF open at page 37; page jumper showing | Phone, light, cropped landscape | The page jumper. Crop to the jumper and the page edge | A building-instructions PDF open on a phone at page 37 of 112, with the page jumper visible. | Jump straight to page 37. |
| TUT-07 | `tut-07-kid-profile.png` | Tutorials index, "Set up a kid profile" | 16:10 | Kid profile home | Signed in as a kid profile. Collection of 12 sets; one marked hidden and therefore absent | Phone, light, cropped landscape | The set list with no price column, and the link to their wishlist | A kid profile's view of the collection on a phone, with no prices and no shopping list. | What a kid profile sees: sets, no prices. |
| TUT-08 | `tut-08-wishlist-private-mark.png` | Tutorials index, "Run a wishlist" | 16:10 | Wishlist with a private mark | Viewer's own "I bought this" mark on one wish of five; viewer is not the wish's owner | Desktop, dark | The private mark and its "only you can see this" note | A wishlist in dark mode with five wishes, one carrying the viewer's private I bought this mark, and a We got it button. | Only you can see your own mark. |
| TUT-09 | `tut-09-csv-matching.png` | Tutorials index, "Import from CSV" | 16:10 | CSV import, column matching | A Brickset export with 40 rows at the column-matching step | Desktop, light | The column matches and the preview rows. Crop to the matching table | The CSV import step that matches spreadsheet columns to Brick Bin fields, for a Brickset export. | Match the columns once, import the lot. |
| TUT-10 | `tut-10-collection-value.png` | Tutorials index, "Check your collection's value" | 16:10 | Collection value | 60 sets; paid vs estimated totals; 3 values flagged stale | Desktop, light | The two totals and the stale list. Crop to the summary | The collection value page showing paid and estimated totals, sealed sets and three stale values. | Paid, estimated, and what needs a fresh look. |
| CAT-01 | `cat-01-catalog-empty.png` | Tutorial "Import the LEGO catalog", step 1 | 16:10 | Catalog page, before the first import | Fresh install, no catalog imported, import available | Desktop, light | The empty state and the paste box. Crop to the catalog panel | The Admin catalog page before any import, showing an empty state and a box for pasting the downloads page. | Before the first import. |
| CAT-02 | `cat-02-page-checked.png` | Tutorial step 3 | 16:10 | Downloads page checked | Source pasted and checked; three files found with dates; Import button enabled | Desktop, light | The found-files list and the enabled Import button | The catalog page after pasting the downloads page, listing the data files found and their dates. | Brick Bin found the files. |
| CAT-03 | `cat-03-import-running.png` | Tutorial step 4 | 16:10 | Import in progress | First import running, about 40% through the part images | Desktop, dark | The progress bar and the current step label | The catalog import in progress in dark mode, with a progress bar part way through downloading part images. | The first import takes a while. |
| CAT-04 | `cat-04-search-after-import.png` | Tutorial step 5 | 9:16 | Add set search after import | Catalog imported. Search for a set number returns one match with a picture | Phone, light | The result row with its picture. Crop from the search field to the first two results | Add set search on a phone showing a matching set with its picture after the catalog import. | It worked: the set, with its picture. |
| SET-01 | `set-01-first-run.png` | Docs: Setup, "Your first visit" | 16:10 | First-run setup | Fresh install, nothing filled in | Desktop, light | Both steps on one screen, household then admin. Crop to the form card | Brick Bin's first-run screen asking for a household name, then the admin's name, email and password. | Your first visit makes the household and the admin. |
| SET-02 | `set-02-catalog-after-import.png` | Docs: Setup, "Import the catalog" | 16:10 | Catalog page after an import | Catalog imported 1 hour ago; next import allowed in 47 hours | Desktop, light | The last-import time and the countdown. Crop to the status block | The Admin catalog page after a successful import, showing the import time and when the next import is allowed. | The next import is allowed 48 hours after the last. |

19 placeholders in all. TUT-01 and SET-01 can be the same capture if the first-run screen fits both
crops; keep both IDs so each page owns its file.

Things in the mockups that are **not** placeholders, and why:

- **Features board close-ups** (landing): enlarged chips such as "In progress", "× 4", "48 h",
  "p. 37 / 112". They are drawn in the site's style to name a feature, not to show the app's
  interface. A developer may swap any of them for a tight crop of the real app later; if so, add an
  ID here.
- **Build-state menu** (landing, the live control) and the **self-hosting stage diagrams**: site
  illustrations, built in HTML.
- **The stack diagram** on Hosting: a site diagram of the four containers.
