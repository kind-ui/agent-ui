# React expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `d60061c` (Wave 2 Task 4 Tool)

## Settled

- **A streamed Reasoning chunk renders its step parts once each** (`text` lives in step state): a fixed cost per chunk that doesn't grow with the text, so `budgets.spec.ts` has no Reasoning case. The default parts are one shared element tree.
- **Count budgets render counting** (`budgets.spec.ts`) follows DevTools: a render that bails out on equal state isn't counted, and a compare-`memo` wrapper (tag 14) is left out so its component counts once.
- Everything in AGENTS.md "UI SDK API notes".
- **StrictMode runs on Chromium only:** its double render doesn't depend on the engine, so the cross-browser projects are `wave-1-react` and `wave-1-web`.
- **A `Status` root's `className` or `render` function gets `{}`:** the root has no part state; style it through `data-status`.

## Known and open (don't report again, check whether fixed)

- **Every tool's copy buttons and code blocks share labels** ("Copy input", "Input"), so agent refs by label are ambiguous across tools; the group around them is named by the tool. Same class as Markdown's "Code" / "Table".
- **React hosts must memo Conversation rows** for a streamed token to render one row; the fixture does. The Conversation docs page (Wave 1 docs) should say so.
- **Streaming Text renders twice per `text` change,** like Markdown: `text` reaches state through `onOptions`, a layout effect. Before paint.
- **Uploader progress bars have no accessible name in server markup** until hydration adds `aria-labelledby` (UI SDK Progress; report upstream).
- **A Step without `StepTitle` has a dangling `aria-labelledby`** on its group.
- **Server markup writes `hidden=""` on closed content**, not `until-found`, until it binds (UI SDK `toReactProps`; report upstream).
- **Server-rendered Conversation markup starts at the top** and jumps to the end when `createStickToBottom` connects at hydration.
- **`ConversationJump` children are replaced silently** by the text its `bind` writes; only the JSDoc says to render it empty.
- **Button, menu and focus-ring class strings are repeated** across `src/react/internal/*.tsx`; fold into shared constants with the Task 14 tokens.
- **Every code block and table in one Markdown view is named "Code" / "Table",** so an agent `ref` by label is ambiguous with two of them.
- **Each streamed chunk renders the Markdown root twice:** blocks arrive through `onOptions` (a layout effect), after the render-time preview. Before paint and absorbed by the block memo.
- **Index keys carry a code block's `wrap` / `copied` state across a replaced `source`** (branch switch, regenerate), in both layers. Follows from keying blocks by place.
- **Token chips render without `renderToken` on the server** and take their chip markup when the Token Input binds (UI SDK; report upstream).
- **A consumer cancels a key with `onKeyDownCapture`, not `onKeyDown`:** the Token Input handles keys on its element before React's bubbling handlers (UI SDK; report upstream). Documented on `ComposerInput`.
- **An attachment chip plays its entrance twice under StrictMode** (its bind runs twice); it ends in place, so only a click during it is affected.

## Resolved

- **Code Block re-rendered its scroll area on every streamed chunk (Wave 2 Task 4).** Fixed: the scroll content is one shared element tree; a streamed tool input renders 25 components, not 31.
- **The Tool fixture's `set` (host `status`, `label`) and output copy had no spec (Wave 2 Task 4).** Fixed: `tool.spec.ts` covers them.
- **Docs (Task 17):** the Markdown Table page's `Pick` alias collided with `MarkdownTableProps` and listed every DOM prop; it's `MarkdownTableChildren` now.
- **The agent fixture's submissions never settled,** so each agent `submit` and `stop` waited UI SDK's 15 s for pending work. Fixed: the host settles them, holding only for Stop.
- **No browser spec ran a fixture under StrictMode.** Fixed: the `wave-1-react-strict` project runs every spec with each case in `<StrictMode>`. It caught a highlight spec counting requests by index (StrictMode's discarded instance asks too).
- **The uploader fixture wrote `window.kindUploader` during render,** so StrictMode's discarded copy received the calls. Fixed: published in an effect.
- **A server-rendered image attachment pointed at a `blob:nodedata:` URL.** Fixed: object URLs are made when an item binds, so the server and hydration render the icon.
- **The first attachment skipped its entrance in React.** Fixed: the composer's attachments part stays mounted while empty (`data-empty`).
- **Two Kind wrappers composed through `render` stacked both base class lists.** Fixed: `withKindClass` renders a Kind `render` target as its bare UI SDK part, so the outer base applies once, for element and function `render` targets and nested targets alike.
- **`<Status>{false}</Status>` and `<Status>{null}</Status>` differed (Wave 2 Task 2).** Fixed: any `children` replace the default parts.

## Revisit

Nothing yet.
