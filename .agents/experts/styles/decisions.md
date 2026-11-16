# Styles and motion expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `ee4fcca` (Wave 4 Task 6 File Tree)

## Settled

- **A File Tree file the host removes leaves at once** (Wave 4 Task 6): spec §6 "Removed items" names Queue, Attachments and Uploader; a file tree reflects the change set, as Sources does.
- **Generated Image's preview keeps the image's box, so its blurred edges soften into the field** (Wave 4 Task 5): an overhang wide enough to hide the bleed zooms and shifts the composition, which then jumps when the image lands. The landing's mask (`--kind-generated-image-dissolve`) and the preview's filter transitions repaint for about a second once per image, which the dissolve needs.
- **The Context Meter ring sweeps by transitioning `--meter-value`** (Wave 3 Task 8), which repaints its `conic-gradient` on the main thread: a 16 px element for 280 ms, never on mount, and off under reduced motion.
- **Reasoning restyles nested parts through variables** (`--kind-markdown-*`, `--kind-status-mark-complete`) set with one attribute selector, so a class on the content or icon part wins. Code blocks and tables in the thoughts keep their own colors.
- **The Streaming Text caret bar sits 0.15 em past the text:** laid over the last glyph it cuts the letter; past it, a scroll container sized to `max-content` gains about 0.3 em of overflow. Width and line height never change.
- **The uploader progress fill transitions `width`:** UI SDK Progress writes the fill's width inline, and the bar is a 4 px leaf in an `overflow: hidden` track. A `scale` fill would squash its rounded ends.
- Everything in AGENTS.md "UI SDK API notes".
- **Theme colors are `light-dark()` pairs keyed on `color-scheme`, not a `prefers-color-scheme` block:** `@theme` can't nest in a media query, and a class-based dark theme sets `color-scheme: dark` on its root. Highlighter token colors follow the same switch when passed as `light-dark()`.
- **Inline code's radius is `calc(var(--kind-radius) / 2)` in rem, not `0.375em`:** CSS can't divide by a unit, and following `--kind-radius` (0 squares it) matters more than scaling with heading size.
- **Radii scale from `--kind-radius` by `/ 3`, `/ 2`, `* 2 / 3`, `1` and `* 1.5`;** pills and 1–2 px detail radii stay fixed. Nested corners subtract the inset, floored at 0.
- **A Status badge's width follows its label;** its height doesn't change, and the docs say to put it at the end of a row.

## Known and open (don't report again, check whether fixed)

- **A file added to a folder while it opens may be clipped until the open ends** (Wave 4 Task 6): `--tree-group-height` is measured as the open starts. Not reproduced.
- **The shimmer's band snaps to its start as it fades out when the image loads** (Wave 4 Task 5, suspected, not measured frame by frame): the animation stops with the phase; the image fades in over it.
- **An expanded Document whose content resizes after streaming ends eases to the new height over `--kind-duration-panel`** (suspected, not reproduced), so its last lines could be clipped that long.
- **On web, a step's content that starts closed can fade its parts' colors in the first time it opens** (Wave 3 Task 11): `hidden="until-found"` skips style updates, so parts styled bare by a bind's style read before their attributes landed keep that style until the reveal, after `data-mounting` is gone. Rows and roots hold through their first frames; ending the hold at a part's first styled frame needs UI SDK binds not to read style while parts connect (upstream).
- **Mask-drawn icons vanish in forced colors** in the stylesheets without a `forced-colors` rule; Feedback's thumbs, the status mark and Notice's Dismiss have one.
- **Feedback's thanks is wider than "Add a comment",** so the row grows sideways by its text when it appears; height holds. Feedback ends a message's actions, so nothing usually sits after it.
- **The Context Meter's high-level glyph in light mode** is `--kind-color-warning` on white, about 2.5:1, under 3:1 for graphics; the percentage beside it carries the value.
- **Suggestion: Tab to a chip half out of view doesn't scroll it in** (UI SDK Carousel counts it in view), so its end and focus ring sit under the end fade.
- **Suggestion: `motion="none"` doesn't stop Carousel's paging scroll,** which follows only `prefers-reduced-motion`; UI SDK's Carousel takes no motion option. The docs say so.
- **Checkpoint: "Restored" is wider than the Restore icon,** so the line (or a long description) gets about 47px shorter in one frame when it swaps in. Nothing moves vertically.
- **Checkpoint's restore icon doesn't mirror in right-to-left text;** undecided whether a counter-clockwise arrow should.
- **Re-checking a checkbox while its indicator fades out restarts the fade-in** for about 2 frames: UI SDK puts `data-starting-style` back on the same element (report upstream).
- **Question's indicator fades with the default `ease` while it scales with `--kind-ease`,** as `status-mark.css` does.
- **A long denial reason in Confirmation's outcome is cut with an ellipsis** and can't be read in full on screen; it stays in the DOM.
- **A chip that wraps the composer's attachments onto a new row moves the editor by a row (56px) in one frame;** only empty ↔ filled is animated. Animate the area's height from its previous height when the chip count changes while it's open.
- **A dropped Queue row snaps from the pointer to its slot in one frame:** `createReorder` clears `--drag-x`/`--drag-y` before the drop commits, so the root's `layout` has no rect from before. Carrying it needs the row's rect before UI SDK's drag stops.
- **Subagent's guide line and nested marks are half a pixel off at 1x,** likely Chrome drawing the 1.5px guide border at 1px (as the status mark ring noted); a result already complete on load fades in once on mount.
- **Task and Plan selectors reach 3–4 attributes** (completed fill, held-still title, item status → title); consumer utilities and unlayered CSS still win by layer order. Wrap the context halves in `:where()` if a consumer writing in `@layer components` hits it.
- **`plan.spec.ts` doesn't check the progress fill's motion;** checked by hand: `width` over 280 ms at full motion, none under reduced motion and `motion="reduced"`.
- **`field-sizing: content` on the message editor grows only in Chromium;** elsewhere it keeps its 2.5rem minimum.
- **Chain of Thought: the line to a new step appears at once** while the step fades up (`--kind-duration-base`), pointing 2px into the space it's about to take. No layout moves; drawing it from the new item can't reach a previous item's open content.

## Resolved

- **File Tree in forced colors, specificity, `motion="none"` and the warning dot** (Wave 4 Task 6): a selected row is `SelectedItem`, qualifiers sit in `:where()`, the start opacity skips `motion="none"`, and the dot mixes toward the text color for 3:1.
- **Generated Image redesign: paints, contrast and regenerate** (Wave 4 Task 5): the drifting field repainted every frame (240 paints in 2 s); it is now static gradients on an oversized `::before` that only rotates and breathes, and the grain an oversized `::after` that jumps with `translate`, 42 paints in 2 s. The corner chip is 90% surface (the percentage was 3.35:1 in light), its value reserves `7ch`, and the preview fades back in on regenerate instead of popping. The sheen is dropped: it repainted and the grain already moves.
- **Generated Image's dialog, reduced motion and specificity** (Wave 4 Task 5): a long `alt` stretched the full image (the actions row is `contain: inline-size`, the image `object-fit: contain`); reduced motion and `none` left a still shimmer band (the `::after` now hides) and ran the 150 ms hover fades; the frame, progress and preview contexts sit in `:where()`; the preview fades out under the loaded image, so a transparent image doesn't show it.
- **Document's Show more moved the card 40px in one frame, its focus ring was invisible, it sat off-centre in right-to-left text, and its selectors were five attributes deep** (Wave 4 Task 4): Show more stays absolute over a spacer kept whenever the content overflows, and the expanded `max-height` adds that space; the body draws the viewport's ring (`:has(:focus-visible)`), as Conversation's root does; it centres with `left: 50%`; the context is in `:where()`; the header's padding is logical. Its rules also now reach only the outermost scroll area, not a table's or Code Block's inside it.
- **The Inline Citation marker made a line under 1.3 line height taller, and the carousel clipped a focused link's ring** (Wave 4 Task 3): the marker has `margin-block: -0.25em` (spec at line height 1), and the slides have 4 px padding inside a viewport pulled out by as much.
- **Sources (Wave 4 Task 2):** selectors are one attribute with context in `:where()`, so a consumer class restyles the panel, row hover and title hover; a long host name shrinks before the title; the item's hover fade no longer half-follows reduced motion (matches the Step trigger).
- **Notice and the status mark (Wave 3 Task 10):** in forced colors the running mark's track is `GrayText`, so its arc still shows; the light warning glyph uses `--kind-color-on-warning` (white on amber was 2.57:1); a closed Guardrail detail takes back its row gap; the notice's padding is logical; Why? and Dismiss follow the reduced and `none` motion modes.
- **Feedback (Wave 3 Task 9):** the thumbs show in forced colors; the pressed icon rule wraps its context in `:where()`, so a consumer's icon class wins.
- **Context Meter (Wave 3 Task 8):** the details closed in 150 ms under reduced motion (the exit duration is set again in the reduced rules, tested); the percentage reserves `4ch + 1em`, so "100 %" in `de-DE` doesn't widen the trigger (tested); level, motion and `[hidden]` rules sit behind `:where()`; the trigger's transitions use `--kind-ease-out`.
- **Suggestion (Wave 3 Task 7):** Previous and Next stay shown while one holds focus; a page Next scrolled to starts past the start fade (the viewport's start inset holds it); context selectors sit in `:where()`, so a class in `@layer components` restyles a two-line chip.
- **Model Selector and Reasoning Effort (Wave 3 Task 6):** the effort mark slides with `translate` and `width`, not `left`/`top`; the reduced fill runs color, background and border in 120 ms together; the list's exit runs every property at `--kind-duration-fast`; the search field is `h-full`, inside the field's border.
- **Checkpoint (Wave 3 Task 5):** a wrapped error made the dialog 8px taller on narrow screens (the error's line height is 1rem, so two lines fit the row); the backdrop closed 50ms after the dialog (both use the fast duration); reduced-motion fades were `linear` (now `--kind-ease-out`, as the JS helper's).
- **The internal Textarea was 14px beside 13px Confirmation and Question text (Wave 3 Task 4).** Fixed: it inherits its font size and line height. Question's option rows wrap their context in `:where()`, so they stay one attribute deep.
- **The composer's attachments area opened and closed in one frame (Wave 3 Task 2).** Fixed: the area plays the motion helper's `expand` in the frame after its first chip arrives (so the chip has rendered and measures) and its `expand` exit when the last is removed, and stays shown until the collapse and the chip's exit both end. The dropzone grid has no row gap; the area's spacing is inside it, so a collapsed area takes no room. Reduced motion fades it with no height change; `motion="none"` opens and closes at once. The helper's springs start at rest (`velocity: 0`), so a chip attached mid-collapse reverses it without overshooting, and the area's top padding holds a chip's remove badge inside the box the expand clips. `composer.spec.ts` follows `kind-composer-input` each painted frame in both layers.
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
