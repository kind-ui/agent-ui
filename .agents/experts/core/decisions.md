# Core expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `13d7a856f18a3d7da27479114b204f28ee47cbdf` (Task 10 Message, Markdown, Code Block, Markdown Table)

## Settled

- Everything in AGENTS.md "UI SDK API notes".
- **Conversation `virtualize` is mount-only,** like a `default*` option: it is read in `state` and not synced.

## Known and open (don't report again, check whether fixed)

- **Guard comment stripping is regex-based:** a `//` inside a string hides the rest of the line from the forbidden-pattern checks. Use the TypeScript scanner.
- **Guard rule 1 misses `definePrimitive<…Record<…>>(`** with nested generics.
- **Find-in-page sets `userToggled`**, so a step revealed by search no longer auto-closes on `complete`. Spec §5 needs to say whether search counts as a person.
- **Composer `disabled` is not exposed** on the submit part (`aria-disabled`), so assistive tech and the agent snapshot see an enabled button.
- **`src/internal/index.ts` is imported by nothing.**
- **A batch of rows added at once all play the entrance** (an async first load into an empty conversation). Animating only the newest needs the count before the rows bind, which web markup doesn't guarantee.
- **Exported `Token` and `Highlight` are generic names** for the core entry; they may clash with later exports (Token Input). Consider `CodeToken` / `CodeHighlight` before 0.1.
- **`toLines` trusts that a highlighter's tokens join to exactly the code it was given;** one that trims a trailing newline shifts the plain remainder.

## Resolved

- **No-`ai` consumers needed `skipLibCheck`.** Fixed: each adapter `import type … from "ai"` carries a JSDoc `/** @ts-ignore */` that survives into the `.d.ts`; `tests/types/no-ai` runs with `skipLibCheck: false`.
- **A host `setOpen` turned off auto close.** Fixed: only the trigger, find in page and `expand`/`collapse` set `userToggled` (spec §5).

## Revisit

Nothing yet.
