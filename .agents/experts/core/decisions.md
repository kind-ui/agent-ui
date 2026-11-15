# Core expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `f121ef05955c7871ed404b9460d8529b7a299146` (Wave 1 review fixes)

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

## Resolved

- **No-`ai` consumers needed `skipLibCheck`.** Fixed: each adapter `import type … from "ai"` carries a JSDoc `/** @ts-ignore */` that survives into the `.d.ts`; `tests/types/no-ai` runs with `skipLibCheck: false`.
- **A host `setOpen` turned off auto close.** Fixed: only the trigger, find in page and `expand`/`collapse` set `userToggled` (spec §5).

## Revisit

Nothing yet.
