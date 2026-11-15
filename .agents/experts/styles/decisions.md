# Styles and motion expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `8ada14f8c3a01e81b4eceb89bc36c8a3300c7b6d` (Wave 1 Tasks 1–8, PRs #2–#10)

## Settled

- Everything in AGENTS.md "UI SDK API notes".

## Known and open (don't report again, check whether fixed)

- **`layout()` during `enter` or `exit` freezes the element:** `interrupt` stops the fade mid-way (opacity stays ~0.08) or cancels the exit with `AbortError`. Keep layout runs separate from enter/exit runs.
- **`expand` snaps at the end** for bordered elements: it animates to `scrollHeight`, which excludes borders.

## Revisit

Nothing yet.
