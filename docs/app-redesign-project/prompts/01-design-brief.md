# Design brief: the Brick Bin app

Sent to Designers 1 and 2, together with `02-designers-addendum.md`.

## Your role

You are a senior product designer redesigning the **Brick Bin web app**: the screens a household uses every day to keep track of its building-brick sets. Make every visual and structural decision yourself. If a design skill is available to you, use it, including its look-and-fix loop on screenshots, and use its app-screen guidance.

**Where you work.** You work only in the directory the project manager gave you. It contains an `inputs/` folder with everything you need: screenshots of the current app and the finished design of the marketing site. That directory sits inside a code repository, and you are expected **not to browse it**. Do not open source code, configuration, documentation, the old design files in `docs/design/`, the marketing site's source, or any directory other than your own. Another designer's work, in particular, must stay unseen. If you need something you don't have, end your turn with a `QUESTIONS FOR PM` block. You cannot talk to anyone else. When you finish, say whether you opened anything outside your directory, and what.

**What you will see anyway.** The tool you run in injects the repository's `CLAUDE.md` and `AGENTS.md` into your context. They describe the current app's stack and its current fonts, colour tokens and design files. Treat the current look as the thing you are replacing, not as a constraint or a starting point. The stack rules in them (Mantine, no Tailwind, nothing loaded from a CDN) do apply to you. Mention in your handoff anything from them that influenced you.

**Machine safety.** Run **one** browser process at a time. No parallel or background captures. Don't write loops that launch a new browser per screenshot: open one, take several shots, close it. Delete any temporary browser profile you create. Never launch desktop apps such as editors. A previous project nearly locked this machine up with parallel browsers.

## What Brick Bin is

A **self-hosted web app for a household's collection of building-brick sets**: LEGO and off-brand brands such as Mould King, CaDA, COBI, BlueBrixx and Lumibricks. It is **not a SaaS**. A family runs it on their own server and reaches it over their own network. It is free and open source. People use it:

- **on a phone**, in a store or on the floor with a box open: checking what's missing, ticking parts off, changing a build state, adding a set by scanning a barcode;
- **on a computer**, to catalog a collection, import data and tidy up;
- **as a child**, on a restricted profile that can browse the collection and keep a wishlist.

## The problem to solve

The owner's verdict on the current app is "meh". It works, but it feels generic and flat, especially next to the marketing site that was designed for it, which they love. Start by diagnosing this yourself. Open the screenshots and write a short, honest critique (section 1 of `DESIGN-NOTES.md`): what is weak, what is worth keeping, and what the redesign needs to achieve. Then design.

The goal is an app that:

- has a clear identity and some delight, and is still fast, calm and legible to work in;
- belongs visibly to the same family as the marketing site;
- keeps everything it does today, and gets easier to scan and use on a phone.

## Brand family: the marketing site

`inputs/marketing-site/` holds the finished design of the marketing site (open its HTML files, read `SPEC.md`). The app and the site are one product and must look like it: someone who clicks from the site to a screenshot of the app, or to their own copy of the app, should feel they are in the same place.

But a site is for reading and an app is for working. Take the site's identity as your starting point and decide what carries over (the mark and wordmark, the type families, the colour logic, the brick motif, the tone), what must adapt for dense, repeated use, and what does not belong in an app. You may extend the palette and type scale, and you may deviate from the site where the app needs it. Say where and why in `DESIGN-NOTES.md`. Do not copy the site's page layouts.

## What is in `inputs/app-screenshots/`

`INDEX.md` lists every screenshot: the screen, the URL path it lives at, what state it shows, and the file. They cover most of the app at 1440 px (desktop) and 390 px (phone), mostly in light, with dark for the core screens. All data is invented, the set covers are generated stand-ins, and part pictures are stand-ins on white. Real box art and real part renders vary, so design for any cover image: portrait, landscape, square, or none at all.

On phone full-page captures the fixed bottom tab bar can appear in the middle of the page. In use it sits at the bottom of the screen.

## Product facts

**Core ideas**

- **Set vs copy.** A set is the design. A copy is a physical box you own, with its own build state, place, owner, price paid, estimated value, condition notes and missing pieces. Five copies of one polybag is normal.
- **Build state:** sealed, opened, in progress, built, disassembled, mixed ("no longer a coherent set; its parts are mixed into everything else"). Each copy has a one-tap menu to change it.
- **Missing pieces are real catalog parts** (part, colour, quantity, with pictures), picked from the set's own inventory or searched across the whole catalog.
- **Shopping list:** every missing piece, grouped by part and colour, saying which sets need it. Sort, filter by colour, a store-trip mode on phones for ticking parts off, and exports to BrickLink wanted-list XML, Rebrickable CSV and plain CSV.
- **LEGO catalog lookup** from Rebrickable data an admin imports. Nothing is fetched on a schedule. An admin presses the button, at most once every 48 hours. Catalog data must be credited to Rebrickable with a link wherever it is shown, as the app does now.
- **Instructions** per set: upload a PDF, save a link, or save a PDF from a web address.
- **Collection and value:** totals, paid versus estimated value, values not updated in over a year, sealed sets, breakdowns by brand, theme and build state.
- **Wishlists** per person. Anyone can privately mark "I bought this", and only that person sees the mark (not admins, not the activity trail). "We got it" turns a wish into a set.
- **People and roles:** admin, member, and **kid** (restricted). Kids are read-only except for their own wishlist: **no prices anywhere, no shopping list, no Collection, no Import or Settings**, and sets marked hidden look as if they don't exist. Design the kid experience as a first-class one, not a cut-down afterthought. It must never look childish or condescending.
- Also: CSV import, an activity trail, a trash with restore, places (a tree: Attic, then Shelf 1), brands and themes, tags, light and dark themes.
- **Not in the app, so not in your design:** loose-brick inventory, owned minifigures, a build log, loans, ratings, guest share links, price-guide integrations, currencies other than USD.

**Navigation today.** On a computer, a sidebar: Library, Shopping list, Wishlist, Collection, Import, then Settings, the signed-in person, a theme toggle, sign out and the Rebrickable credit. On a phone, a top bar and a bottom tab bar (Library, Shopping, Add, Wishlist, More), where More holds Collection, Import, Settings and Sign out. Settings has sub-pages: Places, Brands and themes, People, Catalog (admins only), Activity, Trash. You may restructure how these are presented. Keep every destination reachable. If you want to merge or remove a destination, say so under proposals.

**States the screenshots can't show. Design all of them.**

- **First-run setup:** shares the sign-in layout. Asks for a household name, your name, email and password. "You're the first one here, so this account becomes the admin. Nothing is stored anywhere but on this server."
- **Catalog import** (admin): never imported (about 6 GB of part images plus the catalog archive, and a free-disk warning); ready (an explanation with steps, a place to paste the downloads page's HTML, a preview of what would be imported, and a run history); locked ("Available again" with a time, because of the 48-hour limit, button disabled); a stale-paste warning; running ("Import running: 41 of 196 files", with progress).
- **Instructions panel** on a set: a list of items (PDF file or link, with "Saved from <site>"), buttons to upload a PDF, save a PDF from a link, and add a link, with their dialogs and an error ("Choose a PDF first.").
- **Empty states** for every list: a new household's empty library, an empty shopping list ("Nothing is missing"), an empty wishlist ("Nothing on your list yet."), an empty trash, an empty activity trail, a library search with no matches, and a set with no copies.
- **Feedback:** field validation errors, toast notifications ("Added to your wishlist."), disabled and loading buttons, a failed action.
- **Data extremes:** very long set names, a set with five copies, a set with no cover, hundreds of sets (the library pages its results), thousands of missing parts.
- **Dialogs and menus:** the build-state menu, edit copy, add copy, edit set, delete confirmations (every delete asks first and says it moves to the trash), "I bought this", "We got it", the phone filter sheet.
- **Interaction states:** hover, focus, active, current page, selected, disabled, for every kind of control.

## Design brief

- **Your direction.** Make bold, specific decisions about layout, density, typography, colour, shape, iconography and motion. Redesign the structure of screens where that makes them better. You are not limited to restyling the current layouts.
- **Playful without being silly.** The marketing site is "warm, confident and a little witty, like a well-organised workshop, not a toy aisle." Keep that. An app is used many times a day, so restraint matters more than on a site. No mascots, cartoon faces, confetti or exclamation-mark enthusiasm. Humour lives in small touches: empty states, microcopy, the 404, a loading line.
- **Bricks are part of the theme.** Weave building bricks into the app's identity as a **system** with clear rules for where the motif appears and where it doesn't (for example the shell, page heads, build-state badges, empty states, cover fallbacks, sign-in, the 404). It must never hurt legibility. Data-dense areas such as tables, forms and lists stay plain. The marketing site shows the six build states as a pile of bricks, which suggests a language for the app's state badges. That is a prompt, not an instruction.
- **No LEGO trade dress.** No LEGO logo or wordmark, no stud-logo marks, no minifigure likenesses, and no red-and-yellow brand scheme. Use the site's mark, or evolve it.
- **Phone-first.** Design the phone first, then scale up. Cover 360, 390, 768, 1024 and 1440 px. One-handed use matters: primary actions within thumb reach, tap targets at least 44 px, no horizontal page scroll, tables that stay readable on a phone, and forms that are comfortable on a small screen. Text inputs must be 16 px or larger on phones so browsers don't zoom.
- **Light and dark** themes that both look intentional, following the system setting with a manual choice.
- **Accessible.** WCAG AA contrast, visible focus states, correct heading order and landmarks, nothing conveyed by colour alone (build state is always a word or shape as well as a colour), a calm option for any animation (`prefers-reduced-motion`). No text under 13 px.
- **Buildable.** The app is built with Next.js and the **Mantine** component library. Design what you want, but it must be achievable with standard web technology and Mantine's components (buttons, inputs, selects, tabs, menus, modals, drawers, accordions, tables, badges, notifications, segmented controls, and so on), styled through the theme and CSS. Use **Tabler Icons** (free, MIT, and already in the app) for interface icons, and name each icon you use. Make custom SVG only for the brand mark, the brick motif and illustrations. Avoid effects that need a server, third-party widgets, video or WebGL. Choose **fonts that are free to self-host** (open licences such as OFL). Nothing may load from a third party at runtime. Decorative art is SVG or CSS.
- **No new features.** Every field, number and action in your mockups must exist in the app today (the screenshots and the product facts above are the full list). Don't add ratings, build times, social features, loose bricks and so on. If you have an idea that needs something new, put it in `PROPOSALS.md` with the reasoning. Do not design it into the main flow.
- **Keep what works.** Keep the product's vocabulary, and keep control labels (button text, field labels) unless you have a reason to change them, because the app's automated tests find controls by their accessible names. List every label or copy change you make.
- **Privacy is part of the design.** Kid views show no prices and no shopping list. A private purchase mark is visible only to the person who made it. A hidden set is simply absent for kids. Don't design any element that would leak these.

## Writing

Write real copy for everything you mock up. Plain, specific, warm and human. No filler or hype. Use US spelling. Avoid "it's not X, it's Y" reveals, strings of three adjectives, and stock words like "seamlessly" and "unlock". Do not invent facts beyond the product facts above. Use the same invented household data as the screenshots, so a before and after comparison is fair. Make the voice clear, because a developer will extend it.

## Deliverables

All inside your working directory, outside `inputs/`:

1. **Mockups:** hand-authored static HTML and CSS (no build step, no frameworks, openable by double-clicking), in `mockups/`, with shared CSS, assets and fonts. Include `mockups/index.html` linking every mockup. Then PNG screenshots of each, in `screenshots/`, named `<screen>-<width>-<theme>.png`. Cover:
   - **Every screen in the inputs' `INDEX.md`**, at **390 and 1440 px, light**. Add **dark** for these core screens: sign-in, Library, set detail, Shopping list, Collection, Wishlist, Settings (home).
   - **768 px** (light) for the Library, set detail and Shopping list. **360 px** for the Library.
   - Every **state** in "States the screenshots can't show" above, plus the states in `INDEX.md` that are interactions (menus, dialogs, filters, lookups, store-trip mode). Light is enough for these, at the width where it matters most (phone for sheets and tab-bar issues, desktop for dialogs), and both widths where the layout differs.
   - The **kid** views (Library, set detail, wishlist) and the 404.
   - A **states sheet** (`mockups/states.html`) showing hover, focus, active, current, selected and disabled for every kind of control, and the theme toggle.
     Mockups should be interactive only where CSS alone can do it (a menu or a toggle opening, a tab switching). Keep scripts minimal.
2. **`DESIGN-NOTES.md`:** your critique of the current app (section 1), the concept and why it fits, how the design relates to the marketing site, the brick-motif rules, type and colour reasoning, density and responsive behavior, and what you chose not to do.
3. **`TOKENS.md`:** colours (light and dark, with contrast ratios for text pairs), type scale, spacing, radii, shadows, breakpoints, and motion.
4. **`SPEC.md`:** the developer handoff, described below.
5. **`PROPOSALS.md`:** ideas that need new features or change what the product does, kept out of the main design.
6. **`MOCKUP-INDEX.md`:** each mockup HTML file and each PNG, and which current screen or state it replaces.
7. **Assets** as separate SVG files, and the font files with their licences (or exact download instructions).

### What `SPEC.md` must contain

The developer cannot ask you anything directly. They'll have only your package and whatever the project manager relays, so be precise.

- A map of the package and how to open it. State that the stylesheet is the source of truth where it and the document disagree.
- **Tokens:** exact values for both themes, type scale, spacing scale, radii, shadows, breakpoints, motion, and the font files with licences.
- **The brick-motif system:** each element, where it appears, where it must not, and how it behaves at each breakpoint.
- **The app shell:** the desktop sidebar, the tablet layout, the phone top bar and tab bar, page heads and page width rules, scroll behavior, and how dialogs behave on phones (modal or bottom sheet).
- **A component inventory** with every state, spacing and responsive behavior: buttons, inputs, selects, checkboxes, segmented controls, tabs, menus, dialogs and sheets, badges (including the six build states and the completeness and visibility badges), set tiles and rows, cover and its fallback, part tiles, tables, step and progress displays, toasts, empty states, breadcrumbs, pagination, and anything else you drew. Name the Mantine component each maps to where it's obvious.
- **Screen-by-screen rules:** layout, content order, what changes at each breakpoint, and what the kid profile hides.
- **Empty, loading, error and edge states.**
- **Accessibility notes** and reduced-motion behavior.
- **A copy-change table** (screen, old text, new text, reason) so the developer and the test suite can follow.
- **A voice and tone guide** with examples.
- **A list of what is deliberately flexible,** so the developer knows what they may adapt.

When you finish, end with a short summary, a statement of whether you opened anything outside your directory, and any `QUESTIONS FOR PM`.
