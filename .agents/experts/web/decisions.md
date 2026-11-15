# Web Components expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `75c679c` (Task 11 Composer and Attachments)

## Settled

- Everything in AGENTS.md "UI SDK API notes".
- **Internal host classes stay per file.** A shared `defineHost` helper in `src/web/internal/` would be a render file that neither calls `createParts` nor wraps a component, which the guard rejects.

## Known and open (don't report again, check whether fixed)

- **`kind-step-list-item` misses a button that arrives late or is replaced:** its target is `querySelector("button")`, and UI SDK's retarget observer only watches direct children. Deferred: one element can fill only one primitive's slot, so whichever of list item and trigger wraps the other has a nested target; `@ui-sdk/web`'s own `ui-toolbar-button` (nested `wrappedControl`) has the same gap. Needs an upstream subtree retarget.
- **Removing a `kind-step` and putting it back forgets a person's toggle:** `createParts` rebuilds the instance from the `state` getters only, so `userToggled` is lost and auto close resumes. Needs a `@ui-sdk/web` hook to carry non-public state across instances.
- **No `HTMLElementTagNameMap` entries** for `kind-*` tags.
- **The step panel finds its trigger with `ownerDocument.querySelector`**, which misses a trigger inside a user's shadow root.
- **A `kind-code-block` written with children (pre-upgrade `<pre>`) never fills in its parts.** Documented ("when it has no children"); a hand-written fallback needs a marker the element can replace.
- **A code block removed and put back after a tick asks for highlighting again** and shows plain text meanwhile: same rebuilt-from-state cause as the Step entry above.
- **`onStop` and `onRemove` are web properties, which React 19 can't set:** it turns any `on…` function prop on a custom element into an event listener. Same for Task 10's `onRegenerate`/`onEdit`. Revisit the "Web callbacks" decision with a non-`on` property name or an attribute.
- **Trigger Menu items show no description on web:** the list renders its own items from data, label only. React renders the description.
- **Inside a shadow root, Enter with the Trigger Menu open submits the form** instead of choosing the item (UI SDK; report upstream).

## Resolved

- **`kind-composer` content added after it connected got no `controller` or `triggers`.** Fixed: the root's render hook also redraws when elements arrive (a `MutationObserver`), and the input syncs once a Token Input attaches the controller (`connectInput`).
- **Updating an attachment in place left a stale chip.** Fixed: `kind-attachments` refills an item whenever its item object or preview changes.
- **`kind-step` and `kind-composer` exposed no `api` or live state.** Fixed: `state: { open }` / `state: { value }` and `api` lists, as `@ui-sdk/web` roots do (`StepApi.isOpen`, `ComposerApi.getValue`). A host write to `open` (property or `setOpen`) doesn't count as a toggle (spec §5: a person or agent); `expand`/`collapse` and the trigger do.

## Revisit

Nothing yet.
