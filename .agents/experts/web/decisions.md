# Web Components expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `91b7a9c3e0bbcd2a88f90b8a444fe43616c7a820` (Task 9 Conversation)

## Settled

- Everything in AGENTS.md "UI SDK API notes".
- **Internal host classes stay per file.** A shared `defineHost` helper in `src/web/internal/` would be a render file that neither calls `createParts` nor wraps a component, which the guard rejects.

## Known and open (don't report again, check whether fixed)

- **`kind-step-list-item` misses a button that arrives late or is replaced:** its target is `querySelector("button")`, and UI SDK's retarget observer only watches direct children. Deferred: one element can fill only one primitive's slot, so whichever of list item and trigger wraps the other has a nested target; `@ui-sdk/web`'s own `ui-toolbar-button` (nested `wrappedControl`) has the same gap. Needs an upstream subtree retarget.
- **Removing a `kind-step` and putting it back forgets a person's toggle:** `createParts` rebuilds the instance from the `state` getters only, so `userToggled` is lost and auto close resumes. Needs a `@ui-sdk/web` hook to carry non-public state across instances.
- **No `HTMLElementTagNameMap` entries** for `kind-*` tags.
- **The step panel finds its trigger with `ownerDocument.querySelector`**, which misses a trigger inside a user's shadow root.

## Resolved

- **`kind-step` and `kind-composer` exposed no `api` or live state.** Fixed: `state: { open }` / `state: { value }` and `api` lists, as `@ui-sdk/web` roots do (`StepApi.isOpen`, `ComposerApi.getValue`). A host write to `open` (property or `setOpen`) doesn't count as a toggle (spec §5: a person or agent); `expand`/`collapse` and the trigger do.

## Revisit

Nothing yet.
