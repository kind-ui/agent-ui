# Styles and motion expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `8ada14f8c3a01e81b4eceb89bc36c8a3300c7b6d` (Wave 1 Tasks 1–8, PRs #2–#10)

## Settled

- Everything in AGENTS.md "UI SDK API notes".

## Known and open (don't report again, check whether fixed)

Nothing open.

## Resolved

- **`layout()` during `enter` or `exit` froze the element.** Fixed: presets move with `translate` and layout with `transform`, and layout runs are tracked apart, so neither stops the other.
- **`expand` snapped for bordered elements.** Fixed: it animates to the `height` that `box-sizing` needs, borders included.

## Revisit

Nothing yet.
