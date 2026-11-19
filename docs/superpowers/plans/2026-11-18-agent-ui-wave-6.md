# `@kind-ui/agent-ui` Wave 6 (0.6) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Each task is one session and one PR. Unlike Wave 5, most tasks don't stack on each other: see "Parallel batches".

**Goal:** Ship Wave 6, "thread and shell": Thread List, Thread Search, Sidebar, Launcher, Conversation Search, Day Separator, Connection Status and Share Dialog, plus Message's author, time and outcomes and Conversation's loading, error and empty states, in React and Web Components, with registry items, docs pages and the 0.6.0 changeset.

**Architecture:** Every Wave 6 component is one `definePrimitive` that composes UI SDK as Waves 1–5 do. The shell is UI SDK's: Sidebar is Resizable on wide screens and Drawer on narrow ones, Launcher and the dialogs own their popups through `createPopup` (as Context Meter and Generated Image do), Thread List is a one-Tab-stop grid (`createGridFocus`) over `createVirtualizer` with one UI SDK Menu for every row (`menuBase`), and Thread Search reuses Picker's Command rows inside a dialog. One new module, `core/time.ts`, turns dates into day groups and labels over `@ui-sdk/core/date` and `Intl`, for Thread List, Thread Search, Day Separator and Message. Conversation Search is the one new spec §2 row: it paints matches with the CSS Custom Highlight API.

**Tech Stack:** `@ui-sdk/core`, `@ui-sdk/react` and `@ui-sdk/web` stay at `0.1.0-beta.1`, `motion` at `14.14.0`. No new runtime dependency: Conversation Search reads a message's text from the Markdown engine's own `MdNode` tree (D10).

**Spec:** `docs/superpowers/specs/2026-11-14-agent-ui-design.md`: §1, §2 "Building on UI SDK" and "Internal general components", §3, §4.1, §4.2, §6 Motion and Agent actions, §7 Wave 6, §8, §9.1, §10. This plan's PR writes the decisions into the spec as recommended; a decision the user changes is rewritten there by Task 1 before any component starts. Also read `AGENTS.md` ("UI SDK API notes", Verification policy, the streaming UX checklist), `.agents/experts/*/decisions.md`, and the Wave 5 plan for the routine this one keeps.

## Decisions

Proposed 2026-11-18. **Open** marks a decision that needs the user's answer before Task 1 merges; the rest follow from earlier waves' rules.

- **D1. Scope: twelve roadmap items become eight components and two component updates (Open).** Each merge keeps one job per component, and a pattern that is markup over existing parts becomes a docs recipe rather than a component.

  | Roadmap item | Becomes | Why |
  | --- | --- | --- |
  | thread list | **Thread List** (Task 2) | The sidebar list every chat app has. |
  | thread list sidebar, assistant sidebar | **Sidebar** (Task 4), `side: "start"` or `"end"` | One frame: a resizable, collapsible panel beside the page that turns into a sheet on a phone. A thread list sits in a start sidebar, a whole chat in an end one. Two components would share every behavior. |
  | thread search (pinned and grouped) | **Thread Search** (Task 3), grouped as Thread List groups | The "Search chats" dialog. Grouping and pinning are shared through `core/time.ts` and `threadGroups`. Thread List gets no filter field of its own: the dialog is the search. |
  | in-conversation search with scrollbar marks | **Conversation Search** (Task 11) and Conversation's `marks` | A find bar over a conversation, which the browser's find can't search once it's virtualized. |
  | day separators and timestamps, speaker identity and message timing | **Day Separator** (Task 6) and Message's `author`, `createdAt` and `durationSeconds` (Task 9) | The same date code in two places: a heading between days, and a header on each message. |
  | empty state and onboarding | Conversation's empty title and description (Task 10), with Suggestion below | A welcome is a heading, a sentence and suggestions, which Conversation's empty part and Suggestion already are. **Onboarding (tours, coach marks) is dropped as niche** unless the user wants it. |
  | error state, stopped run | Message's outcome (Task 9) and Conversation's `status` (Task 10) | A failed or stopped answer belongs to its message; a thread that failed to load belongs to the conversation. Neither needs a component. |
  | connection state and resume | **Connection Status** (Task 7) | A connection is the app's, not a message's. Resuming a stream is the host's; the pill says it's happening. |
  | shared conversation | **Share Dialog** (Task 8) | Making a link and choosing who can open it. The shared view itself is a Conversation whose Messages get no action callbacks, shown as a docs recipe with a Notice. |
  | launcher or modal | **Launcher** (Task 5), with `modal` | A floating button that opens a chat, as a popover or a dialog. |

- **D2. Thread List is a navigation grid with one Tab stop.** The root is a `nav` named by `label` (default "Chats") holding a `role="grid"` on `createGridFocus` ("One Tab Stop in a Grid"): each thread is a `row` of two `gridcell`s, the thread's link (an `a` with its `href`, `aria-current="page"` on the current one) and its More button. Up and Down move between threads, Left and Right between the link and More (mirrored in right-to-left), Home and End, Page Up and Page Down; typeahead (`createTypeahead`) finds a title. Group headings are rows whose one cell can't take focus ("Cells That Can't Take Focus"), and rows the virtualizer hasn't rendered are revealed through `reveal: (cell) => virtual.scrollToIndex(cell.row)` ("Rows That Aren't Rendered"). The link is also a `MenuContextTrigger`, so Shift+F10, the context-menu key, a right-click and a long press open the row's menu. `onSelect(id, details)` is a `callback` through `dispatch`, so a host router cancels it and navigates itself; uncancelled, the link navigates. Not a roving `list` of links with a hidden More button (a list doesn't tell a screen reader that Left and Right exist), not every link and button in the Tab order (hundreds of Tab stops), and not Listbox (an option can't be a link or hold a button).
- **D3. One menu for every row, through `menuBase`.** Thread List spreads `menuBase` once and opens it with the row's id as the payload, as UI SDK Menu's "Triggers Outside the Menu" does, so 1,000 rows don't mount 1,000 menus. Its items (Rename, Pin or Unpin, Share, Delete) are present only with their callbacks. Rename edits the title in place with `createInlineEdit` (Enter commits through `onRename`, an `"action"` held pending until it settles; Escape cancels), as Message's edit does.
- **D4. Delete asks first, in an Alert Dialog (Open).** Delete opens the internal Alert Dialog ("Delete chat?", the title, Cancel and Delete) for a person and an agent alike, and only the dialog's Delete calls `onDelete`, the Checkpoint pattern: the dialog's Delete renders its own `data-agent-confirm`, so an agent's `delete(id)` always needs a person without gating Thread List's other actions. `confirmDelete: false` skips the dialog for hosts that offer Undo instead. Focus goes to the next row (else the previous, else New chat) through focus recovery.
- **D5. Thread groups come from `core/time.ts`.** `threadGroups(threads, { now, locale, timeZone })` puts pinned threads first, then the host's `group` when a thread has one, else a date group from `updatedAt`: Today, Yesterday, Previous 7 days, Previous 30 days, then each month this year, then each year. Labels come from `Intl.RelativeTimeFormat` (`numeric: "auto"`) and `@ui-sdk/core/date`'s `formatDate`, so every locale reads right; `todayDate(timeZone)` is today. Each group is a `role="group"` labelled by its heading. Group words are in English for the fixed buckets ("Previous 7 days") with a `groupLabels` option to replace them, as other components' default strings are.
- **D6. Long histories are always virtualized.** Thread List renders rows through `createVirtualizer` (group headings are rows too, of a fixed height), and the virtualizer's `onEnd` calls `onLoadMore` while `hasMore`; a loading row and an error row with Retry sit at the end. Rows have a fixed height (`--kind-thread-row-height`, 36px), so budgets don't depend on fonts.
- **D7. Thread Search is Picker's rows in a dialog.** `pickerBase` gains a `popup: "popover" | "dialog"` config (dialog: `createPopup` with `dialogPreset`, centered, modal, a full-screen sheet on phones through `presentation`) and a value-less mode in which choosing a row calls `onSelect` instead of setting `value`. Thread Search spreads it: rows are threads (title, snippet as the description, the date as `meta`, the status mark as the icon), grouped as D5, with "New chat" as a footer action. Local fuzzy filtering by default, grouped as D5. With `filter: false` the host searches: rows keep the host's order in one ungrouped list (pinning and dates show only as each row's mark and `meta`), and `status` (`"loading"`, `"error"`) drives Command's status part. Its trigger is the host's button (`ThreadSearchTrigger`) and an optional `shortcut` through `@ui-sdk/core/shortcuts`; no shortcut is on by default.
- **D8. Sidebar is UI SDK Resizable, and a Drawer on narrow screens (Open: a public frame, spec §1).** Wide: the root is a Resizable group of two panels, the sidebar (`collapsible`, `defaultSize`/`minSize`/`maxSize` in pixels, `collapsedSize` 0 or a rail width) and the inset (the host's page), with a handle named "Resize <label>" (the window splitter pattern, Enter collapses and restores). `open` maps to the panel's collapsed state through a `createResizableController()` the primitive owns, and the layout is saved through Resizable's `autoSaveId` and `storage` (the docs recommend a cookie storage so a server renders the saved width). Narrow (`overlayBelow`, a media query, default `(max-width: 767px)`, read with `matchMedia` in the root's `bind`): the panel is a UI SDK Drawer from the same side, modal, closed by default, and the trigger opens it. The switch remounts the panel's content (UI SDK Drawer's "Responsive" recipe); Thread List keeps nothing a remount loses. `side: "end"` with a Conversation inside is the assistant sidebar. `shortcut` (none by default; the docs show `mod+b`) registers through `@ui-sdk/core/shortcuts`' `registerShortcut`.
- **D9. Launcher opens a chat that stays mounted.** A floating button in the bottom end corner (`--kind-launcher-inset`) whose `label` names it ("Ask the assistant"), with `unread` drawn as a badge and read as words ("2 unread"). It owns its popup through `createPopup`: `popoverPreset` above the button by default (non-modal, so the page stays usable), `dialogPreset` with `modal`, and a full-screen sheet on small touch screens (`presentation: "auto"`). The panel has a title and a Close button and keeps its children mounted while closed (`keepMounted`), so the composer's draft and the conversation's scroll survive. `initialFocus` is a selector, by default the first composer editor inside.
- **D10. Conversation Search finds in the text Markdown renders and paints with the Highlight API.** Messages go in as `{ id, text }` (Markdown). `core/conversation-search/text.ts` walks the Markdown engine's `MdNode` blocks the way the Markdown view renders them, cached per text: text and inline code as they read, a line break between blocks, list items and table cells, an image's alt left out (it renders no text node), a code block's code without its header. So the n-th match in that text is the n-th match in the row's rendered text nodes, which a test checks over paragraphs, lists, tables, images, links and code blocks. Not `mdast-util-to-string`, which joins blocks without a break and keeps image alt text. Matches are `matchRanges` with UI SDK's folding, so case and accents fold as in Transcript. Moving to a match calls the Conversation controller's new `scrollToIndex(index)` (virtualized: `createVirtualizer`'s; else the row's `scrollIntoView` with `block: "center"`, smooth only at full motion). Painting and the unvirtualized scroll are the new spec §2 row: `CSS.highlights` gets two `Highlight`s (`kind-search`, `kind-search-current`) of `Range`s over the rendered rows' text nodes, rebuilt when the rows in view change; no DOM is written. A browser without the API still counts, moves and marks the scrollbar.
- **D11. Search marks sit in the Conversation and are bucketed.** Conversation gains `marks?: number[]` (message indexes) and a `marks` part, an `aria-hidden` track over its scrollbar edge: each mark sits at `--kind-conversation-mark` (0 to 1). Virtualized, the position is the message's index over the count, because `createVirtualizer` exposes no offset for a row it hasn't rendered; unvirtualized, it's the row's measured offset over the content's height. Marks closer than 4px merge into one, so a thousand matches draw at most the track's height over 4. Pressing a mark is not offered (the track is decorative; Next and Previous are the keyboard path).
- **D12. Browser find stays the browser's (Open).** Conversation Search takes a `shortcut` option and registers nothing by default; the docs show `mod+f` with a note that it replaces the browser's find, which can't reach messages a virtualized conversation hasn't rendered.
- **D13. Dates read relative on the client and absolute on the server.** Day Separator and Message render the absolute date or time (`formatDate`, `Intl.DateTimeFormat` with `locale` and `timeZone`, else English and UTC) in server markup, and their `bind` writes the relative word ("Today", "Yesterday", a weekday) from `todayDate(timeZone)` once in the page, as Conversation's jump text is written, so hydration never mismatches and the reader sees the right day at midnight. Words come from `Intl.RelativeTimeFormat` (`numeric: "auto"`), capitalized through CSS `::first-letter`, so no locale table ships.
- **D14. Day Separator is a heading.** A screen reader user jumps between days by heading, which a `separator` doesn't offer. `level` (default 3) sets `aria-level`; the line on each side is CSS.
- **D15. Speaker identity and timing are Message options.** `author?: { id, name, avatarUrl? }` (also on the neutral `Message`) fills Message's existing `avatar` part with the bare UI SDK Avatar and initials (`avatarInitials`, from Subagent) and a new `author` part with the name; `continued: boolean` hides both for a message that follows its author's last one, which the host knows from its list (`isContinuation(previous, next, { withinMinutes })` in `core/time.ts` helps). `createdAt` fills a `time` part (`<time datetime>`, the time of day, the date too when not today); `durationSeconds` fills a `duration` part ("4 s", "1 min 12 s", `Intl.NumberFormat` units). Absent options render nothing, so 0.5 markup is unchanged.
- **D16. Stopped and failed answers are Message's outcome.** A new `outcome` part, present for status `aborted` ("Stopped", with the cancelled status mark) or `error` (the `error` option's words, default "Something went wrong", with the error mark). `onContinue` adds Continue to a stopped message and `onRetry` adds Retry to a failed one, each an `"action"` on `createPendingAction`, offered to agents as `continue` and `retry` (web `can-continue`, `can-retry`). The outcome sits after the content and replaces nothing, so the streamed text never moves. It's announced once ("Response stopped", "Response failed"), only by a message this instance saw `streaming`, as Generated Image's outcomes are. The AI SDK adapter fills `error.message` from the chat's `error` (`fromUIMessages(messages, { status, error })`).
- **D17. Conversation's states are parts, not a component.** `status?: "ready" | "loading" | "error"` (default `"ready"`): `loading` shows a `skeleton` part (three fixed-height rows, `aria-hidden`, beside a visually hidden "Loading conversation" `role="status"`), `error` an `error` part with the `error` option's words and, with `onRetry` (`"action"`), Retry; both take the rows' place. The empty part gains `empty-title` and `empty-description` parts and centers them; suggestions are the host's Suggestion inside it. Agent action `retry`.
- **D18. Connection Status floats and takes no room (Open: placement).** A pill the host puts inside the Conversation root, positioned over the viewport's top edge (`position: absolute`), so appearing and leaving move nothing. It's a `group` named by its state's words, not a live region: `announce` is its one announcement channel, so the countdown never reads out. States: `online` (not present; leaves with the `"fade"` exit), `connecting`, `reconnecting` (with "Retrying in 5 s" counted down from `retryAt` by a one-second timer that writes `live` state), `offline`, and `resuming` (a stream picking up after a reconnect). Retry with `onRetry` (`"action"`). It announces "Connection lost" when it leaves `online` for `reconnecting` or `offline`, and "Reconnected" when it returns, once each. A Composer the host disables while offline is the host's choice, shown in the docs.
- **D19. Share Dialog never builds a URL and asks a person first (Open).** `visibility`/`defaultVisibility`/`onVisibilityChange` (`"private" | "link"`, labels "Only you" and "Anyone with the link") on the internal Segmented Control; `onCreateLink` (`"action"`) asks the host for a link while pending, and the host passes it back as `link`; Copy through `createCopy`; `onRevoke` (`"action"`). The dialog is the primitive's own (`createPopup` with `dialogPreset`, as Generated Image), so `open`/`onOpenChange` reach a web host. Making a conversation public is consequential, so the root renders `data-agent-confirm` while `agentConfirm` (default `true`), which gates every Share Dialog action (spec §6).
- **D20. No showcase (Open).** Wave 6 is the shell, which a showcase would be. Instead, Task 13 adds the full shell as the lead example of Sidebar's page (a start Sidebar with Thread List and Thread Search's trigger, a Conversation with Day Separators, Connection Status and Conversation Search, and the Composer), once every piece has landed; Launcher's page shows the corner chat. Neither replays a scripted run, which is what showcases are for.
- **D21. Parallel tasks share files through markers.** Tasks 2–10 branch from Task 1, not from each other. Task 1 puts one marker comment per task in `core/index.ts`, `registry/catalog.mjs` and `AGENTS.md` ("UI SDK API notes"), so each task's additions are separate hunks that merge cleanly. JSON files (`size-budget.json`, `components/meta.json`) can't take markers, and `tests/browser/wave-1/budgets.spec.ts` gains a separate `test` per task (Tasks 2 and 11); a task that lands after another rebases and keeps both. A task's docs example uses only components already on `main` and its own, so each docs build passes alone.
- **D22. Version order (a note).** 0.5.0 publishes from the Wave 5 stack. Task 13's changeset is `minor` for 0.6.0; every Message and Conversation change is additive.

## Global Constraints

- **Build on UI SDK (spec §2):**
  - Each component is one `definePrimitive` in `packages/agent-ui/src/core/<component>/`, exported as `<camelCase>Primitive` with the explicit `ReturnType<typeof definePrimitive<…>>` annotation. Each render file calls `createParts` or wraps a UI SDK component. `npm run lint` runs the guard.
  - Focus, keys, roving, typeahead, popups, sheets, dismissal, resizing, shortcuts, search, virtualization and announcements come from slot declarations, UI SDK components and `@ui-sdk/core` behaviors. The only new spec §2 row is D10's; a task that finds it needs another stops and asks for a spec change.
  - A composed UI SDK component follows the Composer pattern: the slot's `state` hands its props and controller (memoized in `api.partState`), React passes them as props, web writes them onto the `ui-*` element in the root's `render` hook and hears its events through `hearComposed`. Composed parts carry `data-agent-hidden`, so each component is one snapshot entry.
  - A popup the primitive owns uses `createPopup`, with `presentation` through `withAutoPresentation` and `initialFocus` as a selector.
  - Page shortcuts use `@ui-sdk/core/shortcuts`' `registerShortcut` (with `layer` where it belongs to a popup), so a modal pauses them; the part that shows the keys writes `formatShortcut` and `ariaKeyshortcuts` from its `bind`, as `core.md` "Shortcuts" says. No component registers a shortcut by default.
- **Read first:** the `ui-sdk` skill, `node_modules/@ui-sdk/<framework>/docs/llms.txt`, `docs/popups.md`, and each component page a task names. Where the installed docs differ from this plan, follow the docs and add a line to `AGENTS.md` "UI SDK API notes".
- **Names:** primitives `kind-<component>`; web tags `kind-<component>[-<part>]` in light DOM, declared in `HTMLElementTagNameMap`; React `<Name>`, `<Name><Part>`; web `define<Name>()`; registry items `<component>` and `<component>-web`. The naming option is `label`, never `title`.
- **Web:** callbacks are DOM events, renamed through `events` where a bubbling native event takes the name (`select`, `search`, `change`, `copy`); a callback whose presence offers an action has a `can-<action>` attribute. Values a web root reads when it connects are properties.
- **Agent actions (spec §6):** listed only while available, through api getters that return `undefined` otherwise; same code paths as pointer and keyboard. Callbacks report who caused them through `actionSource`, `dispatch` or `createChange`. Actions that take an id refuse an unknown one and list ids through `agent.items` (`closed: true`). `data-agent-confirm` only where D4 and D19 say.
- **Accessibility (spec §8):** every root and trigger is named; a link's name starts with its visible text (axe `label-content-name-mismatch`); statuses have a mark and words; `announce` is polite and fires on outcomes only (an answer stopped or failed, a connection lost or back, a search count after typing pauses), and a part that announces through it isn't also a live region; dates have a `<time datetime>`.
- **Motion:** every animated primitive takes `motion: "auto" | "reduced" | "none"`; durations and easings from `src/core/motion/tokens.ts` and `--kind-duration-*`/`--kind-ease*`; `"reduced"` is at most a 120 ms opacity fade, `"none"` is instant. Popups, sheets and the Drawer animate in CSS from UI SDK's `data-starting-style`/`data-ending-style`; a sidebar collapsing by its trigger animates the panel's width only at full motion (UI SDK Resizable sets sizes; the transition is ours, off while `dragging`).
- **Design bar:** light and dark through `--kind-color-*` tokens only. Nothing that comes and goes moves content: Connection Status floats, a message's outcome follows its content, Conversation's states take the rows' place, a thread row's More button is always laid out (shown on hover, focus and the current row). Every component PR has light and dark screenshots, nothing focused unless they show focus, plus one with its popup, dialog or drawer open, and one at 390 px. New glyphs are Lucide's (`panel-left`, `panel-right`, `message-circle`, `search`, `ellipsis`, `pin`, `pencil`, `share`, `trash-2`, `wifi-off`, `link`, `copy`, `chevron-up`, `chevron-down`, `x`), drawn as CSS masks with a `forced-colors` rule and added to the Lucide entry in `THIRD_PARTY_NOTICES.md`. No sparkle, anywhere (`scripts/tests/no-sparkle.test.mjs`).
- **Tests stay lean and never slow implementation:** build first, then test. Per component: core unit tests only for pure helpers (`core/time.ts`, `threadGroups`, the search text), and one browser spec per layer with an `expectAgentActions` snapshot and a smoke test (renders, the keyboard path, axe in light and dark with the popup open). Fixtures and explicitly resolved deferred promises only. Dates in fixtures are fixed ISO strings and `now` is passed in, never `Date.now()`; `timeZone: "UTC"` everywhere but the one test that checks another zone. Budgets match Linux CI: fix row heights, viewport sizes and panel widths in fixtures, and count nothing that depends on font metrics.
- **Ports:** every Playwright run in a task session sets `KIND_FIXTURE_PORT_BASE` to a base no other session uses (Task N uses `4400 + 10 × N`), since Wave 6 runs up to nine sessions at once on one machine.
- **Session routine:** freeze the core primitive's options, state, slots and api first; then React, web, CSS, docs and specs go to parallel subagents, and the owner writes shared files (`core/index.ts`, `registry/catalog.mjs`, `size-budget.json`, `AGENTS.md`, `meta.json`) once, at its marker (D21). `npm run check` runs alone, through one subagent, never beside another Playwright run in the same session.
- **Size:** each task adds its primitive to `imports` in `size-budget.json` at its measured gzip size rounded up to the next 500 bytes, and raises the `./core` limit by the measured growth, rounded up to the next 1,000 bytes.
- **Docs:** pages import examples by relative path and link with `./x.mdx`; `scripts/tests/docs.test.mjs` enforces both.
- **Publication:** nothing publishes, versions or deploys.
- **Commits** carry `Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>`.
- **References:** name only what the code builds on. Third-party attribution goes only in `THIRD_PARTY_NOTICES.md`.

## Review Focus

1. **Thread List by keyboard:** one Tab stop; ArrowDown through groups skips headings, including into rows not yet rendered; ArrowRight reaches the row's More button (ArrowLeft under `dir="rtl"`) and Shift+F10 opens the same menu; Rename's Escape restores the title; Delete's dialog returns focus to the next row. Task 2.
2. **A thousand threads:** selecting a thread, pinning one and loading more each render a fixed number of parts at 10 and 1,000 threads; `onLoadMore` fires once per approach to the end. Task 2.
3. **Search in a virtualized conversation:** Next to a message that isn't rendered scrolls it in and paints it current; the marks stay at most the track's height over 4 at 5,000 messages; Escape returns focus to where it was. Task 11.
4. **Sidebar across the breakpoint:** collapsing by trigger, Enter on the handle and the shortcut agree on `open`; a saved width restores on reload without a jump when the storage is a cookie; below `overlayBelow` the drawer traps focus and returns it to the trigger. Task 4.
5. **Dates at midnight and on a server:** server markup shows dates, the client shows "Today"/"Yesterday" in the given `timeZone`, and React hydrates without error #418. Tasks 1, 6, 9.
6. **An answer that stops or fails:** the outcome is announced once, Retry and Continue lock while pending, and streamed text above them doesn't move. Task 9.

---

## File Map

```text
packages/agent-ui/src/types/records.ts                    (+ Thread, MessageAuthor; Message gains author and error)
packages/agent-ui/src/core/time.ts                        (Task 1)
packages/agent-ui/src/core/{thread-list,thread-search,sidebar,launcher,conversation-search,day-separator,connection-status,share-dialog}/{<name>,index}.ts
packages/agent-ui/src/core/thread-list/groups.ts           (threadGroups, shared with Thread Search)
packages/agent-ui/src/core/conversation-search/text.ts
packages/agent-ui/src/core/picker/base.ts                  (Task 3: dialog popup, value-less mode)
packages/agent-ui/src/core/{message,conversation}/…        (Tasks 9, 10, 11)
packages/agent-ui/src/adapters/ai-sdk/…                    (Task 9: error.message)
packages/agent-ui/src/react/<name>.tsx    packages/agent-ui/src/web/<name>.ts
packages/agent-ui/src/{react,web}/internal/{resizable,drawer}.*         (Task 4)
packages/agent-ui/src/styles/<name>.css
packages/agent-ui/tests/core/{time,thread-groups,conversation-search}.test.mjs
packages/agent-ui/tests/fixtures/{react,web}/cases/<name>.*
tests/browser/wave-6/<name>.spec.ts
apps/docs/content/docs/components/<name>.mdx    apps/docs/examples/<name>/basic.tsx
registry/catalog.mjs    size-budget.json    AGENTS.md    .changeset/agent-ui-wave-6.md
```

## Parallel batches

| Batch | Tasks | Starts after | Files they share |
| --- | --- | --- | --- |
| 0 | 1 (groundwork) | this plan | none: it lands alone |
| A | 2, 3, 4, 5, 6, 7, 8, 9, 10 | Task 1 merged | only the marked shared files (D21). Each has its own core folder, render files and stylesheet; Task 3 alone edits Picker's base, Task 9 alone Message, Task 10 alone Conversation. |
| B | 11 | Task 10 merged | Conversation (the controller's `scrollToIndex` and `marks`) |
| C | 12 (conformance) | every task above merged | the agent fixture pages |
| D | 13 (docs index, changeset) | Task 12 merged | docs index, README, changeset |

Batch A is nine independent sessions. If fewer run at once, start Tasks 2, 4, 9 and 10 first: Task 10 unblocks Task 11, and Tasks 2 and 4 are the largest. Tasks 3 and 6 use `core/time.ts` and `threadGroups` but nothing of Task 2's; Task 3 takes `threadGroups` from Task 1.

## Component task routine

Tasks 2–11 each finish with these steps after their own tests pass. A task lists only what differs.

- [ ] **Registry:** add `<name>` to `components` in `registry/catalog.mjs` at the task's marker (title, one-line description, `uses` naming the items its render files import), and any new `internal` entry. Run `node --test scripts/tests/registry.test.mjs`. Expected: PASS.
- [ ] **Docs page:** follow `apps/docs/content/docs/components/step.mdx` and the `write-docs` and `fumadocs` skills: one captioned example on top, then Installation, Composition, Usage, API Reference (`<auto-type-table>` over `<Name>Options`), Agent (`<auto-type-table>` over `Pick<<Name>Api, …>`) and the closing `<Caption>` about Web Components. Add `apps/docs/examples/<name>/basic.tsx` (starting with `"use client"` when it holds state or handlers) and the page to `components/meta.json`, after `dictation` in task order. Run `node --test scripts/tests/docs.test.mjs && npm run build:docs`. Expected: PASS.
- [ ] **Screenshots:** light and dark screenshots of the docs example, nothing focused, plus one with its popup, dialog or drawer open and one at 390 px, into `artifacts/screenshots/<name>-{light,dark,open,narrow}.png`, attached to the PR with the `github-pr-media` skill.
- [ ] **Size:** `npm run check:size`, then set the budgets as Global Constraints say.
- [ ] **Finish:** run `unslop` on the diff, then `expert-review`, and fix its findings. Run `npm run check` once, alone, through a subagent, with this task's `KIND_FIXTURE_PORT_BASE`. Expected: PASS. Add any new UI SDK difference to `AGENTS.md` "UI SDK API notes" at the task's marker, one bullet named after the component, and move any `decisions.md` item the task settles to Resolved.
- [ ] **Commit and PR:** commit `feat(<name>): …`, push, and open the PR on the branch its batch names. The PR reports what was checked by hand in a real browser (keyboard, focus, the sheet or drawer at 390 px with touch, reduced motion through the media query and the `motion` option, light and dark) and what wasn't.

---

### Task 1: Wave 6 groundwork

Spec §2, §3, §4.2, §7 Wave 6; D5, D10, D13, D21.

**UI SDK:** `core.md` "Names and Labels", "Today", "The Page's Language", "Highlight What Matched", "Shortcuts"; `@ui-sdk/core/shortcuts` (`registerShortcut`), `formatShortcut`, `ariaKeyshortcuts`.

**Files:**
- Create: `packages/agent-ui/src/core/time.ts`, `packages/agent-ui/src/core/thread-list/groups.ts` (only `threadGroups`; Task 2 adds the primitive beside it)
- Modify: `src/types/{records,message,index}.ts`, `src/core/index.ts` (exports and one marker per Wave 6 task), `registry/catalog.mjs` (markers), `AGENTS.md` (markers under "UI SDK API notes"; the root scripts table's "waves 1 to 6"), `playwright.config.mjs` (`waves` gains `wave-6`), `scripts/affected-specs.mjs` if it names waves
- Test: `packages/agent-ui/tests/core/{time,thread-groups}.test.mjs`

**Interfaces:**
- `types`: `Thread` (spec §4.2); `MessageAuthor { id: string; name: string; avatarUrl?: string }`; `Message` gains `author?: MessageAuthor` and `error?: { message: string }`.
- `core/time.ts` (D5, D13): `dayKey(iso, timeZone?)`; `isSameDay(a, b, timeZone?)`; `dayLabel(iso, { now, locale, timeZone })` ("Today", "Yesterday", a weekday within 6 days, else the date); `timeLabel(iso, { now, locale, timeZone })` (the time of day; with the date when not today); `durationLabel(seconds, locale)` ("4 s", "1 min 12 s" through `Intl.NumberFormat` units); `isContinuation(previous, next, { withinMinutes = 5 })` over `author.id` and `createdAt`; `dateGroup(iso, { now, locale, timeZone })` (`{ key, label }` for D5's buckets). Every function is pure: `now` is an ISO string the caller passes, `todayDate(timeZone)` gives it in a `bind`.
- `core/thread-list/groups.ts`: `threadGroups(threads, { now, locale, timeZone, labels? }): { key: string; label: string; threads: Thread[] }[]`: pinned first, then host groups in first-seen order, then date groups newest first; threads keep the host's order inside a group.

- [ ] **Step 1: Write the failing tests.**

```js
test("dayLabel reads relative days in the given zone", () => {
  const now = "2026-11-18T07:30:00Z";
  assert.equal(dayLabel("2026-11-18T01:00:00Z", { now, locale: "en", timeZone: "UTC" }), "today");
  assert.equal(dayLabel("2026-11-17T23:00:00Z", { now, locale: "en", timeZone: "UTC" }), "yesterday");
  assert.equal(dayLabel("2026-11-17T23:00:00Z", { now, locale: "en", timeZone: "America/Los_Angeles" }), "today"); // both Nov 17 there
  assert.equal(dayLabel("2026-11-02T12:00:00Z", { now, locale: "en", timeZone: "UTC" }), "November 2, 2026");
});
test("threadGroups puts pinned first, then host groups, then date buckets", () => { /* fixed threads */ });
```

  The relative words are lower case where `Intl` writes them so; CSS capitalizes them (D13).
- [ ] **Step 2: Run** `npm run test:unit`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** the interfaces. Check in the installed `@ui-sdk/core/date` which of `formatDate`, `todayDate` and `dateFormatter` take a time zone, and note any difference in "UI SDK API notes".
- [ ] **Step 4: Spec.** If the user changed any Open decision, rewrite its spec lines now (§1, §2 rows and internal table, §4.2, §6 confirm list, §7 Wave 6).
- [ ] **Step 5: Run** `npm run lint && npm run typecheck && npm run test:unit && npm run check:size`. Expected: PASS.
- [ ] **Step 6:** Write the AGENTS.md "UI SDK API notes" bullet ("Wave 6 groundwork"). Commit `feat: Wave 6 groundwork`, push, open the PR on this plan's branch.

---

### Task 2: Thread List

Spec §6 "Agent actions", §7 Wave 6 "Thread List"; D2–D6.

**UI SDK:** `createGridFocus` (`core.md` "Grids": "One Tab Stop in a Grid", "Cells That Can't Take Focus", "Rows That Aren't Rendered"), `createTypeahead`, `createVirtualizer` ("Long lists", `onEnd`), Menu (`docs/components/menu.md`: "Context Menu", "Triggers Outside the Menu", "Controller") through `menuBase` and `internal-menu`, `createInlineEdit` ("Editing in place"), Alert Dialog through `internal-alert-dialog` (as Checkpoint), `createFocusRecovery`.

**Files:**
- Create: `packages/agent-ui/src/core/thread-list/{thread-list,index}.ts`, `src/react/thread-list.tsx`, `src/web/thread-list.ts`, `src/styles/thread-list.css`
- Test: `tests/browser/wave-6/thread-list.spec.ts`; a case in `tests/browser/wave-1/budgets.spec.ts`

**Interfaces:**
- Produces `threadListPrimitive` (`kind-thread-list`), spreading `menuBase` for the row menu:
  - Options: `threads: Thread[]`; `value?` (the current thread's id; host-owned, as a route is); `label` (default "Chats"); `onSelect?(id, details)` (`callback` through `dispatch`); `onNew?(details)`; `onRename?(id, title, details)` (`"action"`); `onPinChange?(id, pinned, details)` (`callback`); `onShare?(id, details)` (`callback`); `onDelete?(id, details)` (`"action"`); `confirmDelete?` (default `true`); `hasMore?`, `onLoadMore?`, `status?: "idle" | "loading" | "error"` (of loading more); `locale?`, `timeZone?`, `groupLabels?`; `presentation?` (the row menu); `motion`.
  - State: `rows` (headings and threads, from `threadGroups`, cached per `threads` array), virtualizer `items` and `size`, `menuFor` (the row id the menu is open for), `renaming`, `deleting` (the id the dialog asks about), `pending`.
  - Slots: `root` (`nav`, named); `new` (`role: "button"`, present with `onNew`); `viewport` (binds `createVirtualizer`); `grid` (`role: "grid"`, named by `label`, `aria-rowcount` from every row); `heading` (a `row` holding one non-focusable `rowheader` cell with the group's label, prop `value`); `row` (`role: "row"`, `aria-rowindex`, prop `value`); `link` (a `gridcell`'s focusable item on `createGridFocus`, an `a` with the thread's `href`, `aria-current="page"` on `value`, and the row's `MenuContextTrigger`); `status` (inside the link: the status mark, `role="img"` named "Running", "Needs input", "Failed", and an "Unread" dot); `more` (the other `gridcell`'s focusable item and the Menu trigger, named "More actions for <title>"); `editor` (present while renaming, `createInlineEdit`); `menu` (`menuBase`'s content: Rename, Pin or Unpin, Share, Delete); `dialog`, `dialog-title`, `dialog-cancel`, `dialog-delete` (the internal Alert Dialog; Delete renders `data-agent-confirm`); `end` (a loading row, or an error row with Retry calling `onLoadMore`).
  - A row's More button is laid out on every row and shown on hover, focus-within, the current row and the row whose menu is open, so nothing shifts. `keep` holds the row with the grid's Tab stop rendered. A long title is cut with an ellipsis; its full text is the link's name.
  - API getters: `select(id)`, `newThread`, `rename(id, title)`, `pin(id, pinned?)`, `share(id)`, `delete(id)` (opens the dialog unless `confirmDelete` is off), each while its callback is set. `controlled`: `value`. Agent actions: those six, `agent.items` from the thread ids (closed).
- React: `ThreadList` (+ `ThreadListRow`, `ThreadListMenu` for custom rows). Web: `defineThreadList()`, `can-select`, `can-new`, `can-rename`, `can-pin`, `can-share`, `can-delete`, `can-load-more`; events `threadselect`, `threadnew`, `threadrename`, `pinchange`, `threadshare`, `threaddelete`, `loadmore`.

- [ ] **Step 1: Write the failing browser test**, both layers:
  - **Review Focus 1.**
  - Groups read in order (Pinned, Today, Yesterday, Previous 7 days) from fixed `updatedAt`s, `now` and `timeZone: "UTC"`; a host `group` wins.
  - A cancelled `onSelect` doesn't navigate; an uncancelled one follows `href`.
  - Rename commits on Enter and keeps the old title while `onRename` is pending and after it rejects.
  - `act("delete", "t2")` opens the dialog and is refused at its Delete without a person.
  - At 390 px with touch the row menu is a sheet.
  - Axe with the menu open and with the dialog open, light and dark. `expectAgentActions(page, "Chats", ["select", "newThread", "rename", "pin", "share", "delete"])`.
  - Budget (**Review Focus 2**): in a 400 × 600 viewport with 36px rows, selecting, pinning and appending 20 threads among 10 and 1,000 render a fixed number of React components and re-read a fixed number of web parts.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-6/thread-list.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** The docs example is a Thread List with "New chat" in a fixed-height column (Task 13 puts it in the Sidebar shell).
- [ ] **Step 4: Run** the same, plus `npm run lint` and the budget case. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-menu", "internal-alert-dialog"]`). Record in `AGENTS.md` how `createGridFocus` and `createVirtualizer` share the rows. Commit `feat(thread-list): add Thread List`.

---

### Task 3: Thread Search

Spec §7 Wave 6 "Thread Search"; D5, D7.

**UI SDK:** `createPopup` with `dialogPreset` (`popupTrigger`, `popupContent`, `popupTitle`, `popupBackdrop`, `popupViewport`); Command (`docs/components/command.md`: "Async Options" with `filter={false}` and `status`, "Highlight Matches"); `matchSegments` for snippets; `@ui-sdk/core/shortcuts`.

**Files:**
- Create: `packages/agent-ui/src/core/thread-search/{thread-search,index}.ts`, `src/react/thread-search.tsx`, `src/web/thread-search.ts`, `src/styles/thread-search.css`
- Modify: `src/core/picker/base.ts` (`popup: "popover" | "dialog"`, value-less `onSelect` mode), `src/react/picker.tsx`, `src/web/picker.ts`, `src/styles/picker.css` (the dialog's size); `tests/browser/wave-5/picker.spec.ts` and `model-selector.spec.ts` stay green unchanged
- Test: `tests/browser/wave-6/thread-search.spec.ts`

**Interfaces:**
- `pickerBase` config gains `popup?: "popover" | "dialog"` (default `"popover"`) and `select?: true` (rows call `onSelect(value, details)` through `dispatch` and close, nothing is chosen, no check mark, no `value` in state).
- Produces `threadSearchPrimitive` (`kind-thread-search`), spreading `pickerBase({ popup: "dialog", select: true })`:
  - Options: `threads: Thread[]` (rows: title, `snippet` as the description with marks, `dateGroup` label as `meta`, the status mark as the icon); `query`/`defaultQuery`/`onQueryChange`; `filter?: false` (host search) with `status?: "idle" | "loading" | "error"`; `onSelect?(id, details)`; `onNew?` (a "New chat" footer action); `label` (default "Search chats"); `placeholder?` (default "Search chats"); `emptyText?` (default "No chats found"); `shortcut?`; `locale?`, `timeZone?`; `open`/`defaultOpen`/`onOpenChange`; `presentation?`; `motion`.
  - Groups from `threadGroups` (D5) while filtering locally; with `filter: false`, one list in the host's order (D7). Without a query, the newest 20 threads show.
  - API getters: `open`/`close`, `search(text)`, `select(id)` (while `onSelect`), `newThread` (while `onNew`). Agent actions: `open`, `close`, `search`, `select`, `newThread`; `agent.items` from thread ids.
- React: `ThreadSearch`, `ThreadSearchTrigger`. Web: `defineThreadSearch()`, `can-select`, `can-new`; events `threadselect`, `threadnew`, `querychange`.

- [ ] **Step 1: Write the failing browser test**, both layers: the trigger's shortcut opens it (`setPlatform` in the fixture) and shows its keys; typing filters and marks titles and snippets; with `filter: false` the rows keep the host's order, ungrouped, and `status="loading"` sets `aria-busy`; Enter calls `onSelect` and closes, returning focus to the trigger; Escape clears, then closes; a sheet at 390 px with touch; axe open, light and dark; `expectAgentActions(page, "Search chats", ["open", "search", "select", "newThread"])` (as the bridge lists them while closed). Picker and Model Selector specs pass unchanged.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-6/thread-search.spec.ts tests/browser/wave-5/picker.spec.ts tests/browser/wave-3/model-selector.spec.ts`. Expected: the new spec FAILS, the others PASS.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["picker", "internal-command"]`). Commit `feat(thread-search): add Thread Search`.

---

### Task 4: Sidebar

Spec §1, §7 Wave 6 "Sidebar"; D8.

**UI SDK:** Resizable (`docs/components/resizable.md`: "Collapsible", "Sizes in Pixels", "Persistence", "Storage", "Controller"), Drawer (`docs/components/drawer.md`: "Sides", "Modal", "Responsive"), `@ui-sdk/core/shortcuts`.

**Files:**
- Create: `packages/agent-ui/src/core/sidebar/{sidebar,index}.ts`, `src/react/sidebar.tsx`, `src/web/sidebar.ts`, `src/styles/sidebar.css`, `src/{react,web}/internal/{resizable,drawer}.*`
- Modify: `registry/catalog.mjs` (`internal-resizable`, `internal-drawer`)
- Test: `tests/browser/wave-6/sidebar.spec.ts`

**Interfaces:**
- Produces `sidebarPrimitive` (`kind-sidebar`):
  - Options: `side?: "start" | "end"` (default `"start"`); `label` (the panel's name: "Chats", "Assistant"); `open`/`defaultOpen`/`onOpenChange` (reasons `trigger-press`, `handle`, `drag`, `shortcut`, `outside-press`, `escape-key`, `imperative`); `defaultSize?` (default `"280px"`), `minSize?` (`"220px"`), `maxSize?` (`"420px"`), `collapsedSize?` (`"0px"`; a rail width keeps icons); `storageKey?` with `storage?` (Resizable's `autoSaveId` and `storage`); `overlayBelow?` (default `"(max-width: 767px)"`); `shortcut?`; `motion`.
  - State: `open`, `overlay` (whether the drawer is in use), `size`.
  - Slots: `root` (the Resizable group, or a plain wrapper while `overlay`); `panel` (`aside` named by `label`; the collapsible ResizablePanel, or the Drawer's content while `overlay`); `handle` (ResizableHandle, named "Resize <label>", absent while `overlay`); `inset` (the host's page, the other ResizablePanel); `trigger` (`role: "button"`, `aria-expanded`, `aria-controls` the panel, named "Show <label>" or "Hide <label>" by state, with the shortcut's keys and `aria-keyshortcuts` written in its `bind`); `backdrop` (the Drawer's, while `overlay`).
  - The panel's width transitions only for a trigger, shortcut or `api` change at full motion, never while dragging.
  - API getters: `open` while closed, `close` while open. `controlled`: `open`, `overlay`. Agent actions: `open`, `close`.
- React: `Sidebar`, `SidebarPanel`, `SidebarHandle`, `SidebarInset`, `SidebarTrigger`. Web: `defineSidebar()`, event `openchange`.

- [ ] **Step 1: Write the failing browser test**, both layers, at 1280 × 800 and at 390 × 844 with touch:
  - **Review Focus 4.**
  - The handle is a `separator` with `aria-valuenow`, ArrowLeft/ArrowRight resize within `minSize`/`maxSize` (pixels hold when the window resizes), Enter collapses and the trigger restores it.
  - At 390 px, the trigger opens a modal drawer from the start side (from the end with `side="end"`), Escape closes it and focus returns to the trigger.
  - `side="end"` holds a Conversation and Composer fixture that keeps its draft across collapse and restore on wide screens.
  - Axe with the drawer open and with the panel open, light and dark. `expectAgentActions(page, "Chats", ["close"])`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-6/sidebar.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** The docs examples are a start Sidebar holding a list of links beside a page, and an end Sidebar docking a Conversation and Composer as an assistant; Task 13 adds the full shell (D20).
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-resizable", "internal-drawer"]`). Commit `feat(sidebar): add Sidebar`.

---

### Task 5: Launcher

Spec §7 Wave 6 "Launcher"; D9.

**UI SDK:** `createPopup` with `popoverPreset` and `dialogPreset`, `withAutoPresentation` (`core/presentation.ts`), `@ui-sdk/core/shortcuts`.

**Files:**
- Create: `packages/agent-ui/src/core/launcher/{launcher,index}.ts`, `src/react/launcher.tsx`, `src/web/launcher.ts`, `src/styles/launcher.css`
- Test: `tests/browser/wave-6/launcher.spec.ts`

**Interfaces:**
- Produces `launcherPrimitive` (`kind-launcher`):
  - Options: `label` (default "Assistant"; the trigger is named "Open <label>" or "Close <label>"); `unread?: number`; `modal?: boolean`; `open`/`defaultOpen`/`onOpenChange`; `initialFocus?` (a selector, default the first `[data-slot=composer-input]` inside); `shortcut?`; `presentation?`; `motion`.
  - Slots: `root`; `trigger` (the floating button, `message-circle` glyph swapping to `x` while open, in one box); `badge` (`aria-hidden`; the count joins the trigger's name as "2 unread"); `content` (the panel, `keepMounted`, sized by `--kind-launcher-width` and `--kind-launcher-height`, a full sheet on phones); `title`; `close`; `backdrop` (with `modal`).
  - API getters: `open`/`close`. `controlled`: `open`. Agent actions: `open`, `close`.
- React: `Launcher`, `LauncherTrigger`, `LauncherContent`, `LauncherTitle`, `LauncherClose`. Web: `defineLauncher()`, event `openchange`.

- [ ] **Step 1: Write the failing browser test**, both layers: opening focuses the composer inside, Escape closes and focus returns to the trigger; the page stays usable while the non-modal panel is open (a page button takes a click), and with `modal` it doesn't; a draft typed, closed and reopened is still there; the unread count is in the trigger's name; a sheet at 390 px with touch; axe open, light and dark; `expectAgentActions(page, "Open Assistant", ["open"])`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-6/launcher.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** The docs example opens a small Conversation with a Composer.
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine.** Commit `feat(launcher): add Launcher`.

---

### Task 6: Day Separator

Spec §7 Wave 6 "Day Separator"; D13, D14.

**UI SDK:** `@ui-sdk/core/date` (`formatDate`, `todayDate`), `pageLocale`.

**Files:**
- Create: `packages/agent-ui/src/core/day-separator/{day-separator,index}.ts`, `src/react/day-separator.tsx`, `src/web/day-separator.ts`, `src/styles/day-separator.css`
- Test: `tests/browser/wave-6/day-separator.spec.ts`

**Interfaces:**
- Produces `daySeparatorPrimitive` (`kind-day-separator`):
  - Options: `date` (ISO 8601); `locale?`; `timeZone?`; `level?` (default 3); `relative?` (default `true`).
  - Slots: `root` (`role: "heading"`, `aria-level`); `label` (a `<time datetime>` with the absolute date in server markup and the relative word after `bind`).
  - No agent actions; it's content. The docs show placing one before each message whose `dayKey` differs from the previous one's, in a virtualized Conversation too (as a row).
- React: `DaySeparator`. Web: `defineDaySeparator()`.

- [ ] **Step 1: Write the failing browser test**, both layers: "Today", "Yesterday", a weekday and a date from fixed dates with `now` set through the page clock (`page.clock`); `timeZone` moves a late-evening message to the next day; React server markup hydrates without error (**Review Focus 5**); the heading is found by `getByRole("heading", { name: "Today" })`; axe light and dark.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-6/day-separator.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (no popup: the screenshots are light, dark and narrow). Commit `feat(day-separator): add Day Separator`.

---

### Task 7: Connection Status

Spec §7 Wave 6 "Connection Status"; D18.

**UI SDK:** `announce`, `live` state, `animateIn`/`animateOut`, `createPendingAction` (`core/pending.ts`).

**Files:**
- Create: `packages/agent-ui/src/core/connection-status/{connection-status,index}.ts`, `src/react/connection-status.tsx`, `src/web/connection-status.ts`, `src/styles/connection-status.css`
- Test: `tests/browser/wave-6/connection-status.spec.ts`

**Interfaces:**
- Produces `connectionStatusPrimitive` (`kind-connection-status`):
  - Options: `state: "online" | "connecting" | "reconnecting" | "offline"`; `resuming?: boolean`; `retryAt?: string` (ISO 8601); `onRetry?(details)` (`"action"`); `labels?` (the words for each state); `motion`.
  - State: `present` (false once `online` and the exit ends), `seconds` (`live`, from `retryAt`, one timer while `reconnecting`), `pending`.
  - Slots: `root` (`role: "group"` named by the state's words, `data-state`; no live region, D18); `mark` (the status mark: running for connecting, reconnecting and resuming; warning for offline); `text`; `retry` (`role: "button"`, present with `onRetry` while not `online`).
  - API getter `retry` while `onRetry` and not pending. Agent action `retry`.
- React: `ConnectionStatus`. Web: `defineConnectionStatus()`, `can-retry`, event `retry`.

- [ ] **Step 1: Write the failing browser test**, both layers: placed in a Conversation fixture, going `offline` and back moves no message (bounding boxes); the countdown reads "Retrying in 3 s", "2 s", "1 s" under `page.clock`, no element in it is a live region, and the announcer region gets nothing per tick; "Connection lost" and "Reconnected" are each announced once; Retry locks while pending; reduced motion fades over 120 ms; axe light and dark; `expectAgentActions(page, "Offline", ["retry"])` (the root is named by its text).
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-6/connection-status.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** The docs example shows it over a Conversation, with the Composer disabled while offline.
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (no popup). Commit `feat(connection-status): add Connection Status`.

---

### Task 8: Share Dialog

Spec §6 "Agent actions", §7 Wave 6 "Share Dialog"; D19.

**UI SDK:** `createPopup` with `dialogPreset`; Segmented Control through `internal-segmented-control` with a controller the primitive owns (as Reasoning Effort); Input (`readOnly`); `createCopy` (`core/clipboard.ts`); `createPendingAction`.

**Files:**
- Create: `packages/agent-ui/src/core/share-dialog/{share-dialog,index}.ts`, `src/react/share-dialog.tsx`, `src/web/share-dialog.ts`, `src/styles/share-dialog.css`
- Test: `tests/browser/wave-6/share-dialog.spec.ts`

**Interfaces:**
- Produces `shareDialogPrimitive` (`kind-share-dialog`):
  - Options: `label` (the trigger's name, default "Share"); `dialogLabel` (the dialog's title, default "Share chat"); `visibility`/`defaultVisibility`/`onVisibilityChange` (`"private" | "link"`); `link?: string`; `onCreateLink?(details)` (`"action"`); `onRevoke?(details)` (`"action"`); `onCopy?(link, details)`; `agentConfirm?` (default `true`); `open`/`defaultOpen`/`onOpenChange`; `presentation?`; `motion`.
  - Slots: `root` (renders `data-agent-confirm` while `agentConfirm`); `trigger`; `content`; `title`; `description`; `visibility` (the Segmented Control); `link` (Input, read-only, named "Link"); `create` ("Create link", present while `link` is empty and `visibility` is `link`); `copy` ("Copy link"/"Copied"); `revoke`; `error` (a rejected create or revoke's words, announced); `close`.
  - API getters: `open`/`close`, `setVisibility(value)`, `createLink` (while `onCreateLink`, no `link`, not pending), `copyLink` (while `link`), `revoke` (while `onRevoke` and `link`). Agent actions: those six.
- React: `ShareDialog` (+ parts). Web: `defineShareDialog()`, `can-create-link`, `can-revoke`; events `visibilitychange`, `createlink`, `revoke`, `linkcopy`, `openchange`.

- [ ] **Step 1: Write the failing browser test**, both layers: choosing "Anyone with the link" shows Create link; Create locks while pending and shows the link the host passes; Copy writes it (`tests/browser/clipboard.ts`) and says "Copied"; a rejected create shows and announces its words and stays retryable; `act("createLink")` is refused without a person while `agentConfirm`; a sheet at 390 px with touch; axe open, light and dark; `expectAgentActions(page, "Share", ["open"])`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-6/share-dialog.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** The page adds the shared-view recipe: a Conversation of Messages without callbacks under a Notice ("This is a shared copy of a chat.") with a "Continue this chat" button.
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-segmented-control"]`). Commit `feat(share-dialog): add Share Dialog`.

---

### Task 9: Message author, time and outcomes

Spec §4.2, §7 Wave 1 "Message" and Wave 6; D13, D15, D16.

**UI SDK:** Avatar (bare parts, as Subagent), `createPendingAction`, `announce`.

**Files:**
- Modify: `packages/agent-ui/src/core/message/message.ts`, `src/react/message.tsx`, `src/web/message.ts`, `src/styles/message.css`, `src/adapters/ai-sdk/*` (`error.message`), `packages/agent-ui/README.md` (adapter section), `tests/browser/wave-1/message.spec.ts`, `packages/agent-ui/tests/core/adapter*.test.mjs`, `apps/docs/content/docs/components/message.mdx`, `apps/docs/examples/message/*`

**Interfaces:**
- `messagePrimitive` gains options `author?: MessageAuthor`, `continued?: boolean`, `createdAt?: string`, `durationSeconds?: number`, `locale?`, `timeZone?`, `error?: string`, `onRetry?(details)` and `onContinue?(details)` (both `"action"`); parts `author`, `time`, `duration`, `outcome`, `outcome-text`, `retry`, `continue` (the existing `avatar` part takes the Avatar). State gains `outcome: "stopped" | "failed" | null` and `outcomePending`.
- Agent actions `retry` and `continue`, offered while their callback is set, the status fits and nothing is pending. Web: `can-retry`, `can-continue`; events `retry`, `continue`.
- `fromUIMessages(messages, { status, error })` sets `error.message` on the last message when the chat's `error` is set.

- [ ] **Step 1: Update the failing tests**, both layers: **Review Focus 6**; the author's name and initials show and `continued` hides them; the time reads "9:41 AM" today and "Nov 17, 9:41 AM" otherwise (fixed `now`, UTC), with `datetime` set; `durationSeconds={72}` reads "1 min 12 s"; a Message with none of the new options renders 0.5's markup (existing assertions); `expectAgentActions` lists `retry` on a failed message with `onRetry`. Adapter: the chat's error reaches the last message.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-1/message.spec.ts && npm run test:unit`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint && npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Component task routine** (the page exists; it gains "Author and time" and "Stopped and failed answers" sections). Commit `feat(message): add author, time and outcomes`.

---

### Task 10: Conversation states

Spec §7 Wave 1 "Conversation" and Wave 6; D17.

**Files:**
- Modify: `packages/agent-ui/src/core/conversation/conversation.ts`, `src/react/conversation.tsx`, `src/web/conversation.ts`, `src/styles/conversation.css`, `tests/browser/wave-1/conversation.spec.ts`, `apps/docs/content/docs/components/conversation.mdx`, `apps/docs/examples/conversation/*`

**Interfaces:**
- Options: `status?: "ready" | "loading" | "error"`; `error?: string`; `onRetry?(details)` (`"action"`). Parts: `skeleton` (present while loading, three rows of `--kind-conversation-skeleton-row` heights, `aria-hidden`, beside a visually hidden `role="status"` "Loading conversation"); `error` (`role="alert"` only when it appears after load, else `role="status"`) with `error-text` and `retry`; `empty-title` and `empty-description` inside `empty`. The `empty` part shows only while `ready`.
- Agent action `retry` while `onRetry` and `error`. Web: `can-retry`, event `retry`.

- [ ] **Step 1: Update the failing tests**, both layers: loading → ready swaps the skeleton for the rows without moving the viewport's box; error shows words and Retry, which locks while pending; the empty part's title and description render and center at 390 px; the existing conversation tests pass unchanged; axe in each state, light and dark.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-1/conversation.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** The page gains "Loading and errors" and "Empty state" sections; the empty state's example holds a Suggestion.
- [ ] **Step 4: Run** the same, plus `npm run lint && npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Component task routine** (the page exists). Commit `feat(conversation): add loading, error and empty states`.

---

### Task 11: Conversation Search

Spec §2 ("Conversation search highlights" row), §7 Wave 6 "Conversation Search"; D10, D11, D12. Stacks on Task 10.

**UI SDK:** Input, Input Group and Clear (bare parts, as Transcript) through an `InputController` the primitive owns; `matchRanges` (`@ui-sdk/core/text-match`); `createVirtualizer`'s `scrollToIndex`; `announce`; `@ui-sdk/core/shortcuts`.

**Files:**
- Create: `packages/agent-ui/src/core/conversation-search/{conversation-search,text,index}.ts`, `src/react/conversation-search.tsx`, `src/web/conversation-search.ts`, `src/styles/conversation-search.css`
- Modify: `src/core/conversation/conversation.ts` (controller `scrollToIndex(index)` and `rowElement(index)`; option `marks`; part `marks` and `mark`), Conversation's render files and stylesheet, `scripts/ui-sdk-exceptions.json` (the D10 row), `src/core/markdown/index.ts` if the `MdNode` walk needs an export
- Test: `packages/agent-ui/tests/core/conversation-search.test.mjs`, `tests/browser/wave-6/conversation-search.spec.ts`; a case in `tests/browser/wave-1/budgets.spec.ts`

**Interfaces:**
- Produces `conversationSearchPrimitive` (`kind-conversation-search`):
  - Options: `messages: { id: string; text: string }[]`; `conversation?: ConversationController`; `query`/`defaultQuery`/`onQueryChange`; `open`/`defaultOpen`/`onOpenChange`; `label` (default "Search in conversation"); `shortcut?`; `onMarksChange?(indexes)` (for hosts that pass `marks` themselves; React and web examples wire it to Conversation's `marks`); `motion`.
  - State: `matches` (`{ index, start, end }[]` over the search text), `current`, `marks` (message indexes, bucketed by the Conversation).
  - Slots: `root` (`role: "search"`, named); `input` (the Input, `aria-describedby` the count); `count` ("3 of 12", "No results"); `previous`, `next` (`role: "button"`, `aria-disabled` without matches); `close`.
  - Enter and Shift+Enter in the field, and F3/Shift+F3, move; Escape clears, then closes, returning focus to the element focused before it opened.
  - API getters: `search(text)`, `next`, `previous` (while there are matches), `close` (while open). Agent actions: those four.
- `core/conversation-search/text.ts`: `searchText(markdown)` (the walk D10 describes over the engine's `MdNode` blocks, cached by text) and `findMatches(texts, query)`.
- Conversation: `marks?: number[]`; the `marks` part (`aria-hidden`) holds one `mark` part per bucket at `--kind-conversation-mark`.
- React: `ConversationSearch`. Web: `defineConversationSearch()`, events `querychange`, `openchange`.

- [ ] **Step 1: Write the failing tests.** Core: `searchText` drops Markdown syntax ("**bold** [link](x)" → "bold link"), breaks between blocks, list items and cells, and leaves out image alt; `findMatches` folds case and accents. Browser: for a fixture message of paragraphs, a list, a table, an image, a link and a code block, the count `findMatches` gives equals the ranges found in the rendered row's text nodes, in both layers. Browser, both layers:
  - **Review Focus 3.**
  - With 50 messages unvirtualized and 5,000 virtualized (fixed 48px rows, a 480px viewport): Next scrolls the current match's message into view and the `kind-search-current` highlight holds its range (`CSS.highlights.get(…)`); the count is announced once after typing pauses.
  - Without `CSS.highlights` (deleted in the fixture) counting, moving and marks still work.
  - Axe open, light and dark. `expectAgentActions(page, "Search in conversation", ["search", "close"])`.
  - Budget: typing one character among 100 and 5,000 messages writes at most the bucket count of mark parts and re-renders a fixed number of Conversation rows.
- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-6/conversation-search.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Add the D10 row's exception entry for the highlight code in `core/conversation-search/conversation-search.ts`.
- [ ] **Step 4: Run** the same, plus `npm run lint` and `tests/browser/wave-1/conversation.spec.ts`. Expected: PASS.
- [ ] **Step 5: Component task routine** (screenshots show the bar with marks beside the scrollbar). Commit `feat(conversation-search): add Conversation Search`.

---

### Task 12: Wave 6 agent conformance and pattern checks

Spec §6 "Agent actions", §10. Each component's snapshot is tested in its task; this task covers what they share, as Wave 5 Task 15 did.

**Files:**
- Modify: `packages/agent-ui/tests/fixtures/{react,web}/cases/agent.*` (a `case=wave-6` page: the Wave 5 page plus every Wave 6 component, a Message with `author`, `onRetry` and status `error`, and a Conversation with `status="error"` and `onRetry`); `tests/browser/wave-5/aria-patterns.spec.ts` or a new `tests/browser/wave-6/aria-patterns.spec.ts`; `packages/agent-ui/tests/core/ui-sdk-testing.test.mjs` (a `checkServer` case per new primitive)
- Test: `tests/browser/wave-6/agent.spec.ts` (through `tests/browser/agent-conformance.ts`)

- [ ] **Step 1: Write the tests**, both layers:
  - The snapshot lists every Wave 6 component once by its accessible name: no composed Resizable, Drawer, Command, Menu, Segmented Control or Input appears as an entry of its own.
  - Only Share Dialog (while `agentConfirm`) and Thread List's delete dialog's Delete render `data-agent-confirm`, beside Wave 5's.
  - Each Wave 6 action but the bridge's generic `press` runs once through `act` and once through a person's input on a fresh page; attributes and text match, apart from inline styles, `tabindex` and popups the person opened on the way (`ignore`).
  - Callbacks receive `details.source === "agent"`, and a cancelling `onSelect`, `onOpenChange` or change callback leaves the state unchanged.
  - Actions that take an id refuse an unknown one; on web, every `can-*` attribute adds and removes its action.
  - `checkServer` passes for every new primitive; `checkPattern` passes for Thread List (list and menu), Thread Search (dialog and listbox), Sidebar (window splitter, disclosure, dialog when narrow), Launcher (dialog), Share Dialog (dialog, radio group) and Conversation Search (search), and `checkDirection` under `dir="rtl"` for Thread List's ArrowRight to More (which turns to ArrowLeft) and Sidebar's handle. Each accepted problem is listed in `known` beside the `decisions.md` entry it names.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-6/agent.spec.ts tests/browser/wave-6/aria-patterns.spec.ts && npm run test:unit`. Expected: PASS; fix the owning primitive for any failure.
- [ ] **Step 3: Commit** `test: add Wave 6 agent conformance`, then follow the routine's **Finish** and **Commit and PR** steps.

---

### Task 13: Docs index and the 0.6.0 changeset

Spec §9.1, §9.5; D20, D22.

**Files:**
- Create: `.changeset/agent-ui-wave-6.md`
- Modify: `apps/docs/content/docs/index.mdx`, `packages/agent-ui/README.md` (component list), `scripts/tests/docs.test.mjs` (the visible pages), `apps/docs/content/docs/components/sidebar.mdx` and `apps/docs/examples/sidebar/shell.tsx` (the full shell, D20, as the page's lead example)

**Interfaces:**
- `.changeset/agent-ui-wave-6.md`: `"@kind-ui/agent-ui": minor`, listing the new components, Message's `author`, `createdAt`, `durationSeconds`, `onRetry` and `onContinue`, Conversation's `status`, empty parts and `marks`, Picker's dialog popup, the neutral `Thread` and `Message.author`/`error`, and the adapter's `error`.
- No showcase page unless D20 changes.

- [ ] **Step 1: Write the failing test.** `docs.test.mjs`: every Wave 6 page is listed in `components/meta.json` and the docs index.
- [ ] **Step 2: Run** `node --test scripts/tests/docs.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement**, in the site's voice (`write-docs`), with light and dark screenshots of the full shell at 1280 px and 390 px.
- [ ] **Step 4: Run** `npm run build:docs`, then `npm run check` alone, through a subagent. Expected: PASS; `check:registry-consumers` installs every visible React item and its web twin.
- [ ] **Step 5:** Run `unslop` and `expert-review`. Commit `docs: index Wave 6 and add the 0.6.0 changeset`, push, open the PR. Don't publish, version or deploy.

---

## How this plan builds on UI SDK

| Requirement | Where |
| --- | --- |
| One `definePrimitive` per component, `createParts` per render file | Guard in `npm run lint`, every task |
| Sidebars are UI SDK Resizable and Drawer, not a hand-made splitter or sheet | Sidebar (Task 4) |
| One-Tab-stop grids, typeahead, virtualization and loading more are `createGridFocus`, `createTypeahead` and `createVirtualizer` | Thread List (Task 2) |
| Row actions are one UI SDK Menu with outside and context triggers | Thread List (Task 2), through `menuBase` |
| Rename in place is `createInlineEdit`; delete asks through Alert Dialog | Thread List (Task 2) |
| Search lists are UI SDK Command, server results through `filter: false` and `status` | Thread Search (Task 3), through `pickerBase` |
| Popups, dialogs and sheets come from `createPopup` and `presentation` | Tasks 3, 5, 8 |
| Page shortcuts come from `@ui-sdk/core/shortcuts` | Tasks 3, 4, 5, 11 |
| Dates come from `@ui-sdk/core/date` and `Intl` | `core/time.ts` (Task 1), Tasks 2, 3, 6, 9 |
| Matching is `matchRanges` and `fuzzyScore` | Tasks 3, 11 |
| Every component is a live UI SDK primitive with its actions, and passes `@ui-sdk/core/testing` | `expectAgentActions` in Tasks 2–11, and Task 12 |
| Hand-written code only for spec §2 rows | D10 adds one row (the Highlight API and the unvirtualized scroll to a match) |

## Self-Review Notes

- **Scope coverage (D1):** thread list (Task 2); thread list sidebar and assistant sidebar (Task 4); thread search, pinned and grouped (Task 3, with Task 1's `threadGroups`); in-conversation search with scrollbar marks (Task 11, with Conversation's `marks`); day separators and timestamps (Tasks 6, 9); empty state (Task 10; onboarding dropped, D1); error state (Tasks 9, 10); connection state and resume (Task 7); stopped run (Task 9); shared conversation (Task 8 and its recipe); launcher or modal (Task 5); speaker identity and message timing (Task 9).
- **Spec coverage:** §1 goals and the public-frame note: this PR. §2 row and internal table: Task 11, Task 4. §3 (the time helpers in `./core`): Task 1. §4.2 types: Task 1. §6 confirm list: Tasks 2, 8, 12. §7 Wave 6 rows and behavior lines: Tasks 2–11. §8: axe, keyboard and announcement checks per task. §9.1, §9.5: Task 13 and each page.
- **Niche items flagged:** onboarding tours (dropped, D1) and taking over the browser's find (off by default, D12). Every component kept is a pattern mainstream chat apps share.
- **Out of scope:** onboarding tours; a thread list filter field (Thread Search is the search); multi-select and bulk delete of threads; folders or projects beyond the host's `group`; real-time presence in a shared conversation; a showcase (D20).
