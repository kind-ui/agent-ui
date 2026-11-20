# @kind-ui/agent-ui

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
