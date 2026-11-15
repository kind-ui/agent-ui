# Styles and motion expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `91b7a9c3e0bbcd2a88f90b8a444fe43616c7a820` (Task 9 Conversation)

## Settled

- Everything in AGENTS.md "UI SDK API notes".

## Known and open (don't report again, check whether fixed)

Nothing open.

## Resolved

- **`layout()` during `enter` or `exit` froze the element.** Fixed: presets keep `transform` (compositor); layout drives `translate` and `scale` from a motion value, tracked apart, so neither stops the other.
- **`layout()` collapsed the element to `scale(0, 0)` on every run** (motion zeroed `"none"`). Fixed with the move to `translate`/`scale`, whose end is identity.
- **An interrupted run left stray inline styles** (motion's `stop()` commits a frame later). Fixed: runs are cancelled with values held inline, and a finished run resolves in motion's render step.
- **`expand` snapped for bordered elements.** Fixed: it starts from the computed `height` and ends at the `height` that `box-sizing` needs, for `border-box` and `content-box`.

## Revisit

Nothing yet.
