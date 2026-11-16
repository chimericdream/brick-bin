# Brick Bin design critique

Method: taste-skill app-screen run (`references/app-screens.md` section 2.7 questions), three rounds, screenshots at 1440 and 390, light and dark. `inspect.mjs --app` was run on library, set detail and shopping list only; the other pages were checked by my own screenshot script (horizontal overflow, script errors) and by eye. I viewed about 50 of the 124 PNGs one by one (library, set, picker, shopping, trip, wishlist, kid views, catalog, add, collection, sign-in, states, filters) and spot-checked the rest through the overflow script; I did not open every file.

## Round 1: first screens (library, set, picker, shopping, trip)

Scores (1 to 5): question answered first 4, shared edges 4, colour on status only 4, numbers add up 4, phone 3.

Found and fixed:
- Desktop facet panel was clipped at viewport height, hiding build state onward. Removed the max-height.
- Phone library header wrapped "Shopping list for these" and "Add set" into the title row. Hidden on phone (selection action stays on desktop, Add is in the top bar).
- Phone tab bar and store-trip bar were drawn mid-page in full-page captures. The capture script now pins them to the end of the page; the real CSS keeps them fixed.
- Picker tiles overflowed 390px (stepper + Add side by side). Stepper and Add now stack on phone.
- Shopping list: "1 pieces" headings, and "across 7 copies" when only 6 copies need parts. Both corrected; the 6 comes from the same rows as the list.
- Build-state menu on phone was a 160px column. It now spans the card.

## Round 2: inspector and states

Inspector results: library 1 FAIL (rainbow-chart), 2 WARN; set 0 FAIL, 1 WARN; shopping 2 FAIL, 1 WARN.
- FAIL button-fx: the segmented control's active segment used a box-shadow ring. Changed to a 1px border. Fixed.
- FAIL contrast, "Other" tile at 2.2:1 in dark mode: the white part frame inherited the light dark-mode muted colour. The part frame now uses fixed `#4f5d6c` on white. Fixed.
- FAIL rainbow-chart (12 hues): the inspector counts the box-art illustrations as charts. Each set's art has its own palette on purpose, because real box art does. **Defended, not changed.** The chrome uses one hue.
- WARN panel-void (43 to 47px blank in tiles with one badge row): tiles share a row height so they stand level on the rail. **Defended.** Collapsing them would leave ragged tops on a plank.
- WARN below-fold (7 of 21 blocks start on screen one): the library is a grid of 20 tiles, so the first screen shows toolbar plus the first row and a half of tiles. **Defended.**
- WARN colour-sprawl on set detail at 768px (18%): the cover and tint areas. Art is data; kept.
- WARN mixed-font-headline on phone: the Bricolage headings with Atkinson counts in one line ("Copies 2"). Intentional.
- Contrast script: every text pair at 4.5:1 or better in both themes (5.4 to 16.5), all eight badge pairs 7.3 or better.

## Round 3: dark mode, kid and privacy, phone details

- Store trip dimmed ticked part images with opacity, which turned the white tile grey in dark mode. Now the tile stays white and gets an accent outline.
- The catalog, collection, trash and add-scan pages overflowed 390px (grids with implicit columns, nowrap buttons). Fixed with `minmax(0,1fr)` columns and wrapping buttons; the script reports no overflow on any capture.
- Filters sheet clipped the count column; padding restored.
- Collection table header said "brand" in lower case; dates were off by a month from a time-zone bug; both fixed.
- Kid views: no prices, no Collection, hidden present absent, counts recomputed (19 sets, 26 copies). The kid wishlist shows no mark or hint; a dashed "Mockup note" says so and is not part of the product.

## What still falls short

- Part drawings are small, simple isometric stand-ins. They show the white-tile layout, not how real LDraw renders will look. 100px renders will need a check in the app.
- Box-art tiles with only one badge row leave a blank band under the badges (see round 2).
- No tablet (768px) design pass of my own; the inspector measured it for three pages only.
- Phone catalog history table scrolls sideways inside its card; it is readable but not a list of two-line rows.
- Light and dark were not both drawn for every secondary state (for example "stale paste", "locked", "running", "never", the add-set scan and manual forms, the We-got-it dialog are light only).
- Hover and pressed states were styled but not captured.
- The phone store-trip tick boxes are drawn; the tick interaction itself is not scripted.

## Round 4: changes after the user review

- **Per-copy badge rows on tiles** (1, 2, 3 and 5 copies shown in the library, desktop and phone, light and dark, and in the kid library). I added two copies of Field Kitchen Wagon to get a 3-copy example, so the totals are now 27 copies, $2,112.78 paid, $2,320.99 estimated, and the collection page and sidebar follow from the data. Viewed: library 1440 light, library 390 dark, kid library via the overflow script and spot view.
- First attempt pinned badges to the foot of each tile; that moved the blank band between the meta line and the badges, which looked worse. Reverted to badges directly under the meta line, with blank space at the foot of one-row tiles (see below).
- **320px**: below 360px the library is one column of larger tiles with full completeness text; a 2px overflow from the rail was fixed; search placeholder shortened so it is not cut. Viewed the top of 320 dark; the full-length 320 captures are too tall to read in one view.
- **Kids**: Shopping removed from the kid sidebar and tab bar (two tabs now), the Shopping button removed from the kid set page, and the shopping and missing-picker pages redirect a kid to the not-found page. Kid set detail shows missing pieces read-only (image, name, colour, quantity). Viewed kid set at 390.
- **Brands and themes, Activity** drawn (desktop and phone, light and dark; viewed brands 1440 light and activity 390 dark). **Catalog** states stale, locked, running, never now also have dark captures (viewed running 1440 dark).

Still short: tiles with one badge row sit in rows beside multi-copy tiles and keep blank space at their foot; I did not re-open every one of the 124 captures; the inspector was not re-run after round 4.
