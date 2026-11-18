# Screenshot placeholders

Every place the real app will be shown. Each one is a `<figure class="shot">` whose `id` is the ID
below. The frame has a fixed aspect ratio, so the real image drops in without moving the layout.

## Capture rules

- **Desktop frames are 16:10.** Capture the browser viewport at 1440 × 900, no browser chrome, and
  export at 2× (2880 × 1800). Crop as the "Focus" line says, then pad back to 16:10 with the app's
  own background colour if a crop is not 16:10.
- **Phone frames are 9:19.5.** Capture at 390 × 844 with no browser chrome or status bar, export at
  3× (1170 × 2532).
- **Format:** WebP (quality 85) with a PNG original kept in the repo. Put them in
  `public/screenshots/`.
- **Names:** `<id>-<slug>-light.webp` and, when it exists, `<id>-<slug>-dark.webp` (see the table).
- **Data:** a believable household with a mix of LEGO and off-brand sets, prices in USD, no real
  people's names. Cover images and part pictures are Rebrickable data; the footer credit covers them.
- **Screen names** ("Settings, Catalog", "Add a set") are my best guess at the app's labels. Rename
  the captions to match the real app.

## When a screenshot exists in only one theme

Some screenshots will come in light and dark, some in only one. The design is built so either works:

1. If both files exist, show the light one in the light theme and the dark one in the dark theme
   (Mantine: two `Image`s with `darkHidden` and `lightHidden`).
2. If only one exists, show it in both themes. Do not invert or filter it.
3. The frame always has a 1px `--bb-line` border and a `--bb-radius` corner, and the image sits flush
   inside it. That border is what makes a light screenshot on the dark site (or the reverse) look
   deliberately mounted rather than pasted. Keep it even when the image has its own edges.
4. The caption's "Viewport" line names the theme the image was taken in. Update it to match the file
   you actually used.

## The list

| ID | File name (light / dark) | Page and position | Ratio | Screen | State | Viewport and theme | Focus and crop | Alt text |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| L-01 | `L-01-set-detail-light.webp` / `L-01-set-detail-dark.webp` | Landing, under "What it keeps track of", left | 16:10 | Set detail page | One set with three copies: one sealed, one built, one disassembled and missing 4 pieces | Desktop 1440 × 900, light (dark optional) | The copies list. Crop to the set header and the three copy rows. | The set page in Brick Bin on a desktop screen: one set with three copies listed under its cover image, one sealed, one built, and one disassembled and missing four pieces. |
| L-02 | `L-02-shopping-list-store-trip-light.webp` / `…-dark.webp` | Landing, under "What it keeps track of", right | 9:19.5 | Shopping list, store-trip mode | About eight missing parts across three sets, grouped by part and colour; two ticked off | Phone 390 × 844, light (dark optional) | Part pictures and the big tick targets. Full screen, no browser chrome. | The shopping list in store-trip mode on a phone, with missing parts grouped by part and colour and two of them ticked off. |
| S-01 | `S-01-first-visit-light.webp` / `…-dark.webp` | Docs, Setup, "First visit" | 16:10 | First visit: create household and admin | Brand-new install. Household name filled in as "Harbour Road", admin fields empty, not submitted | Desktop 1440 × 900, light (dark optional) | The whole form. Centre it and crop the empty margins. | The first-visit screen in Brick Bin: a short form asking for a household name and the admin's name and password. |
| T02-01 | `T02-01-catalog-empty-light.webp` / `…-dark.webp` | Tutorial 2 (import the catalog), step 1 | 16:10 | Settings, Catalog | Fresh install. No import has run, the paste box is empty, Import is disabled | Desktop 1440 × 900, light (dark optional) | The paste box and the "never imported" status. Crop to the main column. | The catalog settings page before any import, with an empty box for pasting the downloads page and a disabled Import button. |
| T02-02 | `T02-02-catalog-files-found-light.webp` / `…-dark.webp` | Tutorial 2, step 4 | 16:10 | Settings, Catalog | Page source pasted and checked. The list of found files (with dates) is showing and Import is enabled | Desktop 1440 × 900, light (dark optional) | The file list and the Import button. Crop out the pasted HTML. | The catalog settings page after pasting, listing the catalog files that were found with their dates, and an enabled Import button. |
| T02-03 | `T02-03-import-progress-dark.webp` / `…-light.webp` | Tutorial 2, step 5 | 16:10 | Settings, Catalog, during an import | First import, roughly 40% through the part images | Desktop 1440 × 900, **dark** (light optional) | The progress display. Crop tight to it. | The catalog import part-way through, with a progress bar and a count of part images downloaded so far. |
| T02-04 | `T02-04-set-search-light.webp` / `…-dark.webp` | Tutorial 2, step 6 | 9:19.5 | Add a set, catalog search | A set number typed in, three results with cover images | Phone 390 × 844, light (dark optional) | The first result and its cover image. Full screen, no browser chrome. | Catalog search on a phone showing results for a set number, each with a cover image, name and year. |

T02-03 is deliberately dark-first so the tutorial shows that dark screenshots exist; any of them can
be swapped.

## ID scheme for the other tutorials

`L-` landing, `S-` setup docs, `H-` hosting docs, `C-` configuration docs, `T<nn>-` tutorial number
*nn* in the tutorials index order (01 first run … 10 check collection value), numbered in page order.
Each of the other nine tutorials will need two to four placeholders in the same pattern: one per
step that changes what's on screen, desktop for admin tasks, phone for things people do on the move
(store trip, barcode scan, kid profile, wishlist). Follow the template in
`mockups/tutorial-import-catalog.html`.

## Markup contract (for the developer)

```html
<figure class="shot" id="L-01">                <!-- add shot--phone for 9:19.5 -->
  <div class="shot__frame">                    <!-- aspect-ratio lives here; baseplate class only while empty -->
    <img src="/screenshots/L-01-set-detail-light.webp" alt="(alt text from the table)"
         width="2880" height="1800" loading="lazy">
  </div>
  <figcaption>(Screen / State / Viewport / Focus list while it's a placeholder;
  a one-line human caption once the real image is in, see SPEC.md §6.12)</figcaption>
</figure>
```

While a placeholder is empty, the frame carries `role="img"` and the alt text as `aria-label`, and
the visible label chip is `aria-hidden`.
