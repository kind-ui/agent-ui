# React expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `13d7a856f18a3d7da27479114b204f28ee47cbdf` (Task 10 Message, Markdown, Code Block, Markdown Table)

## Settled

- Everything in AGENTS.md "UI SDK API notes".

## Known and open (don't report again, check whether fixed)

- **A Step without `StepTitle` has a dangling `aria-labelledby`** on its group.
- **Server markup writes `hidden=""` on closed content**, not `until-found`, until it binds (UI SDK `toReactProps`; report upstream).
- **Server-rendered Conversation markup starts at the top** and jumps to the end when `createStickToBottom` connects at hydration.
- **`ConversationJump` children are replaced silently** by the text its `bind` writes; only the JSDoc says to render it empty.
- **Button, menu and focus-ring class strings are repeated** across `src/react/internal/*.tsx`; fold into shared constants with the Task 14 tokens.
- **Every code block and table in one Markdown view is named "Code" / "Table",** so an agent `ref` by label is ambiguous with two of them.
- **Each streamed chunk renders the Markdown root twice:** blocks arrive through `onOptions` (a layout effect), after the render-time preview. Before paint and absorbed by the block memo.
- **Index keys carry a code block's `wrap` / `copied` state across a replaced `source`** (branch switch, regenerate), in both layers. Follows from keying blocks by place.

## Resolved

- **Two Kind wrappers composed through `render` stacked both base class lists.** Fixed: `withKindClass` renders a Kind `render` target as its bare UI SDK part, so the outer base applies once, for element and function `render` targets and nested targets alike.

## Revisit

Nothing yet.
