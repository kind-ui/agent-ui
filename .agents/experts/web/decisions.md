# Web Components expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `HEAD_SHA` (Wave 2 Task 6 Task and Plan)

## Settled

- **`kind-task` and `kind-plan` look up their parts with `querySelector`,** not Chain of Thought's `own()`: no part of theirs holds arbitrary content, so no nested task or plan sits inside one.
- **`notified` in `budgets.spec.ts` counts shown parts only** (hidden parts sync without `getAttribute`), at most the jump and empty parts, constant across list sizes. The `remount` fixture keeps the last unmounted tree until the next mount; leaks are measured while mounted.
- **Theme defaults land on `:root, :host`** (Tailwind's `@theme` output), so inside a shadow root that loads the stylesheet a page's `:root` override doesn't reach; the README tells consumers to set `:host` there too. It also makes the stylesheet work when loaded only in a shadow root.
- **`can-<action>` attributes stand for a callback's presence;** the root's `options` hook sets the callback to `undefined` while one is off. A listener can't be seen, and `@ui-sdk/web`'s proxy fills in a dispatcher for any callback key that's missing.
- Everything in AGENTS.md "UI SDK API notes".
- **WebKit presses Uploader's Cancel and Retry with Enter in `uploader.spec.ts`:** WebKit doesn't focus a button on click, so focus recovery can only be checked from the keyboard there; Chromium and Firefox cover the click.
- **Internal host classes stay per file.** A shared `defineHost` helper in `src/web/internal/` would be a render file that neither calls `createParts` nor wraps a component, which the guard rejects.
- **A status change while a `kind-status` is out of the document isn't announced when it returns:** nobody could see the change.

## Known and open (don't report again, check whether fixed)

- **An empty `<kind-task>` or `<kind-plan>` inserts its parts on upgrade** (same class as `kind-chain-of-thought` and `kind-reasoning`), which can shift layout before the element is defined.
- **Web Task and Plan play color transitions on first render** (progress fill, Accept, item titles) as `data-*` attributes land after the first style pass; Chain of Thought's marks do the same. Trace which upgrade step causes it.
- **`kind-tool` draws twice for one `call` change** (the store subscription and one more notification). Harmless, since every write is guarded.
- **`<kind-reasoning text="…">` shows nothing before upgrade,** then inserts its trigger and content, which shifts layout; same class as `kind-streaming-text` below. Writing the parts as children avoids it; undocumented.
- **Indicators and `kind-uploader` fill in their parts when they connect with no children,** so a definition loaded before hand-written markup is parsed could double them (unconfirmed; `ui-calendar` does the same).
- **`<kind-streaming-text text="…">` and an empty `kind-uploader` show nothing before upgrade.** Writing the text as children avoids it; undocumented.
- **`kind-step-list-item` misses a button that arrives late or is replaced:** its target is `querySelector("button")`, and UI SDK's retarget observer only watches direct children. Deferred: one element can fill only one primitive's slot, so whichever of list item and trigger wraps the other has a nested target; `@ui-sdk/web`'s own `ui-toolbar-button` (nested `wrappedControl`) has the same gap. Needs an upstream subtree retarget.
- **Removing a `kind-step` and putting it back forgets a person's toggle:** `createParts` rebuilds the instance from the `state` getters only, so `userToggled` is lost and auto close resumes. Needs a `@ui-sdk/web` hook to carry non-public state across instances.
- **The step panel finds its trigger with `ownerDocument.querySelector`**, which misses a trigger inside a user's shadow root.
- **A `kind-code-block` written with children (pre-upgrade `<pre>`) never fills in its parts.** Documented ("when it has no children"); a hand-written fallback needs a marker the element can replace.
- **A code block removed and put back after a tick asks for highlighting again** and shows plain text meanwhile: same rebuilt-from-state cause as the Step entry above.
- **Trigger Menu items show no description on web:** the list renders its own items from data, label only. React renders the description.
- **Inside a shadow root, Enter with the Trigger Menu open submits the form** instead of choosing the item (UI SDK; report upstream).
- **An unknown `motion` attribute matches no `data-motion` rule,** so reduced motion stops applying. Every animated component shares it; validate `motion` once for all of them.
- **An empty `<kind-chain-of-thought>` inserts its parts on upgrade** (same class as `kind-reasoning`), which can shift layout before the element is defined.

## Resolved

- **Task and Plan (Wave 2 Task 6):** the lists keep items someone wrote (and their text), and a written item replaces the one the element added, as Chain of Thought's do; parts and items written or removed after connecting redraw; a `kind-plan-progress` with text keeps it.
- **Chain of Thought (Wave 2 Task 5):** `openSteps` is root state (`getOpenSteps` / `setOpenSteps`), so a moved element keeps its open steps; an item a host writes after its step replaces the one the element added; parts are looked up only in the element's own chain, so a chain nested in a step's content keeps its own; removing a written item redraws; the fixture listens for `openstepschange`.
- **A hand-written `kind-tool` with empty input and output parts showed nothing (Wave 2 Task 4).** Fixed: the root fills an empty `kind-tool-input` or `kind-tool-output` with its heading, copy button and code block.
- **Leaving out a code block's header needed internal markup in a JS string (Wave 2 Task 4).** Fixed: `<kind-code-block headerless>`, read when it fills in its parts, like React's `header={false}`.
- **`kind-tool` rewrote `hidden` on its output blocks every update (Wave 2 Task 4).** Fixed: guarded like its other writes.
- **`kind-status` and `kind-reasoning` stopped updating their label or title after leaving the page and coming back a tick later (Wave 2 Task 3):** UI SDK rebuilds the instance, and each kept the parts it filled in per instance. Fixed: one module-level set; `status.spec.ts` and `reasoning.spec.ts` cover it.
- **`title` on `<kind-step>` was HTML's advisory attribute (Wave 2 D4).** Checked in Chromium: it stays on the element, so it's the tooltip over the whole step and the group's accessible description. Fixed: the option is `label` in both layers.
- **No `HTMLElementTagNameMap` entries, and no types for `can-*` or `removeHandler` (Wave 2 Task 1).** Fixed: each web file exports `Kind<Name>Element` (events with reasons read from core, live state, `api`, `can-*` properties, host-set properties) and declares every tag it defines, `kind-internal-*` included; the web fixtures listen without casts, so a wrong event name fails the typecheck.
- **WebKit `following a new message` read 16 layouts:** the opening scroll-to-end's late scroll event landed in the measured window; the test now waits two frames after opening (Task 18).
- **Docs captions (Task 17):** the Conversation and Composer pages now say `rowKey`, `controller` and `defaultValue` are properties only.
- **`kind-attachments` kept a public `onRemove` property, and the composer wrote `can-remove` into the user's markup.** Fixed: the composer hands its function in as `removeHandler`.
- **`on…` function properties (`onRegenerate`, `onEdit`, `onStop`, `onRemove`, `onCancel`, `onRetry`) couldn't be set from React 19,** which turns `on…` props on a custom element into listeners. Fixed: every callback is a DOM event, and a `can-<action>` attribute offers what a callback's presence did (AGENTS.md, "Web callbacks and availability"). React 19 rendering `kind-uploader` is tested.
- **`kind-uploader`'s `reject` shared its name with File Input's.** Fixed: `uploadreject`, beside `uploadcancel` and `uploadretry` (its native file input fires a bubbling `cancel`).
- **Reordering uploader `items` blurred a focused action button.** Fixed: rows move with `moveBefore` where the browser has it.
- **`kind-streaming-text` slowed with every chunk** (UI SDK resyncs each part). Fixed in core: settled chunks fold into one.
- **`kind-composer` content added after it connected got no `controller` or `triggers`.** Fixed: the root's render hook also redraws when elements arrive (a `MutationObserver`), and the input syncs once a Token Input attaches the controller (`connectInput`).
- **Updating an attachment in place left a stale chip.** Fixed: `kind-attachments` refills an item whenever its item object or preview changes.
- **`kind-step` and `kind-composer` exposed no `api` or live state.** Fixed: `state: { open }` / `state: { value }` and `api` lists, as `@ui-sdk/web` roots do (`StepApi.isOpen`, `ComposerApi.getValue`). A host write to `open` (property or `setOpen`) doesn't count as a toggle (spec §5: a person or agent); `expand`/`collapse` and the trigger do.
- **`kind-status` overwrote text written into its `<kind-status-label>`, and missed a label added later (Wave 2 Task 2).** Fixed: it writes only into a label that was empty, and redraws when parts arrive.

## Revisit

Nothing yet.
