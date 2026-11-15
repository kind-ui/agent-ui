# Markdown expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `8ada14f8c3a01e81b4eceb89bc36c8a3300c7b6d` (Wave 1 Tasks 1–8, PRs #2–#10)

## Settled

- Everything in AGENTS.md "UI SDK API notes".

## Known and open (don't report again, check whether fixed)

- **A late link definition still replaces blocks that were final:** the document becomes one block so references resolve. Keeping identity needs definitions resolved across blocks (spec §6 decision). Footnotes no longer do this.
- **An unclosed fence loses trailing blank lines on the final `set(…, false)`**, because of the trailing-newline trim. Skip the trim for the last block when not streaming.
- **Tests compare with a one-shot parse only at the end**, not at every chunk boundary.

## Resolved

- **Definition syntax inside code made the document one block.** Fixed: the lexer's `tokens.links` decides, which skips code.
- **A late footnote replaced final blocks.** Fixed: footnotes no longer keep the document one block (spec §6 updated).

## Revisit

Nothing yet.
