# React expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `91b7a9c3e0bbcd2a88f90b8a444fe43616c7a820` (Task 9 Conversation)

## Settled

- Everything in AGENTS.md "UI SDK API notes".

## Known and open (don't report again, check whether fixed)

- **A Step without `StepTitle` has a dangling `aria-labelledby`** on its group.
- **Server markup writes `hidden=""` on closed content**, not `until-found`, until it binds (UI SDK `toReactProps`; report upstream).
- **Server-rendered Conversation markup starts at the top** and jumps to the end when `createStickToBottom` connects at hydration.
- **`ConversationJump` children are replaced silently** by the text its `bind` writes; only the JSDoc says to render it empty.
- **Button, menu and focus-ring class strings are repeated** across `src/react/internal/*.tsx`; fold into shared constants with the Task 14 tokens.

## Resolved

- **Two Kind wrappers composed through `render` stacked both base class lists.** Fixed: `withKindClass` renders a Kind `render` target as its bare UI SDK part, so the outer base applies once, for element and function `render` targets and nested targets alike.

## Revisit

Nothing yet.
