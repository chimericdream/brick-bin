# Placeholders

Every place where the real app will be shown. This file is written by `tools/build.py` from the
`@shot` lines in `tools/src/`, so it always matches the pages.

## How a placeholder works

- **Frame.** A fixed-ratio box with a 1px `--line` border and a 3px radius. Desktop shots are 16:10,
  full phone screens are 9:19.5, tight phone crops are 4:5. The ratio is set on the frame, so nothing
  moves when the image arrives.
- **Until the image exists** the frame shows the baseplate (studs from above) and a label: ID, screen
  name, shape and theme.
- **Caption.** Four labelled lines under every frame: Screen, State, Viewport and theme, Focus. These
  are instructions for whoever takes the screenshot. Replace them with a one-line reader caption
  when the real image goes in.
- **Alt text** is on the frame (`role="img"` with `aria-label`) and moves to the `<img alt>`.

## File names and themes

`<id>-<slug>.<theme>.png`, lower case, in `public/screenshots/`. Example:
`lnd-01-set-detail-page.light.png` and `lnd-01-set-detail-page.dark.png`.

Capture desktop shots at 1440 wide and phone shots at 390 wide, both at 2x.

The site shows the file that matches the theme being viewed. **If only one theme exists, it shows
that file in both themes**, inside the same frame, and adds "Shown in the light theme." (or dark) to
the caption. The frame's border is what makes a light screenshot look deliberate on a dark page, so
do not remove it. If just one can be taken, take the theme listed as "first choice" below. See
`states.html`, "Screenshots", for all three cases drawn out.

## Mocked placeholders

