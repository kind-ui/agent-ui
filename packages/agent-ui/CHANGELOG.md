# @kind-ui/agent-ui

## 0.7.2

### Patch Changes

- 2ec67c5: Ship an `agent-ui` skill for coding agents that build with Agent UI. Install it with `npx skills add kind-ui/agent-ui --skill agent-ui`, or read it from the package at `node_modules/@kind-ui/agent-ui/skills/agent-ui/SKILL.md`. It covers choosing from all 56 components, installing them in each framework layer, composing a chat, tool approvals and the sidebar shell, mapping AI SDK messages, exposing actions to agents, asking the person before risky actions, and theming. The registry's setup `AGENTS.md`, the README and Get Started now point at it.
- 56a1e10: Registry items now import their sibling files without an extension (`./markdown` rather than `./markdown.js`), so a default Next.js app built with Turbopack can build components such as `composer`, `tool` and `markdown` once installed. The npm package is unchanged.

## 0.7.1

### Patch Changes

- 03352ff: Read each docs example's framework files from the docs app, not the working directory, so sites that mount these docs find them.
- bcb1656: Describe the package for npm search: a clearer description, keywords, and the docs site as its homepage. Internal registry items now have a title, a description and the `internal` category, so `shadcn search` no longer lists them blank.
- af82509: Text fields never show a focus ring, even when a page's own stylesheet sets a global `:focus-visible` outline: the composer's editor, the search fields, Thread List's rename field, Share Dialog's link and the reason boxes now keep only their caret. In forced colors they show where focus is, as Tailwind's `outline-hidden` does.

## 0.7.0

### Minor Changes

- 645608d: Vue, Svelte and Solid layers: every component, and the internal wrappers they compose, now ships as `@kind-ui` registry items for three more frameworks beside React and Web Components, rendering the same primitives with the same parts, options, state, events, agent actions, accessibility, motion and tokens.
  
  - Items are `<component>-vue`, `<component>-svelte` and `<component>-solid` (for example `@kind-ui/composer-vue`), each pinning `@kind-ui/agent-ui`, `@ui-sdk/core` and `@ui-sdk/vue`, `@ui-sdk/svelte` or `@ui-sdk/solid` at the same versions as the React and Web items. The pinned shadcn CLI installs them into a Vite app with a hand-written `components.json`; the docs show one.
  - Framework floors are UI SDK's: Vue 3.5 (Composition API), Svelte 5.33 with runes, and Solid 2 (`solid-js` and `@solidjs/web`). Solid 1 isn't supported.
  - Part and option names match React's. Controlled props and callbacks are spelled as each framework expects (`v-model:open` and `@open-change` in Vue, `bind:open` in Svelte, `open` and `onOpenChange` in Solid), composition goes through Vue's `#render` slot, Svelte's `render` snippet and Solid's `render` prop, and each docs page's API reference has a table of the spellings.
  - Agents connect with `createAgent` from `@ui-sdk/vue/agent`, `@ui-sdk/svelte/agent` or `@ui-sdk/solid/agent`.
  - The docs show every example in React, Vue, Svelte and Solid tabs, with install tabs for every layer and a new Agents page.
  - The npm package's exports are unchanged, and it still depends on no framework: the new layers ship only through the registry.

## 0.6.1

### Patch Changes

- 53608d6: Fix the Inline Citation docs link to Sources, which pointed at a missing page on sites that mount these docs.

## 0.6.0

### Minor Changes

- 78f2e43: Wave 6: Thread List, Thread Search, Sidebar, Day Separator, Connection Status, Share Dialog and Conversation Search, in React and Web Components, with their `@kind-ui` registry items and the new `internal-resizable` and `internal-drawer`. Message gains its author, time and duration, and an outcome for stopped and failed answers; Conversation gains loading, error and empty states and search marks.
  
  - `./core` exports the new primitives and their helpers and constants: `threadListPrimitive`, `threadListRows`, `threadSearchPrimitive`, `sidebarPrimitive`, `daySeparatorPrimitive`, `connectionStatusPrimitive`, `connectionStatusText`, `shareDialogPrimitive`, `SHARE_VISIBILITY_OPTIONS`, `SHARE_DIALOG_DESCRIPTIONS`, `conversationSearchPrimitive`, `searchText`, `findMatches` and `messageOutcomeText`. The package root adds the `Thread` and `MessageAuthor` types, and `Message` gains optional `author` and `error` (`{ message }`).
  - `./core` adds date helpers over `Intl`: `dayKey`, `isSameDay`, `dayLabel`, `timeLabel`, `durationLabel` ("4 sec", "1 min 12 sec"), `isContinuation`, `dateGroup` and `todayKey`, plus `threadGroups`, which puts pinned threads first, then the host's `group`s, then date groups (Today, Yesterday, Previous 7 days, Previous 30 days, each month this year, then each year). `dayLabel`, `timeLabel`, `dateGroup` and `threadGroups` take `locale`, `timeZone` (English and UTC by default) and the `now` to read from, so a server and a browser agree; `dayKey`, `isSameDay` and `todayKey` take a `timeZone`, and `durationLabel` a `locale`.
  - Thread List is a `nav` of past chats with one Tab stop: a grid of each thread's link and More button, grouped by `threadGroups` and always virtualized. One menu serves every row (Rename in place, Pin or Unpin, Share, Delete, each present with its callback), and Delete asks first in a dialog whose Delete always needs a person for an agent (`confirmDelete: false` skips it). Load more runs through `hasMore`, `status` and `onLoadMore`. Pass `now`, so server markup groups as the browser does. Its callbacks take one value and their details: `onRename(id, { title })`, `onPinChange(id, { pinned })`, `onNew(details)` and `onLoadMore(details)`.
  - Thread Search is a "Search chats" button that opens a dialog of threads, grouped as Thread List groups them, with "New chat" (`onNew(query, details)`). Choosing a thread calls `onSelect(id, details)` and closes it. While the search is empty it lists the newest 20 threads. Pass `filter={false}` and `status` to search on a server. It has no keys until you pass `shortcut`.
  - Sidebar puts a panel beside the page on UI SDK Resizable, which people resize and collapse, and turns it into a modal UI SDK Drawer under `overlayBelow` (`"(max-width: 767px)"` by default). `onOpenChange` reasons include `"handle"`, `"drag"` and `"breakpoint"`, which crossing `overlayBelow` reports. `storageKey` saves the layout, and `shortcut` (none by default) opens and closes the panel. On Web Components, the element moves the host's panel and inset into UI SDK's elements, so a `<kind-sidebar>` rendered by React isn't supported.
  - Day Separator is a heading (`level`, 3 by default) holding a `<time>` that reads Today, Yesterday or a weekday in the browser, and the date in server markup.
  - Connection Status is a pill over a Conversation for `connecting`, `reconnecting` (counting down to `retryAt`), `offline` and `resuming`. It takes no room, announces "Connection lost" and "Reconnected" once each, and offers Retry with `onRetry`.
  - Share Dialog chooses who can open a chat (Only you, Anyone with the link), asks the host for a link with `onCreateLink`, copies it, and stops sharing with `onRevoke`. It never builds a URL, and while `agentConfirm` is on (the default) every agent action on it needs a person.
  - Conversation Search is a find bar over a Conversation that also reaches the messages a virtualized one hasn't rendered. It reads each message's Markdown as it renders, paints matches with the CSS Custom Highlight API (`::highlight(kind-search)`, `::highlight(kind-search-current)`), and reports where they are through `onMarksChange`. It has no keys until you pass `shortcut`.
  - Message takes `author`, `continued`, `createdAt`, `durationSeconds`, `now`, `locale` and `timeZone`, shown in new `header`, `author`, `time` and `duration` parts, and `MessageAvatar` shows the author's image or initials when you give it no children. A message with status `"aborted"` shows "Stopped" and one with `"error"` shows its `error` option's words, in an `outcome` part with Continue (`onContinue`) and Retry (`onRetry`); each is announced once, and agents get `continue` and `retry`. Its state adds `outcome`, `outcomePending` and `errorText`: the error's words are `errorText`, not `error`, because agents read any `error` in state as a failed action. A Message without the new options renders 0.5's markup.
  - Conversation takes `status` (`"ready"`, `"loading"` or `"error"`), `error` and `onRetry`. Loading shows a skeleton and a hidden "Loading conversation" status, and an error shows its words and Retry, both in the rows' place; agents get `retry`. Its state's `error` is set only while `status` is `"error"`, so agents don't read a conversation that recovered as failed. The empty part shows only while `"ready"` and adds `empty-title` and `empty-description` parts. `marks` (message indexes) draws search marks beside the scrollbar in the new `marks` part, and the controller adds `scrollToIndex`, `rowElement` and `observe`.
  - Connection Status keeps its width while its countdown runs: the default words pad a lost digit with a figure space, and a host's own words get no padding.
  - When a focused part leaves, focus recovery now finds the next tab stop through open shadow roots and slots, and from inside an inert ancestor.
  - Message's relative day rolls over at midnight, on the same one-minute clock Day Separator reads.
  - Sidebar's resize handle and drawer backdrop carry `data-agent-hidden`, so an open Sidebar is one agent snapshot entry, without its Resizable or Drawer.
  - The AI SDK adapter's `fromUIMessages(messages, { status, error })` gives the chat's error to the last message, typed as the new `UIChatState`. Passing the status alone still works.
  - Picker's base, `pickerBase`, takes `popup: "dialog"`, `select`, `search`, `emptyItems` and `actions` config for Thread Search, and bundles UI SDK's dialog preset, so Picker and Model Selector grow by about 1.4 KB gzip. React `pickerParts` takes `{ icon, trailing }` and web `pickerElements` a config as their third argument. The Composer, and the Wave 5 controls inside it, are unchanged.
  - New Web Components events, renamed where a native or inner UI SDK event takes the plain name:
    - Thread List: `threadselect`, `threadnew`, `threadrename`, `pinchange`, `threadshare`, `threaddelete`, `loadmore` and `openchange`, offered by `can-select`, `can-new`, `can-rename`, `can-pin`, `can-share`, `can-delete` and `can-load-more`.
    - Thread Search: `threadselect`, `threadnew` (with the search text), `threadquerychange` and `openchange`, offered by `can-select` and `can-new`.
    - Sidebar: `openchange`.
    - Connection Status: `connectionretry`, offered by `can-retry`.
    - Share Dialog: `sharevisibilitychange`, `createlink` (`can-create-link`), `revoke` (`can-revoke`), `linkcopy` and `openchange`.
    - Conversation Search: `querychange`, `openchange` and `markschange` (`detail.value`, for the Conversation's `marks` property).
    - Message: `retry` (`can-retry`) and `continue` (`can-continue`).
    - Conversation: `retry` (`can-retry`).
  - **Breaking (types):** Conversation's `api.enterRow(el, index)` is now `api.bindRow(el, index)`, which returns its cleanup; only a render file of your own that binds rows calls it. `PickerOpenChangeReason` adds UI SDK Dialog's reasons, so an exhaustive `switch` over it needs their cases.
- c718d82: Chat core on the shared design system.
  
  - Editing a user message keeps the bubble's place, shape and type, and shows **Cancel** and **Save** in place of the toolbar. Tab moves from the text to them without saving, and focus returns to Edit afterwards. React `MessageEditor` renders the new `MessageEditActions` (`MessageEditCancel`, `MessageEditSave`) after the text area unless you pass children; on Web Components an editor gets a `kind-message-edit-actions` after it unless you write one.
  - A message that isn't the last shows its toolbar on hover or while focus is inside it; the last message, every message on a touch screen, and any branch switcher always show.
  - The user bubble is the `--kind-color-bubble` fill with `--kind-bubble-radius` and `--kind-bubble-padding` at the body size (16/24); the branch arrows are shared icon buttons.
  - Message's Retry and Continue, Conversation's Retry and jump control, and the Composer's Discard are shared buttons (`data-kind-button`). Conversation's error shows a status mark in a new `error-icon` part (`ConversationErrorIcon`), then its words and Retry on one line, as a failed message does. Its empty title is `--kind-text-2xl`.
  - Conversation's loading skeleton draws a user's bubble, an answer's lines of text (no bubble), then another bubble, and no longer pulses.
  - Suggestion takes `layout="wrap"`, which wraps its chips onto more lines without a Carousel, for an empty conversation's starter prompts. Every chip is the shared soft pill (`data-kind-button="soft"`, a size up when wrapped), with a description after its label on the same line. React adds `SuggestionChip` (`SuggestionChipProps`), which `SuggestionItem` now wraps in its Carousel slide.
  - The Composer is a raised slab with `--kind-composer-radius` and `--kind-shadow-composer` and no border; focus changes nothing on it, and dragging files turns its hairline to the accent. Its editor is the body size, Attach, Send and Stop are 36px circles, and Send is the ink primary, faded while there's nothing to send. While Dictation listens in a Composer whose controls wrap, its Cancel, status and Stop sit on the actions row's last line beside Send.
  - Markdown sets body text at the body size (16/24 by default, through `--kind-markdown-font-size`, `--kind-markdown-line-height` and the new `--kind-markdown-tracking`), h3 at 1.125em, h4 to h6 in the muted color, inline code on a tint of the text rather than the hover fill, and a blockquote's text in the text color.
  - Streaming Text's caret is a 2px bar at 60% of the text color, and holds still.
- 82b00d8: Composer controls and menus on the shared system: one ghost trigger, one popup surface and a menu label column.
  
  - Add Menu, Settings Menu, Approval Mode, Model Control, Picker, Model Selector and Context Meter triggers are the shared `data-kind-trigger`: ghost, 32px, filled while open. Their popups are `data-kind-popup`. Menu group labels and plain rows like "More models" start at the item text's column.
  - Model Control lists the models and effort levels in its menu itself, with no Model or Effort submenus: choosing either takes one press after opening, and the menu stays open. The host's choices follow, then its toggles. A model without effort levels keeps the Effort section, every level dimmed. Its `getItems()` data has a group, not a submenu, for each.
  - Approval Mode marks a risky mode once: "Risky" in the danger color, with the label in the text color and no warning mark in the row (the trigger keeps its mark). Learn more moves after the modes, behind a separator, so opening the menu with a key lands on the first mode.
  - Picker and Model Selector triggers size to their label: `--kind-picker-trigger-width` and `--kind-model-selector-width` now set the widest width (14rem by default), not a fixed one. In a composer under 28rem, a Model Selector whose model has an icon shows only the icon. A disabled row keeps its reason readable, and the default placeholders are "Search…" and "Search models…".
  - Reasoning Effort shows its chosen level before UI SDK measures it, and its levels read at 14px.
  - Context Bar chips and "+N" are filled, without a border; an overflow row's remove button shows on hover and focus, and always on touch screens.
  - Context Meter's ring has a visible track, so a part-full meter reads as a gauge, and its description shows only the counts ("57,600 of 128,000 tokens"): its render function gets `countText` instead of `valueText`.
  - Feedback's comment box asks "What went well…" after a thumbs up and "What could be better…" after a thumbs down. The box's title is visually hidden, still naming it, and the text box is named "Comment". `FeedbackCommentText`'s render function receives `placeholder` and `aria-label`.
  - Dictation's Stop is filled with the text color everywhere, its Start, Stop and Cancel are ghost icon buttons, and under reduced motion only the newest 16 bars hold still over the dotted baseline.
- 947a53a: Developer output on the shared design system: Terminal, Stack Trace, Test Results, File Tree, Document, Generated Image, Transcript, Selection, Sources, Inline Citation, Code Block and Markdown Table draw with the shared code surface, buttons, icon buttons, badges and popup.
  
  - **Breaking (Test Results):** the filter is the header's counts, each a toggle button (React `TestResultsCount`, web `kind-test-results-count`) that shows only its tests and, pressed again, every test; the Segmented Control is gone. `TestResultsFilterState` is replaced by `TestResultsCountState`, `onFilterChange` reports `"item-press"` rather than `"input-change"`, and `TestResultsApi` swaps `readFilter`, `syncFilter` and `filterState` for `pressCount`.
  - **Breaking (Sources):** `SourceEntry.initial` and the icon part's `initial` state are gone. Without a favicon the icon shows a link glyph rather than the site's initial.
  - Inline Citation's card adds an `icon` part (React `InlineCitationIcon`, web `kind-inline-citation-icon`) and lists the title before the host, as Sources does.
  - Terminal no longer shows a cursor once the command finishes, reads "exit N" beside the duration rather than an "Exit N" pill, and shows the `$ command` line only when a `label` replaces the command as the title. Lines are measured at their own index, so a narrow screen no longer leaves a gap.
  - Test Results shows one mark per row: a failed test's Stack Trace drops its own mark. Test names wrap to two lines.
  - Document's header keeps its title on a narrow screen, showing Download as an icon; the icon tile is gone, Show more is a text button, and a table inside has row rules only. A Download button's label sits in a `data-document-download-label` span.
  - Markdown Table's Copy floats over the header's end on hover or focus, so the last header lines up with its column. Code Block and Markdown Table fade the edge where lines are cut.
  - Transcript marks the playing segment with its bar and words, not a tint, its search field has no box, and its text sits on a 20px line. Stack Trace's library frames toggle reads as words, not italic code, and locations end in an ellipsis rather than breaking.
- 7afa5ab: Indicators, notices and files say each fact once.
  
  - Loader, Thinking Indicator and Typing Indicator draw the same dots, sized by the new `--kind-dot-size` token (5px; they were 6, 4 and 7px), always before the label. Thinking Indicator's dots now come before its label in the markup too.
  - Breaking: Typing Indicator has no bubble: it no longer draws the user message's fill and radius around an assistant reply, so the dots sit where the reply's first line starts. Set your own background on `[data-slot="kind-typing-indicator"]` to keep one.
  - Breaking: the default labels, and so the accessible names, are "Loading…" and "Thinking…" (were "Loading" and "Thinking").
  - Status is its mark and its words, without the tinted pill and border.
  - A status mark waiting on the person (`awaiting-input`) pulses three times, then holds still, rather than looping until answered.
  - Notice: info and success notices are a plain bordered surface whose mark carries the color; warning and error take the `--kind-tint-fill` tint in place of a tinted border. Dismiss is the shared 28px icon button, with a 44px hit area under a coarse pointer.
  - Attachments and Uploader: an error shows a red mark beside plain words, without a red border, tile or text. File glyphs sit bare, without a tile, and the dropzone's upload glyph without its circle.
  - File sizes under 1 kB read "812 bytes", not "812 byte".
  - Attachments and Uploader show a glyph for a file's kind (image, document, code, spreadsheet, archive, audio or video), from `mediaType` or the extension, through `data-file-kind`; `UploadItem` takes an optional `mediaType`. An attachment chip reads its extension beside its size ("PDF · 482 kB").
  - Notices, attachment chips and upload rows sit on the raised surface with a hairline instead of a 1px border. A finished upload's bar fades out in place.
  - Uploader keeps its action column on every row, so every bar ends at the same place; a finished row drops its bar and reads "3.1 MB · Uploaded"; a failed or cancelled bar stops in gray. Cancel and Retry are the shared icon button.
- b054972: Design system foundation: shared tokens and controls every component can draw on.
  
  - New tokens: a type scale (`--kind-text-xs`, `-sm`, `-md`, `-lg`, `-xl`), which every stylesheet now sizes its text from; state colors (`--kind-color-selected`, `--kind-color-current`, `--kind-color-bubble`, `--kind-color-scrim`, `--kind-color-accent-hover`); one focus ring (`--kind-focus-ring`, `--kind-focus-ring-width`, `--kind-focus-offset`, `--kind-focus-offset-inset`); a radius scale (`--kind-radius-sm`, `-md`, `-lg`); and `--kind-control-height`, `--kind-trigger-height`, `--kind-badge-height`, `--kind-hit-area`, `--kind-popup-radius`, `--kind-shadow-popover`, `--kind-dialog-radius`, `--kind-dialog-top`, `--kind-shadow-dialog`, `--kind-tint-fill`, `--kind-tint-border` and the code surface tokens (`--kind-code-surface`, `--kind-code-radius`, `--kind-code-font-size`, `--kind-code-line-height`).
  - `styles.css` adds shared control styles keyed on `data-kind-button` (ghost, `secondary`, `primary`, `danger`), `data-kind-icon-button`, `data-kind-trigger`, `data-kind-badge`, `data-kind-popup`, `data-kind-dialog`, `data-kind-dialog-title`, `data-kind-scrim` and `data-kind-code`, with a 44px hit area under a coarse pointer.
  - Every focus ring is 2px of `--kind-color-focus`, at least 3:1 on every fill. Step, item, Queue and Stack Trace rows drew a 1.5px ring at half strength (1.9:1), and the internal Switch and Segmented Control drew none.
  - The light `--kind-color-warning` is darker (3.8:1 on the surface, was 2.6:1), and a pending status mark's dashed ring reaches 3:1.
  - `--kind-color-accent` is a touch darker in light and lighter in dark, so accent text reads at 4.5:1 on a selected or current row too.
  - Menu and list rows highlight with `--kind-color-selected` rather than the hover fill; internal menus, pickers' lists and tooltips share one popup radius and shadow, dialogs one radius, shadow, title size and scrim, and a sheet's backdrop shows in dark.
  - The internal Button, Menu trigger, Toggle, Toolbar buttons and Carousel arrows are ghost controls of the shared heights; a pressed internal Toggle fills with `--kind-color-selected` instead of inverting.
  - Running Step-based titles and the Thinking Indicator's label no longer shimmer: the status mark and the dots are the only loops, and `kind-shimmer` is gone.
  - Generated Image no longer draws a moving field, grain or noise dissolve while it works: a flat placeholder, then the preview sharpening with progress, and the image fades in over 200 ms. Its corner label is a solid chip, without `backdrop-filter`.
  - A pointer open of a `menuBase` menu (Add Menu, Settings Menu, Approval Mode, Model Control, Message's regenerate menu) on Web Components no longer highlights the first item, as in React; a keyboard open still does.
  - Pill controls, soft elevation and quiet motion: shared buttons, icon buttons, triggers, chips and badges are pills (`--kind-radius-full`) on a 28/32/36 ladder (`--kind-control-height-sm`, `--kind-control-height`, now 32px, `--kind-control-height-lg`; `data-kind-size`); corners nest concentrically (rows 10, popups 16 with 6px padding, cards 14, the user bubble 22, dialogs 24, the composer 28); popups, dialogs and tooltips sit on `--kind-color-raised` with a hairline in their shadow and no border, and scale in from 0.96 on `--kind-ease-enter`; the scrim blurs. New: `--kind-color-canvas`, `-raised`, `-hairline`, `-pressed`, `-primary`, `-primary-hover`, `-primary-fg`, `-focus`, `--kind-font-sans`, `--kind-font-weight-*`, `--kind-text-body`, `--kind-text-2xl` and each size's `-leading` and `-tracking`, `--kind-radius-full`, `--kind-composer-radius`, `--kind-bubble-radius`, `--kind-bubble-padding`, `--kind-popup-padding`, `--kind-shadow-control`, `--kind-shadow-composer`, `--kind-scrim-blur`, `--kind-material-*`, `--kind-icon-size*`, `--kind-row-height`, `--kind-list-row-height`, `--kind-chat-max-width`, and the motion tokens `--kind-ease-enter`, `-exit`, `-in-out`, `-spring`, `--kind-duration-instant`, `-exit`, `-spring`, `--kind-press-scale`, `--kind-enter-scale` and `--kind-dialog-enter-scale`. Shared buttons gain `soft` and `danger-ghost`, and `primary` is an ink pill that inverts in dark.
  - Hover, pressed, selected and current fills and the border are translucent ink, so they read on any surface; `current` has no blue tint. Dark surfaces are neutral gray.
  - Focus rings show only for the keyboard (`:focus-visible`), in neutral ink, inside rows, chips and scrollers; text fields, the composer included, show none and no longer change their border or glow on focus.
  - A pending shared button keeps its exact width: its label stays in the layout, drawn clear, and its running mark sits centered over it.
  - Shared controls fade to `--kind-disabled-opacity` (0.64) when disabled, as the internal wrappers now do; icons sit 2px closer to a pill's edge and read muted on ghost controls until hover; a filled pill carries a soft top highlight at rest and a slight inner shade while pressed.
  - Under reduced motion, every shared popup and dialog only fades as it enters and leaves; the entering and leaving scales no longer outrank the reset.

## 0.5.0

### Minor Changes

- 72c25a5: Wave 5: Picker, Add Menu, Settings Menu, Approval Mode, Model Control, Context Bar and Dictation, in React and Web Components, with their `@kind-ui` registry items. Model Selector moves onto Picker, Message gains a regenerate-with menu, and the Composer restores drafts and fits narrow screens.
  
  - Every Wave 5 popup takes `presentation`: `"auto"` (the default) is a bottom sheet on small touch screens and a popover elsewhere.
  - `./core` exports the new primitives and their bases, helpers and constants, including `pickerBase`, `pickerPages`, `menuBase`, `menuItems`, `settingsBase`, `addMenuSections`, `approvalModeName`, `approvalModeRows`, `modelEffort`, `fitChips`, `hearComposed` and `createSpeechDictation`, and the package root adds the `PickerItem`, `PickerAction`, `MenuEntry`, `SettingsEntry`, `SettingsToggle`, `SettingsChoice`, `SettingsOption`, `SettingsValues`, `ApprovalModeOption`, `EffortLevel`, `ContextChip` and `RegenerateOption` types. `ModelOption` gains `efforts`, the effort levels a model supports.
  - Model Control is a button reading "GPT-5 · High" that opens a settings menu: Model and Effort are radio submenus, beside the host's own toggles and choices. Its trigger is named "Model, <model>, <level> effort". When a model doesn't support the chosen effort, it uses `modelEffort(levels, model, effort)`, the highest supported level at or below it, else the lowest, and reports the change with reason `"model-change"`.
  - Dictation runs a `DictationSource` the host passes as `source`; `createSpeechDictation` makes one from the browser's speech recognition. Without a `source` it shows no mic button. Its waveform keeps `bars` levels, one bar each with the newest at the end (1 to 256, default 128), cuts the bars that don't fit at the start, and holds its last levels while transcribing.
  - Message takes `regenerateOptions`: Regenerate then opens a menu whose first row is "Try again". `onRegenerate(text, details)` gains `details.optionId`, the option chosen (`undefined` for a plain regenerate or "Try again"), and the Web Components `regenerate` event carries it as `detail.optionId`. Its reasons add `"item-press"`, for a row of the menu, and an agent can choose an option by its label. Hosts written for 0.4 keep working.
  - Composer takes `draftKey` and `draftStorage` (UI SDK's `createLocalStorage` or `createSessionStorage`) to save an uncontrolled draft per conversation and restore it on the next mount, with "Draft restored" and Discard. Its change reasons add `"restore"` and `"discard-press"`, and an agent can `discardDraft`. A controlled `value` never reads or writes storage.
  - Composer has a `context` row above the editor, where a Context Bar placed as its direct child sits, and a direct-child Dictation is a mic icon just before Send. While it listens and transcribes, its waveform takes the editor's place, Cancel the controls', its status the middle of the actions row and Stop sits beside Send, and the box keeps its size. When it stops, its text goes to the end of the draft unless `onText` cancels `details`, through the new api method `appendText(text, source?)` (also on `<kind-composer>`'s `api`), with the new change reason `"dictation"` and the source of the press that stopped it. Below a width of 28rem (a container query on the composer, named `kind-composer`), Model Control and Approval Mode show only their icons (a model without one keeps its name). The composer is now an inline-size container, so one inside a shrink-to-fit parent, like a centered flex column or a flex row, needs a width.
  - Controls placed inside a Composer, like Model Control, Approval Mode or Dictation, take the composer's `data-agent-confirm`: while the composer's `agentConfirm` is on (the default), an agent's action on any of them needs a person too.
  - Question names each radio group by its prompt.
  - Dictation's `error` is `undefined` when there's no error, so an agent doesn't read an idle Dictation as a failed action.
  - Every primitive renders on a server: none reads `document` or cancels an animation frame it didn't schedule.
  - `--kind-color-danger`'s light value darkens from `oklch(0.58 0.21 27)` to `oklch(0.55 0.21 27)`, so danger text meets AA contrast on `--kind-color-hover`.
  - **Breaking:** Model Selector is built on Picker. Its search field beside a button becomes a button whose list holds the search, so its markup and parts change; the Model Selector page's "Changes in 0.5" lists every part. Update copied files along with the package with `npx shadcn@latest add @kind-ui/model-selector --overwrite` (or `@kind-ui/model-selector-web`). Then:
    - Styles hook onto Picker's `data-picker-*` attributes and `--kind-picker-*` variables. `data-model-selector-field` is gone; `--kind-model-selector-width` still sets the button's width.
    - A person's choice reaches `onValueChange` with the reason `"item-press"`, not `"input-change"`.
    - `openLabel` is gone, and the empty text is the new `emptyText` option.
    - On Web Components, set `el.value` instead of calling `el.api.setValue`.
    - A model's `id` must not start with `group:`, which `pages: "groups"` uses for its provider rows.
    - The `internal-combobox` registry item is gone.
  - **Breaking (types):** from `./core`, `filterModels`, `ModelGroup`, `ModelSelectorComboboxState`, `ModelSelectorContentState` and `ModelSelectorItem` are gone, and so are Model Selector's api methods `getModels`, `read`, `search`, `follow`, `syncValue`, `comboboxState` and `contentState`. Its `api.setValue` is offered only while it's enabled, so it's typed `undefined` otherwise: call `api.setValue?.(id)`. Its state's `models` is now `items`, as Picker's is.
  - **Breaking (types):** Message's `api.regenerate` takes an option id first: `api.regenerate(optionId?, event?)`, where 0.4 had `api.regenerate(event?)`. Code that passed an event passes `undefined` before it. Agents' existing calls and the render files are unaffected.

## 0.4.0

### Minor Changes

- 2ec5574: Wave 4: Sources, Inline Citation, Document, Generated Image, File Tree, Terminal, Stack Trace, Test Results, Transcript, Selection and Action, in React and Web Components, with their `@kind-ui` registry items.
  
  - New dependencies: `ansi-sequence-parser` (Terminal's colors) and `stacktrace-parser` (Stack Trace's frames).
  - `./core` exports the new primitives and their helpers (`createAnsiLines`, `parseStack`, `isLibraryFrame`, `pathItems`, `treeValues`, `documentSize`, `testCounts`, `testItems`, `testValue`, `emptyTestsText`, `currentAt` and `searchSegments`), and the package root adds the `FileTreeEntry`, `StackFrame`, `TranscriptSegment`, `TranscriptWord` and `SelectionActionItem` types. `Source` gains an optional `favicon`.
  - Model Selector takes an `icon` per model, shown before its name in the list and in the field: an image URL, or on React an element and on Web Components an element it clones. `ModelOption` takes the icon's type as a parameter (`ModelOption<Icon = string>`), and the list now opens against the whole field.
  - **Breaking:** Model Selector's `contentState` takes the content's instance id, and the render files use a new Combobox item icon. Update copied files along with the package with `npx shadcn@latest add @kind-ui/model-selector --overwrite` (or `@kind-ui/model-selector-web`): until then the React file doesn't compile and the web element throws when it renders.
  - **Breaking (types):** `ModelSelectorOptions`, `ModelSelectorState`, `getModels()` and `ModelSelectorItem` in `./core` use `ModelOption<unknown>`, since core passes icons through untouched, so code that typed them as `ModelOption[]` takes `ModelOption<unknown>[]`. `ModelSelectorContentState` gains `anchor`.
  - Status marks keep their glyph centered at any size and device pixel ratio. Resize a mark with the new `--kind-status-mark-size` (default `16px`, even pixels), set on the mark or any ancestor, rather than `width` and `height`.
  - New `--kind-ansi-*` tokens for the 16 named terminal colors.
  - Queue asks `onRemove` once per item: a host that keeps an item after a failed removal passes a new object for it to allow another try.
  - A Task, Plan or Queue item that's removed and added again plays its entrance again.
  - Step-based components and Guardrail Notice return focus to their own trigger when their content closes with focus inside.
  - Icon buttons and file icons show in forced colors, in Message, Tool, Queue, Checkpoint, Code Block, Markdown Table, Conversation, Composer, Attachments, Uploader and Context Meter.

## 0.3.1

### Patch Changes

- 34c8f20: The docs link between pages and import their examples with relative paths, so kindui.dev can render them from the release tag, and the release's namespace check treats a kindui.dev registry that isn't served yet as empty.

## 0.3.0

### Minor Changes

- 803ea14: Wave 3: Confirmation, Question, Checkpoint, Model Selector, Reasoning Effort, Suggestion, Context Meter, Feedback, Notice and Guardrail Notice, in React and Web Components, with their `@kind-ui` registry items.
  
  - Tool asks for approval through Confirmation: pass `onApprove` and `onDeny` (on Web Components, the `can-approve` and `can-deny` attributes and the `approve` and `deny` events) to offer **Approve** and **Deny**, and `approvalReason` for a reason box. Once the host records the decision, the tool keeps the outcome, like "Approved", not the buttons. Its approval part now sits after the content, so it shows while the tool is closed.
  
    **Breaking:** `ToolState.approval` is now the whole `Approval`, not its state, and `ToolState.approvalLabel` is gone (use `approvalLabel(state.approval)`). `ToolApproval` renders a Confirmation, and a render function passed to it gets the Confirmation's props, whose `label` reads "Run <name>?".
  - Confirmation, Question, Checkpoint and Feedback lock on `createPendingAction` (exported since 0.2.1, and shared with Plan's Accept and Subagent's Stop): a press disables the choices at once, a rejection makes them available again with an error, and a late result for a replaced request changes nothing.
  - Wave 3 callbacks get a `details` whose `source` says who acted, like `"mouse"`, `"keyboard"` or `"agent"`, after the value when they have one: `onApprove(decision, details)`, `onRestore(details)`. Notice's `onDismiss` takes no arguments.
  - New `--kind-color-on-warning` token for marks on the warning fill, and `info` and `warning` status marks.
  - Step, Task, Plan and Chain of Thought rows no longer play their transitions when the page loads on Web Components.
  - The size check also budgets single exports of `./core`, so a component that stops tree-shaking fails it.

## 0.2.1

### Patch Changes

- 74b5748: - Every React render file starts with `"use client"`, so Next.js App Router server components can import them.
  - The composer's attachments area expands and collapses instead of jumping open and shut.
  - Removing the last attachment returns focus to the editor. Attachments takes a `focusFallback` option for where focus goes when no chip is left.
  - Motion helper springs start at rest, so a reversed `expand` no longer overshoots.

## 0.2.0

### Minor Changes

- c1e394a: Wave 2: Status, Reasoning, Tool, Chain of Thought, Task, Plan, Subagent and Queue, in React and Web Components, with their `@kind-ui` registry items.
  
  - Reasoning, Tool, Chain of Thought, Task, Plan and Subagent share the Step base, so they open, close, announce and animate the way Step does.
  - Queue reorders items with the pointer or the keyboard. The host owns the order: `onReorder(id, details)` gets the new position as `details.index` (on Web Components, the `reorder` event's `detail.value` and `detail.index`).
  - Subagent's avatar shows `avatarInitials(name)` when it has no image.
  - Attachments and Uploader animate removed items out, and focus moves to a neighbor while they leave.
  
  **Breaking:** Step's `title` option is now `label` (the `label` attribute on Web Components), because `title` shows the browser's tooltip on a custom element. It still names the step in announcements.

## 0.1.0

### Minor Changes

- 22e23d2: Wave 1: Step and Step List, Conversation, Message, Markdown with Code Block and Markdown Table, Composer with Attachments, Uploader, Loader, Thinking Indicator, Typing Indicator and Streaming Text, in React and Web Components, plus the AI SDK adapter, theme tokens and the `@kind-ui` registry items.
