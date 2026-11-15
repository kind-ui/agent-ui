# Web Components expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `4717d35` (Task 13 agent conformance)

## Settled

- **`can-<action>` attributes stand for a callback's presence;** the root's `options` hook sets the callback to `undefined` while one is off. A listener can't be seen, and `@ui-sdk/web`'s proxy fills in a dispatcher for any callback key that's missing.
- Everything in AGENTS.md "UI SDK API notes".
- **Internal host classes stay per file.** A shared `defineHost` helper in `src/web/internal/` would be a render file that neither calls `createParts` nor wraps a component, which the guard rejects.

## Known and open (don't report again, check whether fixed)

- **Indicators and `kind-uploader` fill in their parts when they connect with no children,** so a definition loaded before hand-written markup is parsed could double them (unconfirmed; `ui-calendar` does the same).
- **`<kind-streaming-text text="…">` and an empty `kind-uploader` show nothing before upgrade.** Writing the text as children avoids it; undocumented.
- **`kind-step-list-item` misses a button that arrives late or is replaced:** its target is `querySelector("button")`, and UI SDK's retarget observer only watches direct children. Deferred: one element can fill only one primitive's slot, so whichever of list item and trigger wraps the other has a nested target; `@ui-sdk/web`'s own `ui-toolbar-button` (nested `wrappedControl`) has the same gap. Needs an upstream subtree retarget.
- **Removing a `kind-step` and putting it back forgets a person's toggle:** `createParts` rebuilds the instance from the `state` getters only, so `userToggled` is lost and auto close resumes. Needs a `@ui-sdk/web` hook to carry non-public state across instances.
- **No `HTMLElementTagNameMap` entries** for `kind-*` tags.
- **The step panel finds its trigger with `ownerDocument.querySelector`**, which misses a trigger inside a user's shadow root.
- **A `kind-code-block` written with children (pre-upgrade `<pre>`) never fills in its parts.** Documented ("when it has no children"); a hand-written fallback needs a marker the element can replace.
- **A code block removed and put back after a tick asks for highlighting again** and shows plain text meanwhile: same rebuilt-from-state cause as the Step entry above.
- **Trigger Menu items show no description on web:** the list renders its own items from data, label only. React renders the description.
- **Inside a shadow root, Enter with the Trigger Menu open submits the form** instead of choosing the item (UI SDK; report upstream).
- **The `can-*` attributes and `removeHandler` have no types either;** part of the `HTMLElementTagNameMap` entry above.

## Resolved

- **`kind-attachments` kept a public `onRemove` property, and the composer wrote `can-remove` into the user's markup.** Fixed: the composer hands its function in as `removeHandler`.
- **`on…` function properties (`onRegenerate`, `onEdit`, `onStop`, `onRemove`, `onCancel`, `onRetry`) couldn't be set from React 19,** which turns `on…` props on a custom element into listeners. Fixed: every callback is a DOM event, and a `can-<action>` attribute offers what a callback's presence did (AGENTS.md, "Web callbacks and availability"). React 19 rendering `kind-uploader` is tested.
- **`kind-uploader`'s `reject` shared its name with File Input's.** Fixed: `uploadreject`, beside `uploadcancel` and `uploadretry` (its native file input fires a bubbling `cancel`).
- **Reordering uploader `items` blurred a focused action button.** Fixed: rows move with `moveBefore` where the browser has it.
- **`kind-streaming-text` slowed with every chunk** (UI SDK resyncs each part). Fixed in core: settled chunks fold into one.
- **`kind-composer` content added after it connected got no `controller` or `triggers`.** Fixed: the root's render hook also redraws when elements arrive (a `MutationObserver`), and the input syncs once a Token Input attaches the controller (`connectInput`).
- **Updating an attachment in place left a stale chip.** Fixed: `kind-attachments` refills an item whenever its item object or preview changes.
- **`kind-step` and `kind-composer` exposed no `api` or live state.** Fixed: `state: { open }` / `state: { value }` and `api` lists, as `@ui-sdk/web` roots do (`StepApi.isOpen`, `ComposerApi.getValue`). A host write to `open` (property or `setOpen`) doesn't count as a toggle (spec §5: a person or agent); `expand`/`collapse` and the trigger do.

## Revisit

Nothing yet.
