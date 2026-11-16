# Core expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `2550e7c` (Wave 4 Task 1 groundwork)

## Settled

- **The Step root writes `data-mounting` in its `bind`, not through `attrs`** (Wave 3 Task 11): it lasts two frames per element and isn't state, so a store flag would render every React part again to clear it; `wave-3/agent.spec.ts` checks no Step part runs a transition on load. **`imports` in `size-budget.json` is required:** the file is ours, and a missing key fails the check.
- **A dismissed notice the host never removes stays faded and inert** (Wave 3 Task 10, D10): the host removes it in `onDismiss`; only a rejection brings it back.
- **A Feedback comment that failed keeps its error and text until the next send** (Wave 3 Task 9), through a close and a rating change: the error belongs to the text it failed to send, which the box still holds.
- **Suggestion's `pick` has no lock** (Wave 3 Task 7): `onPick` is a `callback`, as the plan says, so a double press calls it twice. A host whose pick sends a prompt drops a repeat itself, as it would for a double-clicked send.
- **Model Selector marks matches only in the name** (Wave 3 Task 6): a model the query found through its group or description shows no mark. Spec §7 asks for match highlighting on the options, which are named by the model; marking descriptions would add a second highlighted line per row.
- **Checkpoint `defaultOpen` logs UI SDK's dev warning that `agent.actions` lists `restore`** (Wave 3 Task 5): `restore` is a getter that returns `undefined` while the dialog is open, as the other Wave 3 actions do.
- **Checkpoint's `restored` isn't in `controlled`** (Wave 3 Task 5): on web a boolean attribute turned off reads `undefined`, which made UI SDK warn that it stopped controlling it. An agent sees Restore gone and "Restored" instead.
- **A denial in a Tool is announced twice, "Denied" then "<name> denied" (Wave 3 Task 3):** spec §4.1 keeps the recorded response and the resulting execution state apart; Confirmation announces the first and Tool its outcome, and a host sets them in separate updates.
- **`kind-queue`'s web `api` lists no `reorder` or `remove`:** both are getters that return `undefined` while unavailable, and a web root's `api` list copies methods once (AGENTS.md, Task 10 "Actions offered while available"). Hosts call them through the agent bridge or the core api.
- **UI SDK's dev warning that `agent.actions` lists `cancel` (or `accept`) while the api lacks it** is expected: those actions are getters that return `undefined` while unavailable (spec §6), and the warning is once per mount (AGENTS.md).
- **A Tool's error part follows its status, not `outcome` (Wave 2 Task 4):** a host `status="error"` shows its message too, and a host status over an errored call hides it. The JSDoc and AGENTS.md say so.
- **A Reasoning `label` is announced as is on completion,** like a Status label; failures and stops still say "Thinking failed" / "Thinking stopped". The JSDoc says to name the outcome in it.
- **A Step's `announcement` runs only once the step has a title** (`label` or the title part's text): every Step-based component has a title, and the JSDoc says so.
- **Markdown and Streaming Text have no accessible name:** they're content with no role, which ARIA doesn't let a name sit on, and they offer no actions (spec §6).
- Everything in AGENTS.md "UI SDK API notes".
- **Queue `reorder` and `remove`, Uploader `cancel` and Attachments `remove` don't render `data-agent-confirm` (Wave 3 D1):** UI SDK's bridge reads the mark per component, so it would also gate Queue `reorder` and Uploader `retry`, and each action is reversible or only changes the list. Inside a composer, `removeAttachment` follows the composer's `agentConfirm`. Their docs pages show the host's `allow` asking a person instead.
- **`affected-specs.mjs` runs every spec for a file it can't place,** and none for code no fixture page loads (the AI SDK adapter); nightly runs cover what a PR skips.
- **Conversation `virtualize` is mount-only,** like a `default*` option: it is read in `state` and not synced.
- **The composer's draft `text` is the Token Input's codec text** and edits sync through the controller's `editor.subscribe`; a cancelled change writes the draft back to the editor. A controlled owner refuses an edit by cancelling it (AGENTS.md, Task 11).
- **`validateCatalog` forwarding UI SDK guard errors has no unit test:** a failing render file would have to sit in `src/`, where the guard's own tests and `npm run lint` already fail it.
- **Status keeps `controlled: ["status"]`** so agents read its status. Clearing `status` resets it to pending while UI SDK's dev warning says it keeps its last value, as with Step's `status`.
- **A Status with a fixed `label` announces that label** on terminal transitions, as the Wave 2 plan says: a host that names its own label names the outcome in it.

## Known and open (don't report again, check whether fixed)

- **`treeFromPaths` drops a leading `/` below the top level** (Wave 4 Task 1): `/a/b.ts` becomes a `""` folder holding `a/b.ts`. `pathItems` documents relative paths; report upstream.
- **`ansi-sequence-parser` applies a sequence's resets before its sets** (Wave 4 Task 1), so `ESC[33;0m` stays yellow where a terminal resets; splitting SGR into one parameter per sequence would fix it.
- **SGR 8 (concealed) shows as normal text** (Wave 4 Task 1): D2's list leaves it out; a Terminal showing secrets would need it.
- **`createAnsiLines` scans the whole output with `startsWith` and copies the line array per update, and an unterminated OSC holds every later chunk back and rescans it** (Wave 4 Task 1): Task 7's render budgets should measure it.
- **`pathItems` gives a folder and a file the same value for `src` and `src/a.ts`** (Wave 4 Task 1): a host error File Tree should refuse or merge.
- **A blocking Guardrail Notice added after load may be read twice** (Wave 3 Task 10): it's `role="alert"` and announces its title assertively, both as the plan asks. Not checked with a screen reader.
- **Notice's `nearestTabStop` misses shadow roots and scrollable regions** (Wave 3 Task 10): it reads `tabIndex` over the light DOM, since UI SDK's `nextTabbable` isn't exported; ask upstream to export it.
- **A notice that mounts in a background tab before its first paint isn't announced** (Wave 3 Task 10): first contentful paint waits for the tab to show.
- **Enter on Context Meter details that keyboard focus opened closes them** (Wave 3 Task 8): UI SDK's press opening keeps a popup open on a press only when the pointer opened it, and that rule isn't exported; ask upstream for a focus-opened popup to stay open too. Pinned in `context-meter.spec.ts`.
- **A Context Meter `currency` that isn't an ISO 4217 code throws** from `Intl.NumberFormat` when the details render (the JSDoc asks for one); a bad `locale` is ignored through `toLocale`.
- **A Checkpoint owner who refuses a close sees it close and reopen** (Escape, then `onOpenChange` cancels): UI SDK reports the close only after it happens, through `controller.open()`'s promise, since web hears neither `openchange` nor a Close part's `action`.
- **No test proves Question's `ownQuestion` `selects`** (UI SDK asks each primitive with `selects` to prove it); traced by hand, and Chain of Thought, Task and Plan have none either.
- **A failed Skip announces "Answers not sent"** (Question), which reads oddly after a skip; wording only.
- **Confirmation: a microtask between `pending` clearing and `sent` setting** could let an `act` scheduled in a promise callback slip a second decision through. Not reproduced; a press can't land there.
- **A double press on a Queue item's remove control calls `onRemove` twice** when the host removes the item asynchronously; there's no per-item lock like the uploader's.
- **Queue's `known` set never forgets ids,** so an item removed and re-added under the same id after its exit gets no entrance (same as Task and Plan).
- **A plan swapped while Accept is pending keeps the lock** until the old promise settles (Wave 2 Task 6). Clearing it on a new `onAccept` can't key on identity, since React passes a new inline function each render; same open spec §4.1 question as the composer's pending lock.
- **Task and Plan's `known` set never forgets ids,** so an item removed and re-added under the same id gets no entrance (same as the uploader's `mounted`).
- **Tool re-serializes its input on every options update** (`toolCode` per streamed chunk). Unmeasured on large inputs; memoize by value if it shows up.
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

- **Wave 3 agent conformance (Task 11):** Guardrail Notice spread the notice base's api, which read its `dismiss` getter once, so `dismiss` stayed offered after `onDismiss` went away (web `can-dismiss` removed) or while the notice was leaving; it now delegates the getter (`wave-3/agent.spec.ts`). Chain of Thought's `setStepOpen` reads steps by own key (`Object.hasOwn`), as Suggestion and Question do.
- **Notice (Wave 3 Task 10):** Dismiss's fallback skips a link without `href` (Chrome reports `tabIndex` 0 for it); `onDismiss` isn't called once the host removed the notice during its exit; Guardrail Notice's options document its own `variant` (`"warning"`) and title defaults; a notice in server markup an app hydrates after `load`, or one a web host puts back, neither rises in nor is announced (roots on the page before core ran, or already shown, are remembered).
- **Feedback (Wave 3 Task 9):** the comment text slot now binds `bindText`, so a web element put back in the page sends the text its box kept; the box can't start open without **Add a comment**, and closes only when that button leaves, not on every update; `submitComment` with blank text, or while a send is pending, leaves the box's text alone; an invalid `rating` reads as none; focus recovery picks the pressed thumb, else the first.
- **Context Meter (Wave 3 Task 8):** numbers format in `locale`, else the page's language read in `bind`, else English, so server markup and the Meter beside it agree; the level follows the rounded percentage shown; a non-finite `used` or `total` reads as 0; a small cost keeps two significant digits (`roundingPriority`, with `ES2023.Intl` in the base `lib`); controlled and cancelled opens and the rows memo are unit-tested.
- **Suggestion (Wave 3 Task 7):** `pick` and the chips read suggestions by own key, so `pick("constructor")` is refused (`suggestion.test.mjs`); an id that leaves `suggestions` is forgotten, so it plays its entrance when added again; a removed chip's focus moves to its neighbor (`createFocusRecovery`); the chips are `type="button"`; the render-state types have JSDoc.
- **Model Selector and Reasoning Effort (Wave 3 Task 6):** `agent.items` carry `disabled`, so the bridge refuses a disabled model instead of reporting a silent `false`; the open button's name is an `openLabel` option rather than an English plural of `label`; the Combobox and Segmented Control state types have JSDoc; the radio group is named by `label`.
- **Checkpoint (Wave 3 Task 5):** `open` stuck `true` and the web page left `inert` when `restored` was set with the dialog open (the dialog now closes when Restore leaves, and an `"unmount"` close reports `open: false`); a refused press-open left the dialog showing (`follow` changes `open` first and closes it again); a failed restore then a new press closed and reopened the dialog; a detached controller threw on `defaultOpen` without `onRestore` (the dialog opens only while the `restore` part is bound); an agent's `press` on the dialog's Restore wasn't always gated (the confirm part always renders `data-agent-confirm`); web ignored `agentConfirm = false` (`defaults`).
- **Question ids like `constructor` crashed, new questions kept the last round's answers, `setValue` ignored the lock, and an answer no option matches read as blank (Wave 3 Task 4).** Fixed: answers and questions are read by own key (`answerOf`, `questionOf`), new question ids drop the answers and controllers of the questions that left (uncontrolled), `setValue` returns `false` while locked or answered, and `answerText` returns `undefined` (unit tests in `question.test.mjs`).
- **"Decision not sent" wasn't announced (Wave 3 Task 3).** Fixed: Confirmation announces it on entering `submit-failed`, and the recorded outcome on `responded` or `auto`; Tool embeds it and announces nothing more (tested in `confirmation.spec.ts` and `tool.spec.ts`, both layers).
- **Removing the last chip from a composer left focus on `<body>` (Wave 3 Task 2).** Fixed: Attachments takes a `focusFallback` option for when no chip is left to take focus, and the composer passes its editor (tested in `composer.spec.ts`, both layers).
- **Wave 2 agent conformance (Task 10):** the generic `initials` export is now `avatarInitials`; a Queue item's remove badge removes it on click (the item's reorder used to capture the pointer and take the click; tested).

- **Exits (Wave 2 Task 9):** a leaving row with no element to play its exit (Attachments children rendered from `items`, a headless instance) is dropped at once, so it never leaks its object URL, entrance memory or the uploader list's `data-empty`; `AttachmentsRootState` and `UploaderListState` have JSDoc; the uploader's slide watches its list, not the whole root.
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
