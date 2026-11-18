# Prompt 3: Designer 3 (Opus 5.5)

Sent together with `01-design-brief-part-1.md`.

You've been given the same brief as two other designers (the design brief above). They worked independently. Copies of their output are in your working directory, in `inputs/design-a/` and `inputs/design-b/`. You work only in your own directory and, as the brief says, you should not browse anywhere else in the repository.

Your task has three steps.

1. **Evaluate both designs honestly.** Look at the real screenshots and the HTML at all supported widths. Judge each against the brief, not against your own taste, on:
   - first impression and personality
   - whether the brick motif is a system or a decoration
   - legibility and accessibility
   - mobile quality
   - the docs experience (navigation, density, config table)
   - dark mode
   - how buildable it is with Mantine on a static site
   - copy quality and tone

   Write down what works and what fails in each design, specifically.
2. **Make one new design that takes the best of both.** It should feel like one coherent design from one hand, not a collage. **If one design is clearly better in every way that matters, you may discard the other** and refine the stronger one. If you do, say so and explain why. Do not combine things merely to be fair.
3. **Produce the final, implementation-ready package.** The developer cannot ask you anything directly. They'll have only your package and whatever the PM relays, so be precise.

Deliverables, in your own directory (outside `inputs/`):

- **`EVALUATION.md`:** your assessment of both designs, what you kept and what you discarded, and why.
- **Final mockups** (static HTML and CSS plus PNGs) covering **every page and state** in the design brief, in **phone and desktop, light and dark**, including hover, focus, active and current states, the mobile menu, docs navigation, the 404 and the theme toggle.
- **`SPEC.md`**, a developer handoff that covers:
  - Exact tokens (colour values in both themes, type scale, spacing scale, radii, shadows, breakpoints, motion) and the font files with licences.
  - The brick-motif system: each element, where it appears, where it must not, and how it behaves at each breakpoint.
  - A component inventory (header, footer, nav, docs sidebar, "on this page" navigation, code blocks, callouts, the config table, step lists, placeholders, cards, buttons, and so on), with every state, spacing and responsive behaviour.
  - Page-by-page layout rules and content structure.
  - Accessibility notes and reduced-motion behaviour.
  - A voice and tone guide with examples, because the developer will write copy in your voice.
  - A list of anything that is deliberately flexible, so the developer knows what they may adapt.
- **All assets** as SVG, one file each, plus font files or exact download instructions.
- **`PLACEHOLDERS.md`** with the final list, IDs, captions and alt text.

You may be asked follow-up questions from the developer through the PM later. Keep your reasoning documented so you can answer them. End with a short summary, a statement of whether you opened anything outside your directory, and any `QUESTIONS FOR PM`.
