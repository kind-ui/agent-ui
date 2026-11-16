# Core expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `b1676ea` (Wave 2 Task 8 Queue)

## Settled

- **`kind-queue`'s web `api` lists no `reorder` or `remove`:** both are getters that return `undefined` while unavailable, and a web root's `api` list copies methods once (AGENTS.md, Task 10 "Actions offered while available"). Hosts call them through the agent bridge or the core api.
- **UI SDK's dev warning that `agent.actions` lists `cancel` (or `accept`) while the api lacks it** is expected: those actions are getters that return `undefined` while unavailable (spec §6), and the warning is once per mount (AGENTS.md).
- **A Tool's error part follows its status, not `outcome` (Wave 2 Task 4):** a host `status="error"` shows its message too, and a host status over an errored call hides it. The JSDoc and AGENTS.md say so.
- **A Reasoning `label` is announced as is on completion,** like a Status label; failures and stops still say "Thinking failed" / "Thinking stopped". The JSDoc says to name the outcome in it.
- **A Step's `announcement` runs only once the step has a title** (`label` or the title part's text): every Step-based component has a title, and the JSDoc says so.
- **Markdown and Streaming Text have no accessible name:** they're content with no role, which ARIA doesn't let a name sit on, and they offer no actions (spec §6).
- Everything in AGENTS.md "UI SDK API notes".
- **`affected-specs.mjs` runs every spec for a file it can't place,** and none for code no fixture page loads (the AI SDK adapter); nightly runs cover what a PR skips.
- **Conversation `virtualize` is mount-only,** like a `default*` option: it is read in `state` and not synced.
- **The composer's draft `text` is the Token Input's codec text** and edits sync through the controller's `editor.subscribe`; a cancelled change writes the draft back to the editor. A controlled owner refuses an edit by cancelling it (AGENTS.md, Task 11).
- **`validateCatalog` forwarding UI SDK guard errors has no unit test:** a failing render file would have to sit in `src/`, where the guard's own tests and `npm run lint` already fail it.
- **Status keeps `controlled: ["status"]`** so agents read its status. Clearing `status` resets it to pending while UI SDK's dev warning says it keeps its last value, as with Step's `status`.
- **A Status with a fixed `label` announces that label** on terminal transitions, as the Wave 2 plan says: a host that names its own label names the outcome in it.

## Known and open (don't report again, check whether fixed)

- **A double press on a Queue item's remove control calls `onRemove` twice** when the host removes the item asynchronously; there's no per-item lock like the uploader's.
- **Queue's `known` set never forgets ids,** so an item removed and re-added under the same id after its exit gets no entrance (same as Task and Plan).
- **`initials` is a generic export name** on the core entry, like `Token` and `Highlight`; consider `avatarInitials` before 0.1, since Message will show avatars too.
- **A plan swapped while Accept is pending keeps the lock** until the old promise settles (Wave 2 Task 6). Clearing it on a new `onAccept` can't key on identity, since React passes a new inline function each render; same open spec §4.1 question as the composer's pending lock.
- **Task and Plan's `known` set never forgets ids,** so an item removed and re-added under the same id gets no entrance (same as the uploader's `mounted`).
- **Tool re-serializes its input on every options update** (`toolCode` per streamed chunk). Unmeasured on large inputs; memoize by value if it shows up.
- **"Decision not sent" isn't announced:** `requested` → `submitting` → `submit-failed` stays `awaiting-input`, so the status doesn't change. Confirmation (Wave 3) owns the decision and its error.
- **`ComposerApi.setValue` with the draft's own text still fires `onValueChange`** with a new draft object and returns `true`; nothing changes on screen.
- **Enter held or pressed twice on an uploader Cancel cancels the next row too:** focus recovery moves to the neighbor's Cancel between presses. Spec §7 needs to say whether that's the list-deletion pattern or needs a pause.
- **Queue's `known` set never forgets ids,** so a Queue item removed and added again under the same id gets no entrance (the uploader and attachments now forget an id when its row is dropped).
- **An indicator's new `label` is read out,** as its status content changes; documented on the option. Spec §6 should say whether a label change counts as a terminal transition.
- **Guard comment stripping is regex-based:** a `//` inside a string hides the rest of the line from the forbidden-pattern checks. Use the TypeScript scanner.
- **Guard rule 1 misses `definePrimitive<…Record<…>>(`** with nested generics.
- **`src/internal/index.ts` is imported by nothing.**
- **A batch of rows added at once all play the entrance** (an async first load into an empty conversation). Animating only the newest needs the count before the rows bind, which web markup doesn't guarantee.
- **Exported `Token` and `Highlight` are generic names** for the core entry; they may clash with later exports (Token Input). Consider `CodeToken` / `CodeHighlight` before 0.1.
- **`toLines` trusts that a highlighter's tokens join to exactly the code it was given;** one that trims a trailing newline shifts the plain remainder.
- **A pending submission's lock carries over when a host swaps the controlled `value`** (switching conversations on one instance): the settled result is still ignored for the new draft, but Send stays locked until it settles. Hosts can remount with `key`; spec §4.1 needs to say whether that's required.
- **`setValue` with a draft trusts its `tokens`;** they're rebuilt from `text` only on the next edit.

## Resolved

- **The uploader's `mounted` set never forgot ids (Wave 2 Task 9).** Fixed: the uploader and attachments forget an id once its row is dropped (or at once with `motion="none"`), so an item removed and added again under the same id plays its entrance (tested).
- **Queue (Wave 2 Task 8):** focus follows a focused item that completes into an open Completed section (`createListFocus` tries the lost item's key first, which also covers any list whose item gets a new element); `reorder` refuses an index outside `items`; its JSDoc says the index places the item among the pending ones and `details.index` is where that lands in `items`.
- **Subagent (Wave 2 Task 7):** an unknown web `status` shows the pending words in the meta; `initials` takes each word's first grapheme, skips words that start with punctuation or an emoji, and keeps "ß"; a cancel is announced as "<name> stopped", matching Stop; `agentName`'s TSDoc says what shows without it.
- **Task and Plan (Wave 2 Task 6):** an `onAccept` that throws gives Accept back, as a rejection does; a web task or plan given its items after connecting doesn't announce the status they add up to in the first frame; `ListItem` is no longer exported from the core entry.
- **Chain of Thought review (Wave 2 Task 5):** agents now see the steps as `agent.items` (id and title, `closed: true`), so `expandStep` takes a title; steps and the chain ending in one update are announced once, joined, since a polite `announce` replaces one still waiting; steps set in the first frame aren't announced; auto open reads a controlled `openSteps` from `synced`; an empty title isn't announced; `setStepOpen` refuses an unknown id.
- **A denied tool call was announced as "cancelled" (Wave 2 Task 4).** Fixed: Tool's `announcement` says "<name> denied" when `outcome` is `denied` (spec §4.1).
- **Tool offered `copyInput` with no input (Wave 2 Task 4).** Fixed: it's a getter, `undefined` while the input is empty, and the input copy button is present only with input.
- **Step announcements read state from before the change (Wave 2 Task 3).** Fixed: `announcement` gets the store merged with the `synced` state, so Reasoning builds "Thought for N s" from the new duration and status.
- **Find in page counts as a person (Wave 2 D3):** spec §5 now says a step search opens stays open when it completes, which is what `userToggled` already did.
- **Step behavior was one primitive's, with no way to share it (Wave 2 Task 1):** `stepBase` in `core/step/base.ts` is spread by `stepPrimitive` and every Step-based component; StepList's roving focus and recovery are `createListFocus` in `core/list-focus.ts`.
- **`affected-specs.mjs` missed imports with a query** (`long-answer.md?raw`) and ran every spec for files no fixture loads (Task 18).
- **Docs TSDoc (Task 17):** Step's `defaultOpen` names its computed default and `autoOpen` names both values; `setValue`, `removeAttachment`, `expand` and `collapse` say "whether the change was accepted"; `onSubmit` says a plain return clears the draft; `submit` lists every case it does nothing; controlled options say passing them controls them.
- **Registry (Task 16):** the registry tests now cover bare imports, exact versions, missing files and the setup file type; the consumer check reports missing tokens or Tailwind utilities once rather than per item, fails on a busy port with a message, checks the tarball's sha256 against the manifest, reports a missing package as `missing`, and refuses `..` paths; the build fails when shadcn drops a file.
- **Packed-package gate (Task 15):** the tarball no longer ships source maps pointing at unshipped `src/`; `findForbiddenImports` reads imports with TypeScript's `preProcessFile`, so comments don't match; the size check walks `exports` and fails an entry with no limit; `dist/styles` is cleared before the copy.
- **A disabled composer still let a person or an agent remove attachments.** Fixed: `partState.attachments` leaves `onRemove` out while disabled, and `removeAttachment` refuses.
- **A double click on uploader Retry also cancelled** (Retry turns into Cancel under the pointer). Fixed: a click with `detail > 1` is ignored, and an item takes no second cancel or retry until the host changes its status.
- **Uploader focus recovery went to the first row when the host removed a cancelled item.** Fixed: the fallback reads the order from before the change.
- **Web uploader rows played their entrance on mount.** Fixed: rows in the first frame after the root binds count as mounted.
- **Streaming Text kept one chunk per append.** Fixed: chunks before the first one still fading fold into one.
- **Dots kept flowing when reduced motion was turned on after mount.** Fixed: `onReducedMotionChange` restarts the loop with `flow` while `motion` is `"auto"`.
- **No-`ai` consumers needed `skipLibCheck`.** Fixed: each adapter `import type … from "ai"` carries a JSDoc `/** @ts-ignore */` that survives into the `.d.ts`; `tests/types/no-ai` runs with `skipLibCheck: false`.
- **A host `setOpen` turned off auto close.** Fixed: only the trigger, find in page and `expand`/`collapse` set `userToggled` (spec §5).
- **Composer `disabled` is now exposed on the submit part** (`aria-disabled`), and a disabled composer offers the agent no actions.
- **An unknown Status `status` showed a badge with no text (Wave 2 Task 2).** Fixed: it shows as pending.

## Revisit

Nothing yet.
