# Styles and motion expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `9b766ae` (Task 12 Uploader and indicators)

## Settled

- **The uploader progress fill transitions `width`:** UI SDK Progress writes the fill's width inline, and the bar is a 4 px leaf in an `overflow: hidden` track. A `scale` fill would squash its rounded ends.
- Everything in AGENTS.md "UI SDK API notes".

## Known and open (don't report again, check whether fixed)

- **Uploader rows leave without an exit animation,** and the rows after them jump up (same gap as attachment chips).
- **The Step title shimmer has only the unprefixed `background-clip: text`;** the Thinking label now adds `-webkit-background-clip`. Align Step with Task 14.
- **Highlighter colors don't follow dark mode:** a token's color is one value; hosts must pass `light-dark()` colors, which need `color-scheme` on the page. Revisit with the Task 14 theme tokens.
- **The table copy button is styled in `code-block.css`** (shared icon-button rule). Split it out if the registry ever ships per-component stylesheets.
- **`field-sizing: content` on the message editor grows only in Chromium;** elsewhere it keeps its 2.5rem minimum.
- **The attachment remove button is 20 px,** under the 24 px target size on touch; Delete on the chip is the keyboard path.
- **Removed chips leave without an exit animation,** and the chips after them jump into place.

## Resolved

- **Changing `motion` froze the dots at uneven opacities:** motion's `stop()` wrote opacity back a frame later. Fixed: loops end with `cancel()`.
- **A motion change replayed the dots' entrance.** Fixed: it restarts only the loop (`flow`).
- **The Streaming Text caret added 1 px of line height and scroll overflow.** Fixed: an empty inline whose bar lies over the end of the text.
- **`layout()` during `enter` or `exit` froze the element.** Fixed: presets keep `transform` (compositor); layout drives `translate` and `scale` from a motion value, tracked apart, so neither stops the other.
- **`layout()` collapsed the element to `scale(0, 0)` on every run** (motion zeroed `"none"`). Fixed with the move to `translate`/`scale`, whose end is identity.
- **An interrupted run left stray inline styles** (motion's `stop()` commits a frame later). Fixed: runs are cancelled with values held inline, and a finished run resolves in motion's render step.
- **`expand` snapped for bordered elements.** Fixed: it starts from the computed `height` and ends at the `height` that `box-sizing` needs, for `border-box` and `content-box`.

## Revisit

Nothing yet.
