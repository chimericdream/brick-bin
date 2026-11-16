# Rebrickable spike (2026-11-16)

One real `all_downloads.zip` was downloaded once (20.3 MB, `Last-Modified` 2026-11-16 07:18 UTC,
`ETag` `"6afaae63-1365973"`, `Cache-Control: max-age=86400`) from
`https://cdn.rebrickable.com/media/downloads/all_downloads.zip` to read its structure. The
downloads page was **not** fetched (see `docs/PLAN.md` section 5.1).

## Archive contents

Fifteen CSV files, UTF-8, LF line endings, no BOM. Fields containing commas or quotes are wrapped
in double quotes (`""` for a literal quote); about 59% of `parts.csv` rows and 64% of
`minifigs.csv` rows are quoted. Booleans are the strings `True` and `False`. Empty fields are
empty strings (no `NULL` marker).

| File                     | Rows      | Columns                                                    |
| ------------------------ | --------- | ---------------------------------------------------------- |
| `colors.csv`             | 275       | `id,name,rgb,is_trans,num_parts,num_sets,y1,y2`            |
| `themes.csv`             | 496       | `id,name,parent_id`                                        |
| `part_categories.csv`    | 76        | `id,name`                                                  |
| `parts.csv`              | 65,036    | `part_num,name,part_cat_id,part_material`                  |
| `part_relationships.csv` | 37,606    | `rel_type,child_part_num,parent_part_num`                  |
| `elements.csv`           | 114,794   | `element_id,part_num,color_id,design_id`                   |
| `sets.csv`               | 28,616    | `set_num,name,year,theme_id,num_parts,img_url`             |
| `minifigs.csv`           | 17,367    | `fig_num,name,num_parts,img_url`                           |
| `inventories.csv`        | 47,942    | `id,version,set_num`                                       |
| `inventory_parts.csv`    | 1,573,782 | `inventory_id,part_num,color_id,quantity,is_spare,img_url` |
| `inventory_minifigs.csv` | 25,995    | `inventory_id,fig_num,quantity`                            |
| `inventory_sets.csv`     | 5,218     | `inventory_id,set_num,quantity`                            |
| `color_mappings.csv`     | 846       | `id,ext_system,ext_id,ext_descr,is_export_id,is_import_id` |
| `part_mappings.csv`      | 183,490   | `part_num,ext_system,ext_id,is_export_id,is_import_id`     |
| `set_mappings.csv`       | 72,274    | `set_num,ext_system,ext_id`                                |

`inventory_parts.csv` is 135 MB uncompressed, so the loader streams it.

## Facts that shape the code

- **External systems** (`ext_system`): colours and parts use `BL` (BrickLink), `BO` (BrickOwl),
  `LD` (LDraw) and `LE` (LEGO); sets also use `BS` (Brickset). The BrickLink export needs `BL`
  rows with `is_export_id = True`.
- `color_mappings.ext_descr` is a JSON-style list of names (`["Black"]`).
- `part_relationships.rel_type`: `A`, `B`, `M`, `P`, `R`, `T` (the plan's "alternates and molds"
  hint uses these; `P` is by far the most common).
- `inventory_parts.img_url` is a photo URL and is empty for about 7,000 rows. Part images in the
  app come from the LDraw ZIPs, not from this column, so it is stored but never fetched.
- `colors.csv` has an `[Unknown]` row with id `-1`; ids can be negative.
- `elements.design_id` is often empty.
- Titanic: `sets.csv` has `10294-1`, 9,092 parts, theme 721; `inventories.csv` has version 1 with
  inventory id 114094.

## Not done

The LDraw ZIPs and the schema SVG were not downloaded. The ZIP layout in the plan (flat, PNG
only, `<part_num>.png`) was confirmed earlier from `parts_31.zip` and is taken from there.
