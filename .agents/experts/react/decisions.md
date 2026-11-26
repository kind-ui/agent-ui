# React expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: 8aee26be

## Settled

- Wave 7: `withCode` (React, Vue) and `WithCode` (Svelte, Solid, private) are each layer's own helpers, like other lowercase exports; parity compares PascalCase parts only.
- **React is the structural reference for the Vue, Svelte and Solid layers (framework layers plan, 2026-11-20):** they export the same part names and render the same default children and classes, which `scripts/tests/parity.test.mjs` and `tests/browser/parity.spec.ts` compare against React. Renaming or restructuring a React part is a change to all five layers.
- **Effort Slider was scrapped by the user (Wave 5 Task 8, 2026-11-17):** effort is a radio submenu in Model Control, a Settings Menu (`settingsBase`). Don't propose a slider or nested popover for effort.
- **Fixture `main` files carry no comment for the case `<script type="module">`** (Wave 4 Task 12): fixtures hold no comments; the reason is in AGENTS.md "Fixture servers".
- **A streamed Reasoning chunk renders its step parts once each** (`text` lives in step state): a fixed cost per chunk that doesn't grow with the text, so `budgets.spec.ts` has no Reasoning case. The default parts are one shared element tree.
- **Count budgets render counting** (`budgets.spec.ts`) follows DevTools: a render that bails out on equal state isn't counted, and a compare-`memo` wrapper (tag 14) is left out so its component counts once.
- Everything in AGENTS.md "UI SDK API notes".
- **StrictMode runs on Chromium only:** its double render doesn't depend on the engine, so the cross-browser projects are `wave-1-react` and `wave-1-web`.
- **A `Status` root's `className` or `render` function gets `{}`:** the root has no part state; style it through `data-status`.

## Known and open (don't report again, check whether fixed)

- **No fixture covers a controlled Composer taking dictated text (Task 17):** a throwaway case passed in both React projects; the docs examples are uncontrolled now.
- **Context Bar server markup shows every chip until the bar measures** (Wave 5 Task 10): widths exist only in the browser, so hydration swaps the chip clipped at the edge for "+N" (nothing below moves; the root has a fixed height), and the server markup exposes every chip to assistive technology until then.
- **Adding or removing `regenerateOptions` while mounted remounts Message's Regenerate button and drops its focus** (Wave 5 Task 7): the button sits inside `KindMenu` only while there are options. Keeping the menu mounted would make a plain button a menu trigger.
- **A Settings Menu choice row's typeahead text includes every option label (Wave 5 Task 5):** `MenuSubTrigger` takes no `label`, so it matches its text; typing from the row's label still finds it.
- **Add Menu sheet: re-entering a submenu right after going back sometimes closes the sheet (Wave 5 Task 4):** reason `swipe` from UI SDK's sheet swipe-to-dismiss, React only, about 1 in 200; the spec no longer re-enters. Report upstream.
- **UI SDK `CommandGroup` renders without `aria-labelledby` on the server (Wave 5 Task 1):** since `0.1.0-beta.17` a server-rendered group is shown, but it isn't named by its label until hydration. UI SDK's; matters once Command renders outside a closed popup. Picker (Wave 5 Task 2) renders Command only while its list is open, so needs no workaround.
- **A streamed Test Results update renders every row's UI SDK Tree parts and item parts** (Wave 4 Task 9): the known options-change cost (as Chain of Thought, Task and Sources). Our `TestResultsRow` components skip suites the host kept, since core caches tree items per suite.
- **File Tree: the root `group` and the Tree are both named "Files"** (Wave 4 Task 6), so a screen reader may say it twice; and a function `className` on the root gets the Tree's props. Not checked with a screen reader.
- **A server-rendered ready Generated Image shows "Loading image" over its flat placeholder until it hydrates** (Wave 4 Task 5): the phase comes from the `<img>`'s `load`, which only the client hears; the frame keeps its size. Each progress tick renders every part (UI SDK options change), as Chain of Thought's steps do.
- **Sources re-renders every item's parts on any `sources` change** (Wave 4 Task 2), once per update, not per token: the same UI SDK options-change behavior as Chain of Thought, Task and Plan items despite `selects`.
- **A Context Meter root `className` or `render` function gets `{}`,** as Status's root does (Wave 3 Task 8): style by `data-level`. The docs should say this covers every root.
- **Question's checkbox groups have no name of their own:** the item's group, named by its prompt, names them, as UI SDK Field's "Groups in a Field Set" says. A radio group points `aria-labelledby` at the prompt (Wave 5 Task 15), since `checkPattern` requires its name. Not checked with a screen reader.
- **A custom `QuestionItem` without `QuestionPrompt` has a dangling `aria-labelledby`,** as Step's group does without `StepTitle`.
- **Two calls of the same tool share their copy-button and code-block names** ("search_docs input"): names come from the title, and a `toolCallId` isn't a name a person can read. A host can tell them apart with `label`.
- **A keyboard move in a React Queue blurs and refocuses the picked-up row on each step:** React moves the keyed `li` with `insertBefore`, and UI SDK's reorder focuses it again (web uses `moveBefore`). It follows UI SDK's documented React pattern, so it belongs upstream.
- **A `Subagent` placed directly in a `StepList` adds its own Tab stop;** joining it needs `SubagentRoot` with `StepListItem render={<SubagentTrigger />}`. Undocumented, and `SubagentRoot` arrangements have no browser spec.
- **Task and Plan: a host `items` update renders every item's parts (Wave 2 Task 6),** 514 renders for one status change among 100 plan items, as Chain of Thought's steps do. Same upstream report to UI SDK; per item update, not per token.
- **React hosts must memo Conversation rows** for a streamed token to render one row; the fixture does. The Conversation docs page (Wave 1 docs) should say so.
- **Streaming Text renders twice per `text` change,** like Markdown: `text` reaches state through `onOptions`, a layout effect. Before paint.
- **File sizes in Attachments and Uploader format in the runtime's default locale** (UI SDK `formatFileSize` with no locale), so a server render in one locale hydrates with React error #418 in a browser set to another (the docs' Attachments and Uploader pages in a `de-DE` browser). Needs a locale the server and the browser share, like a `locale` option.
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
- **Chain of Thought: a host `steps` update renders every step's parts (Wave 2 Task 5),** 609 renders for one status change among 100 steps; `memo` on the items doesn't help, as the parts re-render from UI SDK's options change. A press reaches one step. Report to UI SDK; no budget, since it's per step, not per token.
- **UI SDK Menu rendered open on the server leaves its radio group unnamed (Wave 5 Task 6):** `role="group"` has no `aria-labelledby` though its label is in the markup, like the known `CommandGroup` one; the client names it. UI SDK's; report upstream.
- **Model Control's trigger repeats `KindMenuItemContent`'s string-or-element icon code** (Wave 5 Task 9); one internal icon helper would serve both.
- Sidebar: no fixture or spec for a controlled `open` that refuses or follows changes; core's write-back was checked by hand in review.
- **A custom `ConversationSearchInput` without `ConversationSearchCount` leaves the field's `aria-describedby` naming a missing id** (Wave 6 Task 11), as the `StepTitle` and `QuestionPrompt` items do.
- **A server render of a `defaultOpen` Thread Search names its dialog by a title id not in the markup** (Wave 6 Task 3): the client names it by `aria-label`; UI SDK's, like the `CommandGroup` one.
- **A narrow React Sidebar lists its Resizable in the agent snapshot** (Wave 6 Task 12). The Resizable stays mounted under `overlayBelow`, so the inset's page never mounts again, but the handle, whose `data-agent-hidden` keeps the Resizable out of the snapshot on wide screens, isn't rendered then, and every other Resizable part holds a Sidebar part. Web takes the Resizable out instead. Fixing it means keeping a hidden handle in the group while narrow, or a UI SDK way to hide a component that holds another's parts.

## Resolved

- **Dictation spec read `--kind-dictation-level-23` after the default went to 16 bars (Wave 5 Task 11):** it reads the last bar's index now.
- **Context Bar (Wave 5 Task 10):** `ContextBarChip` and `ContextBarItem` take `children` (a function of the chip, by default its icon, label and remove control), and `ContextBarRemove` / `ContextBarItemRemove` are exported, so a custom chip keeps its remove control as on web.
- **`MessageRegenerate` cloned its child and had no way to replace the rows (Wave 5 Task 7):** the child is now `MenuTrigger`'s `render` (its own `render` kept), `menuContent` replaces `MessageRegenerateContent`, and `Message` types `regenerateOptions` icons as `string | ReactElement`; `custom-rows` case in `message.spec.ts`.
- **`<AddMenuContent>{null}</AddMenuContent>` still drew the rows (Wave 5 Task 4):** children now default to a function of the content's state, as `sources.tsx` does. Fixtures dropped the unused sheet case and added `inert`.
- **Model Selector's Combobox field (`ComboboxValueIcon` without server markup, an old name kept after a rename)** (Wave 5 Task 3): Model Selector moved onto Picker; its trigger draws the chosen model's icon and name from data.
- **Model Selector's field icon went stale and was missing from server markup** (Wave 4 Task 12b): `ComboboxValueIcon` was replaced by the primitive's `icon` part, drawn from the chosen model, and `keepMounted` is gone.
- **`ModelSelectorItem`'s `model.icon` was `unknown`** (Wave 4 Task 12b): `ModelSelectorListItem` types it `string | ReactElement`, as `ModelSelectorModel` does.
- **The `logos` fixture camelCased `aria-hidden`** (Wave 4 Task 12b): `logo()` keeps `aria-*` and `data-*` names.
- **Wave 4 agent conformance** (Wave 4 Task 12): the `wave-4` page passes the same props and callbacks as web's, uncontrolled so a refusing host's `cancel()` keeps the state; Queue's remove lock holds across a host re-render with a new `items` array (per item, `queue.spec.ts`).
- **Selection and Action** (Wave 4 Task 11): fixtures gained a refused case (both callbacks cancelled), a case without `onAction` (disabled buttons, no `run`), the description `title`, and an Action whose host owns `open` through a stream.
- **Server-rendered Transcript segments overlapped at a 72px guess and moved on hydration** (Wave 4 Task 10): fixed; until the viewport connects (`measured`), segments stack in the flow, then sit at the measured offsets.
- **No Transcript case with an owner refusing the search** (Wave 4 Task 10): fixed; `refused` in both fixtures and its spec.
- **Test Results rows all re-rendered per streamed test, and no owner refused** (Wave 4 Task 9): tree items are cached per suite and `TestResultsRow` is memoized by item; the `refused` case pins the filter and open-row write-back.
- **Stack Trace had no accepting owner or find-in-page case (Wave 4 Task 8):** the `owned` fixture gained `accepted` (`onShowLibraryFramesChange` sets `showLibraryFrames`), and the spec checks the `library-press` and `find-in-page` reasons and a `beforematch` reveal.
- **Terminal server markup had no lines (Wave 4 Task 7),** so the screen grew ~312px on hydration: `state` now seeds the first 16 lines at the 20px guess (`firstRows`), which the virtualizer replaces once it connects. Owner-held `open` and a cancelled `onCopy` have an `owned` case; the docs' composition tree shows the `data-terminal-screen` and `data-terminal-header` wrappers the stylesheet styles.

- **File Tree's row parts couldn't be composed and no owner refused** (Wave 4 Task 6): `FileTree` takes `children` inside the Tree and exports `FileTreeRows`; `refused` fixture cases pin the write-back.
- **Generated Image's fixture had no pending download or progress tick** (Wave 4 Task 5): `onDownload` returns a promise the host settles (pending, the agent's `download` withdrawn, rejection and "Download failed"), and a tick updates `aria-valuenow`. A controlled `open` an owner keeps through a regeneration shows the image that last loaded (`full-image` reads `loadedSrc`), not a blank view.
- **Document had no owner-refusal, pending-download or cancelled-copy case, and its shared-tree comment overclaimed** (Wave 4 Task 4): the `refused` case and spec cover a refused `open`, `data-pending` with `download` leaving the agent actions, a rejection clearing it, and `onCopy` cancelling; the comment says only the viewport and scrollbar skip a chunk's render (the rest is the known options-change cost).
- **Inline Citation re-rendered every slide on each page, and its card took the marker's name** (Wave 4 Task 3): `carouselState` is memoized on the ids alone with `defaultPage` a getter read at mount, and the content drops UI SDK's `aria-labelledby` for the summary. The fixture gained a `refused` case.
- **Sources (Wave 4 Task 2):** a refusing-owner case (`refused`) and favicon, host and snippet assertions joined `wave-4/sources.spec.ts`.
- **Guardrail Notice (Wave 3 Task 10):** hydrating server-rendered notices after `load` no longer plays their entrance or announces them; a refusing `open` owner is tested (`refused` case); `GuardrailNotice` takes `children` into its description, as the web element does.
- **Feedback (Wave 3 Task 9):** the agent spec settles `onComment` instead of waiting out the bridge's timeout; a refusing host has a fixture case and a spec in both layers; the thumbs part is `FeedbackThumbs`, so it doesn't clash with the `FeedbackRating` type.
- **Context Meter text hydrated in the server's locale (Wave 3 Task 8).** Fixed: it formats in English until the root binds and reads the page's language, as UI SDK Meter does.
- **Suggestion (Wave 3 Task 7):** a chip inside a form no longer submits it (`type="button"` from core); `SuggestionControls` is exported, so a layout you compose hides Previous and Next too; the server markup shows neither controls nor fades until Carousel has measured, so a row that fits doesn't grow 64px on hydration.
- **Model Selector and Reasoning Effort (Wave 3 Task 6):** `ModelSelectorItem` and `ModelSelectorGroup` pass `className`, `ref` and other props through; `<ReasoningEffort>{null}</ReasoningEffort>` renders nothing, as other components' children do; a refusing host has a fixture case and a spec in both layers.
- **Checkpoint (Wave 3 Task 5):** server markup named Restore by nothing until hydration (the tooltip is `type="label"`); `CheckpointDialog` dropped its answers for `{null}` children (a destructuring default); the dialog sat in a `span` (the `restore` part is a `div`).
- **A controlled Question didn't follow its owner (Wave 3 Task 4).** Fixed: the groups and text boxes hold their own value, so a change a controlling owner doesn't take is written back through the controllers the next frame (a cancelled one at once). The agent test no longer waits 15 s for an unsettled submit (`question.spec.ts`, both layers).
- **Next.js App Router consumers had to wrap every render file in their own client module (Wave 3 Task 2).** Fixed: every `src/react/**/*.tsx` starts with `"use client";` (`registry.test.mjs` checks it; the registry copies it byte for byte), and the docs examples without state or handlers are now server components, so `npm run build:docs` builds an App Router consumer of them.
- **Every docs page logged React error #418 (Wave 3 Task 2).** The static export wrote `docs/step.html`, so a plain static host served the page at `/docs/step.html`; the client's pathname then matched no page, and Fumadocs' client-rendered footer (previous and next page) and sidebar rendered different text than the server had. Fixed with `trailingSlash: true` (`docs/step/index.html`, served at `/docs/step/`). `check:docs` opens built pages on a plain file server and fails on any console error.
- **Tools' copy buttons and code blocks shared labels (Wave 2 Task 10).** Fixed: each is named after its tool ("Copy search_docs input", "search_docs input") in both layers, tested in `wave-2/agent.spec.ts`. Markdown's "Code" / "Table" and two calls of the same tool stay open below.

- **Exits (Wave 2 Task 9):** `Attachments` takes a function of `{ rows }` as children, so styled chips keep their exit (chips rendered from `items` leave at once, and core drops their rows); the composer spec covers a chip added back and the host removing the focused chip.
- **Queue (Wave 2 Task 8):** the spec covers an item added after the first frame playing its entrance, and an item completing (focus, counts, one Tab stop).
- **Subagent (Wave 2 Task 7):** a complete subagent without `result` no longer keeps an empty 6px result strip (`:empty` hides it); the fixture now covers `avatarSrc` and React 19 rendering a `kind-subagent`'s steps.
- **Task and Plan (Wave 2 Task 6):** `TaskItemFiles` keys files by place, so a file listed twice renders; the entrance of an item appended after the first frame is tested; the Plan fixture's sibling plans keep their `items` arrays.
- **Chain of Thought (Wave 2 Task 5):** `onOpenStepsChange` (auto and pressed) and find in page's revealed text are now tested.
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
- **Approval Mode fixtures (Wave 5 Task 6):** `onLearnMore` had no case and the fixtures carried an unused `id`; a `learning` case and spec test cover it, and the `id` is gone.
- **A choice option's `icon` was `unknown` in React's `settings` props (Wave 5 Task 9):** `SettingsMenuSetting` narrows the options' icons too, and Model Control's `settings` use it.
- **`MessageTime` warned "Invalid DOM property `datetime`" (Wave 6 Task 9):** UI SDK's React props don't rename it, so the core slot writes `dateTime`; the clock path (no `now`) is pinned in `message.spec.ts` with no console errors.
- **Conversation Search ignored its `defaultQuery` at mount, didn't write back a controlled search the owner didn't take, left its marks when unmounted, and the docs example rendered every row on a marks change** (Wave 6 Task 11): fixed, with `preset` and `refused` cases; the example's rows are `memo`.

## Revisit

- **`MessageRegenerateContent` is `keepMounted` (Wave 5 Task 15)** so a closed Menu stays inside `data-agent-hidden`: server markup for a Message with three options grows from 707 to 4,474 bytes, per message. Marking the `regenerate` part `data-agent-hidden` while there are options would avoid mounting the rows, once checked that the bridge still offers the Message's `regenerate`.
