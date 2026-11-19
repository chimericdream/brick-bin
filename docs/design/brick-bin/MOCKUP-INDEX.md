# Mockup index

Every mockup page and every screenshot, and the current screen or state each one replaces.
"Replaces" names the screen in `inputs/app-screenshots/INDEX.md`. "(not captured)" means the state
exists in the app but had no input screenshot. "(new state)" means a state the brief asked to be designed.

- Mockups: `mockups/<file>`, 76 pages plus `mockups/index.html`, which links them all.
- Screenshots: `screenshots/<screen>-<width>-<theme>.png`, 158 files, taken at 1x.
- Full-page captures unless the page shows a dialog, sheet, menu or toast, which are viewport captures
  (390 by 844 and 1440 by 900).
- This file is written by `tools/mockup-index.mjs` from the same list the screenshot script uses.

| Mockup | What it shows | Replaces | Screenshots |
| --- | --- | --- | --- |
| `login.html` | Sign in | login | `login-390-light.png`<br>`login-390-dark.png`<br>`login-1440-light.png`<br>`login-1440-dark.png` |
| `library.html` | Library | library | `library-390-light.png`<br>`library-390-dark.png`<br>`library-1440-light.png`<br>`library-1440-dark.png`<br>`library-360-light.png`<br>`library-768-light.png`<br>`library-1024-light.png` |
| `set.html` | Set detail with two copies | set | `set-390-light.png`<br>`set-390-dark.png`<br>`set-1440-light.png`<br>`set-1440-dark.png`<br>`set-768-light.png` |
| `shopping-list.html` | Shopping list | shopping-list | `shopping-list-390-light.png`<br>`shopping-list-390-dark.png`<br>`shopping-list-1440-light.png`<br>`shopping-list-1440-dark.png`<br>`shopping-list-768-light.png` |
| `collection.html` | Collection | collection | `collection-390-light.png`<br>`collection-390-dark.png`<br>`collection-1440-light.png`<br>`collection-1440-dark.png` |
| `wishlist.html` | Wishlist as an admin sees it | wishlist | `wishlist-390-light.png`<br>`wishlist-390-dark.png`<br>`wishlist-1440-light.png`<br>`wishlist-1440-dark.png` |
| `settings.html` | Settings home. A list on phones; the list beside Places on desktop | settings | `settings-390-light.png`<br>`settings-390-dark.png`<br>`settings-1440-light.png`<br>`settings-1440-dark.png` |
| `login-error.html` | Sign in after a wrong password | login-error | `login-error-390-light.png`<br>`login-error-1440-light.png` |
| `setup.html` | First-run setup. Shares the sign-in layout | (not captured) | `setup-390-light.png`<br>`setup-1440-light.png` |
| `library-search.html` | Library with a search typed in | library-search | `library-search-390-light.png`<br>`library-search-1440-light.png` |
| `library-filtered.html` | Library with a build state and a brand filter on | (skipped in the inputs) | `library-filtered-390-light.png`<br>`library-filtered-1440-light.png` |
| `library-filters-sheet.html` | Phone: the filters sheet | library-filters-sheet | `library-filters-sheet-390-light.png` |
| `set-missing.html` | Set detail, catalog-linked, with a copy missing pieces | set-missing | `set-missing-390-light.png`<br>`set-missing-390-dark.png`<br>`set-missing-1440-light.png`<br>`set-missing-1440-dark.png` |
| `set-build-menu.html` | The one-tap build-state menu. A popover on desktop, a bottom sheet on a phone | set-build-menu | `set-build-menu-390-light.png`<br>`set-build-menu-1440-light.png` |
| `set-edit-copy.html` | The edit-copy dialog | set-edit-copy | `set-edit-copy-390-light.png`<br>`set-edit-copy-1440-light.png` |
| `set-add-copy.html` | The add-copy dialog | (not captured) | `set-add-copy-390-light.png`<br>`set-add-copy-1440-light.png` |
| `set-remove-copy.html` | The confirm dialog before a copy is removed | set-remove-copy | `set-remove-copy-390-light.png`<br>`set-remove-copy-1440-light.png` |
| `set-delete.html` | The confirm dialog before a set is deleted | (not captured) | `set-delete-390-light.png`<br>`set-delete-1440-light.png` |
| `missing-picker.html` | Missing pieces: the set's own parts and the list so far | missing-picker | `missing-picker-390-light.png`<br>`missing-picker-1440-light.png` |
| `missing-picker-search.html` | Missing pieces: the Whole catalog tab, with a search | missing-picker-search (as INDEX.md describes it) | `missing-picker-search-390-light.png`<br>`missing-picker-search-1440-light.png` |
| `missing-picker-figs.html` | Missing pieces: the Minifigs tab | missing-picker-search (its PNG shows this tab) | `missing-picker-figs-390-light.png` |
| `missing-picker-other.html` | Missing pieces: the Other tab | (not captured) | `missing-picker-other-1440-light.png` |
| `shopping-trip.html` | Store-trip mode | shopping-trip | `shopping-trip-390-light.png`<br>`shopping-trip-1440-light.png` |
| `shopping-trip-progress.html` | Store-trip mode with two lines checked off | (new state) | `shopping-trip-progress-390-light.png` |
| `shopping-list-export.html` | Shopping list with the Export menu open | (not captured) | `shopping-list-export-1440-light.png` |
| `shopping-list-filters-sheet.html` | Phone: shopping-list filters in a sheet | (new: the filters were inline) | `shopping-list-filters-sheet-390-light.png` |
| `add-set.html` | Add a set | add-set | `add-set-390-light.png`<br>`add-set-1440-light.png` |
| `add-set-lookup.html` | Add a set: catalog matches as you type | add-set-lookup | `add-set-lookup-390-light.png`<br>`add-set-lookup-1440-light.png` |
| `add-set-picked.html` | Add a set: a match picked, the form filled in | add-set-picked | `add-set-picked-390-light.png`<br>`add-set-picked-1440-light.png` |
| `add-set-errors.html` | Add a set with field validation errors | (new state) | `add-set-errors-390-light.png`<br>`add-set-errors-1440-light.png` |
| `edit-set.html` | Edit a set | edit-set | `edit-set-390-light.png`<br>`edit-set-1440-light.png` |
| `edit-set-saving.html` | Edit a set: the loading button | (new state) | `edit-set-saving-390-light.png` |
| `edit-set-failed.html` | Edit a set: a failed action, as a toast | (new state) | `edit-set-failed-390-light.png`<br>`edit-set-failed-1440-light.png` |
| `import.html` | Import sets from a CSV file | import | `import-390-light.png`<br>`import-1440-light.png` |
| `import-preview.html` | Import after a file is chosen: format, column mapping, build state, preview, first rows | (not captured) | `import-preview-390-light.png`<br>`import-preview-1440-light.png` |
| `import-finished.html` | Import finished, with a skipped row to download | (not captured) | `import-finished-390-light.png`<br>`import-finished-1440-light.png` |
| `add-set-scan.html` | Phone: scanning a barcode from the catalog lookup | (not captured) | `add-set-scan-390-light.png` |
| `wishlist-bought.html` | The private “I bought this” dialog | wishlist-bought | `wishlist-bought-390-light.png`<br>`wishlist-bought-1440-light.png` |
| `wishlist-bought-marked.html` | A wish the signed-in person has privately marked as bought | (not captured) | `wishlist-bought-marked-1440-light.png` |
| `wishlist-we-got-it.html` | The “We got it” dialog | wishlist-we-got-it | `wishlist-we-got-it-390-light.png`<br>`wishlist-we-got-it-1440-light.png` |
| `wishlist-add-sheet.html` | Phone: the add-a-wish sheet | (new: the form was inline) | `wishlist-add-sheet-390-light.png` |
| `wishlist-toast.html` | Toast: “Added to your wishlist.” | (new state) | `wishlist-toast-390-light.png`<br>`wishlist-toast-1440-light.png` |
| `more.html` | Phone “More” tab. Now also holds the theme choice | more | `more-390-light.png`<br>`more-1440-light.png` |
| `not-found.html` | The not-found page | not-found | `not-found-390-light.png`<br>`not-found-390-dark.png`<br>`not-found-1440-light.png`<br>`not-found-1440-dark.png` |
| `settings-places.html` | Settings: places | settings-places | `settings-places-390-light.png`<br>`settings-places-1440-light.png` |
| `settings-places-delete.html` | Confirm dialog before a place is deleted | (not captured) | `settings-places-delete-1440-light.png` |
| `settings-brands.html` | Settings: brands and themes | settings-brands | `settings-brands-390-light.png`<br>`settings-brands-1440-light.png` |
| `settings-people.html` | Settings: people and roles | settings-people | `settings-people-390-light.png`<br>`settings-people-1440-light.png` |
| `settings-catalog.html` | Catalog: ready, after a finished run | settings-catalog | `settings-catalog-390-light.png`<br>`settings-catalog-1440-light.png` |
| `settings-catalog-never.html` | Catalog: never imported, with the free-disk warning | (not captured) | `settings-catalog-never-390-light.png`<br>`settings-catalog-never-1440-light.png` |
| `settings-catalog-preview.html` | Catalog: the paste checked, with a preview of what would be imported | (not captured) | `settings-catalog-preview-1440-light.png` |
| `settings-catalog-stale.html` | Catalog: the stale-paste warning | (not captured) | `settings-catalog-stale-1440-light.png` |
| `settings-catalog-locked.html` | Catalog: locked for 48 hours, “Available again” with a time | (not captured) | `settings-catalog-locked-1440-light.png` |
| `settings-catalog-running.html` | Catalog: “Import running: 41 of 196 files” | (not captured) | `settings-catalog-running-390-light.png`<br>`settings-catalog-running-1440-light.png` |
| `settings-activity.html` | Settings: the activity trail | settings-activity | `settings-activity-390-light.png`<br>`settings-activity-1440-light.png` |
| `settings-activity-empty.html` | Empty activity trail | (new state) | `settings-activity-empty-1440-light.png` |
| `settings-trash.html` | Settings: trash, empty | settings-trash | `settings-trash-390-light.png`<br>`settings-trash-1440-light.png` |
| `settings-trash-items.html` | Trash with items to restore, and a toast | (not captured) | `settings-trash-items-390-light.png`<br>`settings-trash-items-1440-light.png` |
| `kid-library.html` | Library as a kid profile sees it | kid-library | `kid-library-390-light.png`<br>`kid-library-1440-light.png` |
| `kid-set.html` | Set detail as a kid profile sees it | kid-set | `kid-set-390-light.png`<br>`kid-set-1440-light.png` |
| `kid-wishlist.html` | A kid's own wishlist | kid-wishlist | `kid-wishlist-390-light.png`<br>`kid-wishlist-1440-light.png` |
| `kid-more.html` | Phone: a kid's More tab (theme and sign out) | (new) | `kid-more-390-light.png` |
| `set-instructions.html` | Instructions panel with two PDFs and a link | (not captured) | `set-instructions-390-light.png`<br>`set-instructions-1440-light.png` |
| `set-instructions-upload-error.html` | Upload PDF dialog with the error “Choose a PDF first.” | (not captured) | `set-instructions-upload-error-390-light.png`<br>`set-instructions-upload-error-1440-light.png` |
| `set-instructions-save-link.html` | Save a PDF from a link, while it is saving (loading button) | (not captured) | `set-instructions-save-link-1440-light.png` |
| `set-instructions-add-link.html` | Add a link dialog | (not captured) | `set-instructions-add-link-390-light.png` |
| `set-no-copies.html` | A set with no copies | (new state) | `set-no-copies-390-light.png`<br>`set-no-copies-1440-light.png` |
| `set-five-copies.html` | A set with five copies | (new state) | `set-five-copies-390-light.png`<br>`set-five-copies-1440-light.png` |
| `set-state-changed.html` | Toast after a build state changes | (new state) | `set-state-changed-390-light.png` |
| `library-empty.html` | A new household's empty library | (new state) | `library-empty-390-light.png`<br>`library-empty-1440-light.png` |
| `library-no-match.html` | A library search with no matches | (new state) | `library-no-match-390-light.png`<br>`library-no-match-1440-light.png` |
| `library-extremes.html` | Very long names, a set with five copies, a set with no cover, a set with no copies, and pagination for 312 sets | (new state) | `library-extremes-390-light.png`<br>`library-extremes-1440-light.png` |
| `shopping-list-empty.html` | Empty shopping list: “Nothing is missing.” | (new state) | `shopping-list-empty-390-light.png`<br>`shopping-list-empty-1440-light.png` |
| `shopping-list-many.html` | Thousands of missing parts: long “needed by” lines and paging | (new state) | `shopping-list-many-390-light.png`<br>`shopping-list-many-1440-light.png` |
| `wishlist-empty.html` | Empty wishlist: “Nothing on your list yet.” | (new state) | `wishlist-empty-390-light.png`<br>`wishlist-empty-1440-light.png` |
| `states.html` | States sheet: every control in every state. Not an app screen | (new) | `states-390-light.png`<br>`states-390-dark.png`<br>`states-1440-light.png`<br>`states-1440-dark.png` |
