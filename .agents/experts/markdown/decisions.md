# Markdown expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `f121ef05955c7871ed404b9460d8529b7a299146` (Wave 1 review fixes)

## Settled

- Everything in AGENTS.md "UI SDK API notes".

## Known and open (don't report again, check whether fixed)

- **A late link definition still replaces blocks that were final:** the document becomes one block so references resolve. Keeping identity needs definitions resolved across blocks (spec §6 decision). Footnotes no longer do this.
- **An unclosed fence loses trailing blank lines on the final `set(…, false)`**, because of the trailing-newline trim. Skip the trim for the last block when not streaming.
- **A footnote reference followed by `(url)` renders as a link once split**, where a one-shot parse shows `[^1]` then an autolink. Rendering only (the URL is sanitized); documented in spec §6.
- **Tests compare with a one-shot parse only at the end**, not at every chunk boundary.

## Resolved

- **Definition syntax inside code made the document one block.** Fixed: the lexer's `tokens.links` decides, which skips code.
- **A late footnote replaced final blocks.** Fixed: footnotes no longer keep the document one block (spec §6 updated). A `Tokenizer` override stops marked taking `[^x]: word` as a link definition, so a streamed definition never collapses the document, and an indented continuation joins its definition.

## Revisit

Nothing yet.
