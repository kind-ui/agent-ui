---
name: unslop
description: Removes generated-looking code from an agent-ui diff or files, like comments that restate the code, filler JSDoc, defensive checks for impossible cases, one-caller helpers and vague names, without changing behavior. Use as the last step of any change before expert-review, or when asked to clean up, trim comments or remove slop.
metadata:
  internal: true
---

# Unslop

Scope is the diff (`git diff <base>...HEAD`) unless you're given files. Behavior never changes: the same tests pass before and after, and nothing public is renamed.

## What goes

**A comment that says what the next line does.** Delete it. If the line isn't clear without it, rename something.

```ts
// Close the step when it completes.
if (status === "complete") close()
```

**A comment on every declaration.** Most constants, fields and functions need none: the name and the type say what they are. Delete each one that doesn't stop a reader from getting the code wrong.

**A comment that explains the design.** What a value holds, where it's kept, which attribute it lands on, who reads it. The code says that. Keep the one fact it can't show, in a line, or delete the comment.

**A comment longer than three lines.** Cut it to the reason. A longer explanation goes in AGENTS.md "UI SDK API notes", the spec, or a test title.

**A comment that narrates history or the task.** "Now we", "Updated to", "Fixed the bug where", "Task 8", "As requested". Delete it. Git holds the history.

**A section banner.** `// ---- Helpers ----`, `/* State */`. Delete it. Split the file if it needs signposts.

**JSDoc that repeats the name.** `/** The status. */ status`. Say what the reader can't see: the default, the unit, when it's called, what happens on change.

**A hedge or a sales word in a comment or a doc.** "Robust", "seamless", "comprehensive", "simply", "just", "easily", "ensure", "leverage", "utilize", "note that", "it's important to". Cut the word; if nothing is left, cut the comment.

**A defensive check the types already rule out.** `if (!items) return` on `items: Item[]`, `?? []` on a value that's never undefined, `try` around code that can't throw. Delete it. Narrow `unknown` at a boundary (the AI SDK adapter, a guard in `src/types/guards.ts`) instead.

**A cast or `!` with no reason.** Make the type right, or say why in a comment.

**A one-caller helper, or a wrapper that only renames.** Inline it, unless its name explains something the call can't.

**A name that says nothing.** `data`, `result`, `item2`, `handle2`, `temp`, `flag`. Name what it is.

**An option nobody passes,** a parameter with one value, a config object for one setting. Delete it, unless the spec names it as public API.

**Logs, probes and commented-out code.** Delete them.

**In fixtures, any comment at all,** except tool directives (`biome-ignore`, `@ts-expect-error` with its reason).

## What stays

- A comment that says why, in three lines at most: a browser bug and the browser, a UI SDK quirk, a trade-off, a link to the spec section or test that pins the behavior.
- Spec references like `(spec §6)` on code that implements a spec rule.
- JSDoc on every public export and option. Make it say more; don't delete it.
- Every exception entry the UI SDK guard (`scripts/ui-sdk-exceptions.json`) needs.

## Steps

1. List what you'll change, by file, before touching anything.
2. Make the changes.
3. Run `npm run lint`, `npm run typecheck` and, when you touched core, types or the adapter, `npm run test:unit`. Check exit codes.
4. Delete each comment left in the diff and reread the code. If it still reads right, leave it deleted.
5. Read the diff once more. Revert any change that doesn't make the code easier to read.
6. If one pattern showed up in three or more files, propose a check for it in `scripts/check-ui-sdk-usage.mjs` or a Biome rule.
