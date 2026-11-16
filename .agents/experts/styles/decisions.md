# Styles and motion expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `0391584` (Wave 2 Task 2 Status)

## Settled

- **The Streaming Text caret bar sits 0.15 em past the text:** laid over the last glyph it cuts the letter; past it, a scroll container sized to `max-content` gains about 0.3 em of overflow. Width and line height never change.
- **The uploader progress fill transitions `width`:** UI SDK Progress writes the fill's width inline, and the bar is a 4 px leaf in an `overflow: hidden` track. A `scale` fill would squash its rounded ends.
- Everything in AGENTS.md "UI SDK API notes".
- **Theme colors are `light-dark()` pairs keyed on `color-scheme`, not a `prefers-color-scheme` block:** `@theme` can't nest in a media query, and a class-based dark theme sets `color-scheme: dark` on its root. Highlighter token colors follow the same switch when passed as `light-dark()`.
- **Inline code's radius is `calc(var(--kind-radius) / 2)` in rem, not `0.375em`:** CSS can't divide by a unit, and following `--kind-radius` (0 squares it) matters more than scaling with heading size.
- **Radii scale from `--kind-radius` by `/ 3`, `/ 2`, `* 2 / 3`, `1` and `* 1.5`;** pills and 1–2 px detail radii stay fixed. Nested corners subtract the inset, floored at 0.
- **A Status badge's width follows its label;** its height doesn't change, and the docs say to put it at the end of a row.

## Known and open (don't report again, check whether fixed)

- **Uploader rows leave without an exit animation,** and the rows after them jump up (same gap as attachment chips). Not cheap: the host removes the item, so an exit needs the primitive to keep leaving items in state (changing `items` and the agent snapshot) or a post-render hook for `layout`. Decided in spec §6 "Removed items" (leaving rows, `core/leaving.ts`); Wave 2 Task 9 builds it.
- **`field-sizing: content` on the message editor grows only in Chromium;** elsewhere it keeps its 2.5rem minimum.
- **Removed chips leave without an exit animation,** and the chips after them jump into place.

## Resolved

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
