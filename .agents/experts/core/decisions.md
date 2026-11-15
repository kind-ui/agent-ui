# Core expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `9b766ae` (Task 12 Uploader and indicators)

## Settled

- **Markdown and Streaming Text have no accessible name:** they're content with no role, which ARIA doesn't let a name sit on, and they offer no actions (spec §6).
- Everything in AGENTS.md "UI SDK API notes".
- **Conversation `virtualize` is mount-only,** like a `default*` option: it is read in `state` and not synced.
- **The composer's draft `text` is the Token Input's codec text** and edits sync through the controller's `editor.subscribe`; a cancelled change writes the draft back to the editor. A controlled owner refuses an edit by cancelling it (AGENTS.md, Task 11).

## Known and open (don't report again, check whether fixed)

- **Enter held or pressed twice on an uploader Cancel cancels the next row too:** focus recovery moves to the neighbor's Cancel between presses. Spec §7 needs to say whether that's the list-deletion pattern or needs a pause.
- **The uploader's `mounted` set never forgets ids,** so an item removed and re-added under the same id gets no entrance.
- **An indicator's new `label` is read out,** as its status content changes; documented on the option. Spec §6 should say whether a label change counts as a terminal transition.
- **Guard comment stripping is regex-based:** a `//` inside a string hides the rest of the line from the forbidden-pattern checks. Use the TypeScript scanner.
- **Guard rule 1 misses `definePrimitive<…Record<…>>(`** with nested generics.
- **Find-in-page sets `userToggled`**, so a step revealed by search no longer auto-closes on `complete`. Spec §5 needs to say whether search counts as a person.
- **`src/internal/index.ts` is imported by nothing.**
- **A batch of rows added at once all play the entrance** (an async first load into an empty conversation). Animating only the newest needs the count before the rows bind, which web markup doesn't guarantee.
- **Exported `Token` and `Highlight` are generic names** for the core entry; they may clash with later exports (Token Input). Consider `CodeToken` / `CodeHighlight` before 0.1.
- **`toLines` trusts that a highlighter's tokens join to exactly the code it was given;** one that trims a trailing newline shifts the plain remainder.
- **A pending submission's lock carries over when a host swaps the controlled `value`** (switching conversations on one instance): the settled result is still ignored for the new draft, but Send stays locked until it settles. Hosts can remount with `key`; spec §4.1 needs to say whether that's required.
- **`setValue` with a draft trusts its `tokens`;** they're rebuilt from `text` only on the next edit.

## Resolved

- **A double click on uploader Retry also cancelled** (Retry turns into Cancel under the pointer). Fixed: a click with `detail > 1` is ignored, and an item takes no second cancel or retry until the host changes its status.
- **Uploader focus recovery went to the first row when the host removed a cancelled item.** Fixed: the fallback reads the order from before the change.
- **Web uploader rows played their entrance on mount.** Fixed: rows in the first frame after the root binds count as mounted.
- **Streaming Text kept one chunk per append.** Fixed: chunks before the first one still fading fold into one.
- **Dots kept flowing when reduced motion was turned on after mount.** Fixed: `onReducedMotionChange` restarts the loop with `flow` while `motion` is `"auto"`.
- **No-`ai` consumers needed `skipLibCheck`.** Fixed: each adapter `import type … from "ai"` carries a JSDoc `/** @ts-ignore */` that survives into the `.d.ts`; `tests/types/no-ai` runs with `skipLibCheck: false`.
- **A host `setOpen` turned off auto close.** Fixed: only the trigger, find in page and `expand`/`collapse` set `userToggled` (spec §5).
- **Composer `disabled` is now exposed on the submit part** (`aria-disabled`), and a disabled composer offers the agent no actions.

## Revisit

Nothing yet.
