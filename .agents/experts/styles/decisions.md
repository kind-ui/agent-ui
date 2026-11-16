# Styles and motion expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `c3bf470` (Wave 2 Task 9 exits)

## Settled

- **Reasoning restyles nested parts through variables** (`--kind-markdown-*`, `--kind-status-mark-complete`) set with one attribute selector, so a class on the content or icon part wins. Code blocks and tables in the thoughts keep their own colors.
- **The Streaming Text caret bar sits 0.15 em past the text:** laid over the last glyph it cuts the letter; past it, a scroll container sized to `max-content` gains about 0.3 em of overflow. Width and line height never change.
- **The uploader progress fill transitions `width`:** UI SDK Progress writes the fill's width inline, and the bar is a 4 px leaf in an `overflow: hidden` track. A `scale` fill would squash its rounded ends.
- Everything in AGENTS.md "UI SDK API notes".
- **Theme colors are `light-dark()` pairs keyed on `color-scheme`, not a `prefers-color-scheme` block:** `@theme` can't nest in a media query, and a class-based dark theme sets `color-scheme: dark` on its root. Highlighter token colors follow the same switch when passed as `light-dark()`.
- **Inline code's radius is `calc(var(--kind-radius) / 2)` in rem, not `0.375em`:** CSS can't divide by a unit, and following `--kind-radius` (0 squares it) matters more than scaling with heading size.
- **Radii scale from `--kind-radius` by `/ 3`, `/ 2`, `* 2 / 3`, `1` and `* 1.5`;** pills and 1–2 px detail radii stay fixed. Nested corners subtract the inset, floored at 0.
- **A Status badge's width follows its label;** its height doesn't change, and the docs say to put it at the end of a row.

## Known and open (don't report again, check whether fixed)

- **The composer's attachments area opens and closes in one frame:** when its first chip arrives or its last one is dropped, the input and buttons below move by the area's height (48px) at once. Fix in the composer: play `expand` on the area and hide it once that ends, and have a test follow `kind-composer-input`.
- **A dropped Queue row snaps from the pointer to its slot in one frame:** `createReorder` clears `--drag-x`/`--drag-y` before the drop commits, so the root's `layout` has no rect from before. Carrying it needs the row's rect before UI SDK's drag stops.
- **Subagent's guide line and nested marks are half a pixel off at 1x,** likely Chrome drawing the 1.5px guide border at 1px (as the status mark ring noted); a result already complete on load fades in once on mount.
- **Task and Plan selectors reach 3–4 attributes** (completed fill, held-still title, item status → title); consumer utilities and unlayered CSS still win by layer order. Wrap the context halves in `:where()` if a consumer writing in `@layer components` hits it.
- **`plan.spec.ts` doesn't check the progress fill's motion;** checked by hand: `width` over 280 ms at full motion, none under reduced motion and `motion="reduced"`.
- **`field-sizing: content` on the message editor grows only in Chromium;** elsewhere it keeps its 2.5rem minimum.
- **Chain of Thought: the line to a new step appears at once** while the step fades up (`--kind-duration-base`), pointing 2px into the space it's about to take. No layout moves; drawing it from the new item can't reach a previous item's open content.

## Resolved

- **Removed chips and uploader rows left without an exit, and the items after them jumped (Wave 2 Task 9).** Fixed with Queue's leaving rows (spec §6 "Removed items"): the row stays `inert` and `aria-hidden` while it fades, then the items after it slide into place; a leaving row keeps its preview and Cancel/Retry button, so it doesn't reflow as it fades; the composer keeps its attachments area while the last chip leaves. `layout` now writes its inverted position at once, and the slide starts on the list's first DOM change, so the rows don't sit a frame at their new place before sliding (also Queue's). Reduced motion is a 120 ms fade with no slide; `motion="none"` leaves at once (tested on both layers). An `enter` after an interrupted `fade-up` settles the held `transform` as it plays instead of snapping at the end (`motion.spec.ts`).
- **Queue (Wave 2 Task 8):** a picked-up row isn't clipped by its section's panel (`overflow: visible` while one is grabbed); the remove control's pointer target is 24px; context selectors sit in `:where()`, so each rule stays one attribute.
- **Subagent (Wave 2 Task 7):** the result's fade honors `prefers-reduced-motion` (the media rule now outranks the base rule); an empty result hides; the trigger's corner is concentric with the frame; the avatar's rules are `:where()`-wrapped to one attribute.
- **Plan (Wave 2 Task 6):** the progress bar and Accept use logical offsets, so they line up with the title in right-to-left text (tested); a pending Accept doesn't darken on hover; the progress label reserves `13ch`, so the track doesn't narrow when a count gains a digit.
- **Chain of Thought (Wave 2 Task 5):** the step line's ends follow `0.5lh`, so it stays 2px clear of both marks at any font size; the held-still summary title is `:where()`-scoped to two attributes.
- **The needs-input dot sat half a pixel low-right, and the running arc missed its track (Wave 2 Task 3).** Chrome draws the 1.5px ring at 1px, so `inset: 3.5px` and `inset: -1.5px` landed off by half a pixel. Fixed: a 1px ring, a 6px dot centered with `margin: auto`, and an opaque track; `status.spec.ts` measures both at 1x and 2x.
- **The status mark scaled its glyph under reduced motion, and only Step could draw it (Wave 2 Task 1).** Fixed: `status-mark.css` draws any `[data-status-mark]`, fades the fill and glyph over `--kind-duration-reduced` with no scale under reduced motion, and transitions nothing under `motion="none"`.
- **The Step title shimmer lacked `-webkit-background-clip`.** Fixed, as the Thinking label has it.
- **Highlighter colors didn't follow dark mode.** Fixed by the `light-dark()` theme: hosts pass `light-dark()` token colors (tested in `markdown.spec.ts`).
- **The table copy button was styled in `code-block.css`.** Fixed: `markdown-table.css` has its own rule.
- **The attachment remove badge's pointer target was 20 px.** Fixed: an `::after` grows it to 24 px; the badge still draws at 20 px.
- **Changing `motion` froze the dots at uneven opacities:** motion's `stop()` wrote opacity back a frame later. Fixed: loops end with `cancel()`.
- **A motion change replayed the dots' entrance.** Fixed: it restarts only the loop (`flow`).
- **The Streaming Text caret added 1 px of line height and scroll overflow.** Fixed: an empty inline with a positioned bar.
- **`layout()` during `enter` or `exit` froze the element.** Fixed: presets keep `transform` (compositor); layout drives `translate` and `scale` from a motion value, tracked apart, so neither stops the other.
- **`layout()` collapsed the element to `scale(0, 0)` on every run** (motion zeroed `"none"`). Fixed with the move to `translate`/`scale`, whose end is identity.
- **An interrupted run left stray inline styles** (motion's `stop()` commits a frame later). Fixed: runs are cancelled with values held inline, and a finished run resolves in motion's render step.
- **`expand` snapped for bordered elements.** Fixed: it starts from the computed `height` and ends at the `height` that `box-sizing` needs, for `border-box` and `content-box`.
- **The Status mark sat 1px off-center in its pill (Wave 2 Task 2).** Fixed: the start padding is worked out from the pill's height.

## Revisit

Nothing yet.
