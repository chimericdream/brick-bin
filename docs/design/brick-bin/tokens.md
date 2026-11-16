# Brick Bin tokens (for `src/theme.ts`, after the direction is approved)

Names are the `--app-*` CSS variables used in `source/style.css`. Hex values are final for the mockups. Not yet applied to `src/theme.ts`.

## Core

| Token | Light | Dark | Use |
|---|---|---|---|
| `--app-ground` | `#eef1f5` | `#0e1319` | page ground, sidebar |
| `--app-surface` | `#ffffff` | `#161d25` | cards, tiles, inputs, sheets |
| `--app-sunk` | `#e4e9ef` | `#0a0e13` | art frames, inset wells, segmented track |
| `--app-ink` | `#14202e` | `#e8edf3` | primary text |
| `--app-muted` | `#4f5d6c` | `#a3b0be` | secondary text |
| `--app-tint` | `#dbe7f6` | `#1b2d44` | active nav row, selected states, info notices |
| `--app-accent` | `#1d5ca6` | `#6fa9ea` | primary button, small marks, progress |
| `--app-on-accent` | `#ffffff` | `#06182c` | text on accent |
| `--app-accent-ink` | `#123f78` | `#b9d6f7` | text on tint, links |
| `--app-border` | `#d3dae3` | `#28323d` | card edges |
| `--app-rule` | `#e3e8ee` | `#1e2730` | row rules |
| `--app-control` | `#7f8d9d` | `#6b7a8b` | input and checkbox outlines (3:1 against surface) |
| `--app-rail` | `#cdd5de` | `#2b3642` | plank rail |
| `--app-rail-hi` | `#e9eef3` | `#37444f` | plank rail top edge |
| `--app-scrim` | `rgba(14,20,28,.5)` | `rgba(0,0,0,.62)` | sheet and dialog backdrop |

## Build states (badge pairs: background / ink, each with its own icon and word)

| State | Icon | Light bg / ink | Dark bg / ink |
|---|---|---|---|
| Sealed | lock | `#e3e8ee` / `#25303d` | `#232d38` / `#d5dde6` |
| Opened | open box | `#d6efec` / `#0d4a45` | `#12332f` / `#9fe0d8` |
| In progress | tool | `#dbe7f6` / `#123f78` | `#1b2d44` / `#b9d6f7` |
| Built | stacked blocks | `#d9efdf` / `#14532d` | `#143323` / `#9be0b4` |
| Disassembled | split squares | `#efe6d3` / `#5b4511` | `#38301c` / `#e8d49a` |
| Mixed | shuffle, hatched fill | `#e6e8ec` / `#2f3a47` | `#262c35` / `#cfd8e2` |

Variables: `--app-s-<sealed|opened|progress|built|disassembled|mixed>-bg` and `-ink`.

## Completeness and warnings

| Token | Light | Dark | Use |
|---|---|---|---|
| `--app-warn-bg` / `--app-warn-ink` | `#fde4de` / `#8a1c0f` | `#3d1c17` / `#ffb4a6` | "Missing 4 pieces" (warning icon) |
| `--app-ok-bg` / `--app-ok-ink` | `#d9efdf` / `#14532d` | `#143323` / `#9be0b4` | "Complete (checked Mar 2026)" (check icon) |
| Not checked | transparent, 1px `--app-control` outline, `--app-muted` text | same | dashed-circle icon |
| `--app-notice-bg` / `-border` / `-ink` | `#fff5d6` / `#ecd88a` / `#6b4a00` | `#3a3114` / `#6b5a1f` / `#f0dc8e` | notices that need care |
| `--app-danger` | `#b42318` | `#ff8f80` | delete buttons and text |
| `--app-danger-bg` / `--app-danger-ink` | `#fde4de` / `#8a1c0f` | `#3d1c17` / `#ffb4a6` | error notices |

## Part tile (fixed in both themes)

Part images always sit on `#ffffff` with a `--app-border` edge and radius 8, never themed. Their small labels use `#4f5d6c` on white. The swatch is a 18px circle with a `--app-control` ring plus an inset 14% black ring so White and Lavender show an edge.

## Type and shape

| Token | Value |
|---|---|
| Heading face | Bricolage Grotesque (variable, wght 200-800), weights 650 / 700 |
| Body face | Atkinson Hyperlegible Next (variable, wght 200-800), 15px / 1.5; 13px small, 12px minimum |
| Numbers | `font-variant-numeric: tabular-nums` on everything |
| Radii | card 12, tile 10, control 8, badge 6, chip 16, sheet 18 top |
| Gap | 24 desktop, 12 to 16 phone |
| Control heights | 38 desktop, 44 phone; icon buttons 44 |
| Sidebar | 248px on ground, 1px `--app-border` |
