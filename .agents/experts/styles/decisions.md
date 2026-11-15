# Styles and motion expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `75c679c` (Task 11 Composer and Attachments)

## Settled

- Everything in AGENTS.md "UI SDK API notes".

## Known and open (don't report again, check whether fixed)

- **Highlighter colors don't follow dark mode:** a token's color is one value; hosts must pass `light-dark()` colors, which need `color-scheme` on the page. Revisit with the Task 14 theme tokens.
- **The table copy button is styled in `code-block.css`** (shared icon-button rule). Split it out if the registry ever ships per-component stylesheets.
- **`field-sizing: content` on the message editor grows only in Chromium;** elsewhere it keeps its 2.5rem minimum.
- **The attachment remove button is 20 px,** under the 24 px target size on touch; Delete on the chip is the keyboard path.
- **Removed chips leave without an exit animation,** and the chips after them jump into place.

## Resolved

- **`layout()` during `enter` or `exit` froze the element.** Fixed: presets keep `transform` (compositor); layout drives `translate` and `scale` from a motion value, tracked apart, so neither stops the other.
- **`layout()` collapsed the element to `scale(0, 0)` on every run** (motion zeroed `"none"`). Fixed with the move to `translate`/`scale`, whose end is identity.
- **An interrupted run left stray inline styles** (motion's `stop()` commits a frame later). Fixed: runs are cancelled with values held inline, and a finished run resolves in motion's render step.
- **`expand` snapped for bordered elements.** Fixed: it starts from the computed `height` and ends at the `height` that `box-sizing` needs, for `border-box` and `content-box`.

## Revisit

Nothing yet.
