# Web Components expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `8ada14f8c3a01e81b4eceb89bc36c8a3300c7b6d` (Wave 1 Tasks 1–8, PRs #2–#10)

## Settled

- Everything in AGENTS.md "UI SDK API notes".
- **Internal host classes stay per file.** A shared `defineHost` helper in `src/web/internal/` would be a render file that neither calls `createParts` nor wraps a component, which the guard rejects.

## Known and open (don't report again, check whether fixed)

- **`kind-step-list-item` misses a button that arrives late or is replaced:** its target is `querySelector("button")`, and UI SDK's retarget observer only watches direct children. Wrap the button directly, or report the gap upstream.
- **`kind-step` and `kind-composer` expose no `api` or live state** (`step.open` doesn't round-trip). Follow `@ui-sdk/web` Collapsible: `state: { open }` and `api: [...]`, which needs `isOpen` on `StepApi`.
- **No `HTMLElementTagNameMap` entries** for `kind-*` tags.
- **The step panel finds its trigger with `ownerDocument.querySelector`**, which misses a trigger inside a user's shadow root.

## Revisit

Nothing yet.
