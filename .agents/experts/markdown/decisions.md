# Markdown expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `8ada14f8c3a01e81b4eceb89bc36c8a3300c7b6d` (Wave 1 Tasks 1–8, PRs #2–#10)

## Settled

- Everything in AGENTS.md "UI SDK API notes".

## Known and open (don't report again, check whether fixed)

- **A `[^x]` or `[x]:` inside code makes the document one block**, so every chunk reparses everything (41 s vs 0.6 s on the long fixture). Decide from lexer tokens (`tokens.links`, non-code tokens), not the raw text.
- **A late footnote or link definition replaces blocks that were final** (spec §6 says final blocks are immutable). Either document that the keys change, or resolve definitions across blocks.
- **An unclosed fence loses trailing blank lines on the final `set(…, false)`**, because of the trailing-newline trim. Skip the trim for the last block when not streaming.
- **Tests compare with a one-shot parse only at the end**, not at every chunk boundary.

## Revisit

Nothing yet.
