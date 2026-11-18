# Brick Bin site: screenshot placeholders (Designer 1)

Every place the real app will be shown. Each placeholder is a `<figure class="shot">` whose `id` is the
ID below. The frame has a fixed aspect ratio, so swapping in the real image will not move the layout.

- Desktop frames are **16:10**. Capture at 1440 x 900 and export at 2x.
- Phone frames are **9:19.5**. Capture at 390 x 844 and export at 3x, without browser chrome.
- Suggested location for the files: `public/screenshots/`.
- A dark version of each (`-dark` suffix) would let the site match its own theme. The design works
  with light-only images too.

| ID | File name | Page | Screen | State | Viewport and theme | Focus and crop | Alt text |
| --- | --- | --- | --- | --- | --- | --- | --- |
| L-01 | `set-detail-two-copies-desktop-light.png` | Landing, "One page per set" | Set detail page | One set with two copies: one built and complete, one in progress and missing 4 pieces | Desktop 1440, light | The copies list under the set header. Crop to the header and both copy rows, leave out the page footer. | The set page in Brick Bin on a desktop screen, showing one set with two copies listed below its cover image: one built, one missing four pieces. |
| L-02 | `shopping-list-store-trip-phone-light.png` | Landing, "One page per set" | Shopping list in store-trip mode | About eight missing parts across three sets, grouped by part and colour, two ticked off | Phone 390, light | The part pictures and the big tick targets. Full screen. | The shopping list in store-trip mode on a phone, with missing parts grouped by part and colour and two of them ticked off. |
| T2-01 | `catalog-settings-empty-desktop-light.png` | Tutorial: import the catalog, step 1 | Settings, Catalog | Fresh install. No import has ever run, the paste box is empty, Import is disabled | Desktop 1440, light | The paste box and the "never imported" status. Crop to the main column. | The catalog settings page before any import, with an empty box for pasting the downloads page and a disabled Import button. |
| T2-02 | `catalog-settings-files-found-desktop-light.png` | Tutorial: import the catalog, step 4 | Settings, Catalog | HTML pasted and checked. The list of found files is showing, Import is enabled | Desktop 1440, light | The file list and the Import button. Crop out the pasted HTML. | The catalog settings page after pasting, listing the catalog files that were found with their sizes, and an enabled Import button. |
| T2-03 | `catalog-import-progress-desktop-light.png` | Tutorial: import the catalog, step 5 | Settings, Catalog, during an import | Import roughly 40% done, part images downloading | Desktop 1440, light | The progress display. Crop tight to it. | The catalog import part-way through, with a progress bar and a count of part images downloaded so far. |
| T2-04 | `catalog-search-results-phone-light.png` | Tutorial: import the catalog, step 6 | Add a set, catalog search | A set number typed in, three results with cover images | Phone 390, light | The first result and its cover image. Full screen. | Catalog search on a phone showing results for a set number, each with a cover image, name and year. |
| S-01 | `first-visit-create-household-desktop-light.png` | Docs, Setup, "First visit" | First visit: create household and admin | Brand-new install, form filled in with a sample household name, not yet submitted | Desktop 1440, light | The whole form. Centre it and crop the empty margins. | The first-visit screen in Brick Bin, a short form asking for a household name and the admin's name and password. |

## ID scheme

`L-` landing, `S-` setup docs, `H-` hosting docs, `T<n>-` tutorial number n from the tutorials index
(the import tutorial is number 2). Number placeholders in page order.

## Notes for whoever captures them

- Screen names such as "Settings, Catalog" and "Add a set" are my guesses at the app's labels, because
  I designed without seeing the app. Rename them to match.
- Use a believable household: a mix of LEGO and off-brand sets, sensible prices in USD, no real
  people's names.
- Cover images and part pictures in real screenshots are Rebrickable data. The footer credit covers
  them.
- The other nine tutorials will each need three or four placeholders in the same pattern. The template
  is `tutorial-import-catalog.html`.
