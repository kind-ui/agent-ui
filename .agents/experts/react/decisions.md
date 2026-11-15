# React expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `f121ef05955c7871ed404b9460d8529b7a299146` (Wave 1 review fixes)

## Settled

- Everything in AGENTS.md "UI SDK API notes".

## Known and open (don't report again, check whether fixed)

- **A Step without `StepTitle` has a dangling `aria-labelledby`** on its group.
- **Server markup writes `hidden=""` on closed content**, not `until-found`, until it binds (UI SDK `toReactProps`; report upstream).
- **Button, menu and focus-ring class strings are repeated** across `src/react/internal/*.tsx`; fold into shared constants with the Task 14 tokens.

## Resolved

- **Two Kind wrappers composed through `render` stacked both base class lists.** Fixed: `withKindClass` renders a Kind `render` target as its bare UI SDK part, so the outer base applies once, for element and function `render` targets and nested targets alike.

## Revisit

Nothing yet.
