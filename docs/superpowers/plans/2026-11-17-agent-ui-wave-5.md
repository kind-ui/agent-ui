# `@kind-ui/agent-ui` Wave 5 (0.5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Each task is one session and one stacked PR: Task 1 stacks on this plan's PR, and each later task stacks on the one before.

**Goal:** Ship Wave 5, "composer controls": Picker, Add Menu, Settings Menu, Approval Mode, Effort Slider, Model Control, Context Bar, Dictation and Prompt Library, plus Model Selector rebuilt on Picker, Message's regenerate-with menu, and the Composer's draft restore and narrow-screen layout, in React and Web Components, with registry items, docs pages and the 0.5.0 changeset.

**Architecture:** Every Wave 5 component is one `definePrimitive` that composes UI SDK as Waves 1–4 do. Popups are the primitive's own through `createPopup`, as Context Meter's are, so `open`/`onOpenChange` reach a web host; what sits inside them is a ready-made UI SDK component (Command, Menu, Slider) driven through a controller the primitive owns. One new core module hears those components' web events (D1), so no component needs the "wrap ours" seam to learn what a person chose. The four menus share one `menuBase` over UI SDK Menu, as the Step-based components share `stepBase`. Picker is a public base the way `stepPrimitive` is: Model Selector, Model Control and Prompt Library spread `pickerBase`.

**Tech Stack:** `@ui-sdk/core`, `@ui-sdk/react` and `@ui-sdk/web` stay at `0.1.0-beta.1`, `motion` at `14.14.0`. No new runtime dependency: dictation uses the browser's Web Speech API, `getUserMedia` and Web Audio's `AnalyserNode` (D10), and draft restore uses UI SDK's `createLocalStorage` (D12).

**Spec:** `docs/superpowers/specs/2026-11-14-agent-ui-design.md`: §1, §2 "Building on UI SDK" and "Internal general components", §4.1, §6 Motion and Agent actions, §7 Wave 5, §8, §9.1, §10. This plan's PR writes the decisions into the spec as recommended; a decision the user changes is rewritten there by Task 1 before any component starts. Also read `AGENTS.md` ("UI SDK API notes", Verification policy, the streaming UX checklist) and `.agents/experts/*/decisions.md`.

## Decisions

Proposed 2026-11-17. **Open** marks a decision that needs the user's answer before Task 1 merges; the rest follow from earlier waves' rules.

- **D1. Hearing composed UI SDK components on Web Components (Open).** Every `@ui-sdk/web` component reports changes and actions only as events on its own element that don't bubble (`action` on `ui-menu` and `ui-command`, `checkedchange`, `valuechange` on `ui-slider` and `ui-menu-radio-group`). Waves 3 and 4 worked around it by reading a controller as a `click` or `keyup` bubbled past (the "wrap ours" seam), which misses Menu's Enter (it activates on `keydown`, with no click) and left File Tree's `onSelect` and Inline Citation's page count as known gaps. A non-bubbling event still passes its ancestors in the capture phase, which is how `core/file-input-events.ts` already hears File Input (spec §2 row).
  - **Recommended:** generalize that row. `core/composed-events.ts` exports `hearComposed(el, { [eventName]: handler })`, called from a slot's `bind` on web only, which listens in the capture phase for the named events whose target is a `ui-*` element inside `el` and hands their `detail` to the same handlers React gets as props through slot state. `file-input-events.ts` moves onto it. The spec §2 row becomes "Composed UI SDK component events on Web Components". React keeps passing callbacks as props.
  - **If declined:** Picker builds its list from `createListbox` (`focus: "virtual"`) instead of Command (D2), and the menus build on `createPopup` with roving focus instead of UI SDK Menu, losing Menu's submenu pointer safety and sheet presentation (D5).
- **D2. Picker is a popup holding UI SDK Command.** The primitive owns its popup through `createPopup` with `popoverPreset` and `presentation` (D13), and composes UI SDK Command inside it through a `createCommandController()`: Command gives the search field, ranked fuzzy filtering, groups, icons, match marks (`CommandItemText`), pages, pending actions, empty and status parts. The picker adds what Command lacks: a chosen `value` with a check mark, two-line rows (label and description), a trailing `meta` text, and footer `actions` as the last group in the same list, so the arrow keys reach "More models". A row with `items` opens a page of its own (Command pages: Backspace in the empty search or Escape goes back). Focus enters the search field through `initialFocus` and returns to the trigger on close through the preset: no hand-written focus. Not Combobox: Combobox has no action row and no pages, which is what stopped "More models" in Wave 4 Task 12b. Not Menu: a menu can't hold a search field.
- **D3. Picker is public; Work in, Project and Branch are recipes (Open).** Spec §1 keeps general-purpose components internal. Picker is the base of every composer picker, as `stepPrimitive` is of every step, so it is public with its own page; "Work in", "Project" and "Branch" pickers are docs examples on that page (items, icons, `meta` for a branch's ahead and behind counts, a "New branch" footer action), not components of their own.
- **D4. Model Selector moves onto Picker (Open: changes its markup).** Model Selector spreads `pickerBase`: its search-field-beside-a-button becomes a button whose popup holds the search, and it gains `actions` (a "More models" footer row) and pages (a provider row that opens its models). Its options, `ModelOption` (with 0.4.0's `icon`), `setValue` and the web `modelchange` event stay; the agent snapshot keeps one "Model" entry. The combobox role, the `ComboboxValue` field and `data-model-selector-field` go. Before 1.0 a breaking change bumps the minor version (spec §9.1), which 0.5.0 is; the changeset and the page say what changed.
- **D5. The menus compose UI SDK Menu through one `menuBase`.** Add Menu, Settings Menu, Approval Mode and Message's regenerate-with menu render the internal Menu from data the primitive builds (`MenuData`: items, groups, checkbox items, radio groups and submenus), with a `createMenuController()` the primitive owns. Choices reach the primitive through `onAction`, `onCheckedChange` and `onValueChange` (React props, web through D1). `menuBase` (`core/menu-base.ts`) holds `open`, the item lookup, `agent.items` and the action getters, as `stepBase` does. Submenu pointer safety, typeahead, Escape-closes-one-level and the sheet presentation are Menu's.
- **D6. Settings toggle rows are switch-styled checkbox items (Open).** A UI SDK Switch can't sit inside a menu item: a `menuitem` holds no interactive child, and the menu's arrow keys would skip it. Settings Menu renders each toggle as Menu's checkbox item (`menuitemcheckbox`, Space toggles and keeps the menu open through `closeOnSelect: false`) and draws its indicator with UI SDK Switch's look (`internal-switch` styles over a `SwitchThumb`-shaped `aria-hidden` mark), so a screen reader hears "checked" and sighted people see a switch. Value rows are submenus holding a radio group, showing the current value as trailing text.
- **D7. Approval Mode asks a person before an agent changes it (Open).** Approval Mode is a radio group in a menu: each mode has a label and a description, a mode marked `danger` is drawn in `--kind-color-danger` with a warning mark and the word "Risky" for assistive technology, and a header link ("Learn more") is a menu item rendered as `<a>` (Menu's "Links"), so it stays in the arrow-key order. Changing the mode widens or narrows what the agent may do without asking, so `setValue` renders `data-agent-confirm` while `agentConfirm` is on (default), as the composer does, and spec §6 lists `approvalMode.setValue`. Choosing a danger mode needs no second step from a person; a host that wants one confirms in `onValueChange` and cancels.
- **D8. Effort Slider is a popover holding UI SDK Slider.** The primitive owns its popup (`createPopup`, `popoverPreset`) and composes the internal Slider through a `createSliderController()`: `levels` (ordered `{ value, label }`) map to slider steps 0…n−1, so the stops are the levels; `aria-valuetext` is the level's label through Slider's `format`. Stops are `aria-hidden` ticks (Slider's "Step and Bounds"). A Reset button returns to `defaultLevel` and is present only while the value differs. An optional `modelLabel` with `onModelPress` (or `modelHref`) adds a link line ("Effort for GPT-5"). The top level shows Lucide's `sparkles` glyph beside its label, as a CSS mask. Reasoning Effort (Segmented Control) stays as it is.
- **D9. Model Control: one trigger, a nested popover for effort (Open: component or recipe).** The combined trigger reads "GPT-5 · High". It spreads `pickerBase` for the models and adds a footer row, "Effort · High ›", that is the trigger of a nested Effort Slider popover beside the picker (UI SDK nested popups: both stay open, Escape closes only the inner one and returns focus to the row). This is the "nested trigger popover"; Settings Menu's value rows are its menu form. Recommended as a component, since it owns two values and their shared trigger text.
- **D10. Dictation: a host-chosen source, a built-in Web Speech one (Open).** `core/dictation.ts` defines `DictationSource { start(signal): AsyncIterable<DictationEvent> }`, where an event is `{ level }` (0–1, for the waveform), `{ text, final }` or `{ error }`. `createSpeechDictation({ lang })` is the one built-in source: `SpeechRecognition` (prefixed in WebKit) for text, `getUserMedia` with an `AnalyserNode` for levels. Chrome's recognition sends audio to a speech service, so the component never has a source by default: the host passes one, and the docs show both the built-in source and a server one over `MediaRecorder`. States: `idle` (mic button), `listening` (waveform from `level`, Stop and Cancel), `transcribing` (after Stop, until the last final text), then `idle` with `onText(text)` called once. Without `SpeechRecognition`, `createSpeechDictation` reports `{ error: "unsupported" }` and the button shows its text. The capture listeners need a spec §2 row ("Dictation audio and speech"). `start` renders `data-agent-confirm`: an agent never opens the microphone without a person.
- **D11. Context Bar overflow is measured, not guessed.** Chips (`ContextChip { id, label, kind?, icon? }`) sit in one row; the `list` slot's `bind` measures it with a `ResizeObserver`, as Document measures its content, into `visibleCount`, and the rest go behind a "+N" button that opens a popover (`createPopup`) listing them, each removable. Chips are one roving Tab stop (`createListFocus`); Delete and Backspace remove the focused chip through the Attachments spec §2 row, which this task extends to Context Bar. Chip width is capped by `--kind-context-chip-max-width`, so the count depends on that cap, not on font metrics, in the budgets fixture.
- **D12. Draft restore is a Composer option over UI SDK storage.** `draftKey` (a conversation id) and `draftStorage` (UI SDK's `createLocalStorage`, `createSessionStorage` or a host `ValueStorage`) save the uncontrolled draft's text and tokens on each change and restore them when a composer mounts with that key and an empty draft. Attachments aren't saved (files don't serialize). A controlled draft is never written: the host owns it (spec §4.1). A restored draft shows a "Draft restored" status with Discard, which leaves on the next edit; submitting clears the saved draft once the submission resolves, by the same snapshot rule §4.1 sets for the field. Storage that throws (quota, private mode) is ignored.
- **D13. The narrow-screen composer is CSS and `presentation`, no new component.** The composer gets a container query: below `--kind-composer-compact-width` (28rem) the controls row wraps under the editor and labelled controls (Model Control, Approval Mode) show their icon with the name kept as their accessible name. Every Wave 5 popup takes `presentation: "auto" | "popover" | "sheet"` (default `"auto"`), which UI SDK turns into a bottom sheet on small touch screens; Menu's submenus then replace the current level. No JavaScript decides the layout.
- **D14. Prompt Library is a Picker of prompts.** It spreads `pickerBase` with `prompts: PromptTemplate[]` (`{ id, title, body, description?, group? }`), searches title, description and body (`keywords`), shows no check mark, and calls `onInsert(prompt, details)` on a choice; the docs insert `body` into the composer with `setValue`. A "Manage prompts" footer action is the host's. No prompt variables or editing in Wave 5.
- **D15. Regenerate-with is a Message option.** `regenerateOptions?: { id, label, description?, icon? }[]` turns Message's Regenerate toolbar button into a menu button (the internal Menu, through `menuBase`) whose first item is "Try again" and the rest the host's ("Add details", "More concise", "Try with another model ›" as a submenu of model names). `onRegenerate(optionId?, details)`: `undefined` for "Try again". Without `regenerateOptions`, Regenerate stays a button. Agent action `regenerate(optionId?)`, refusing an unknown id.
- **D16. No showcase (Open).** Each component page has its example, and the Composer page gains one "full composer" example with the Wave 5 controls in its actions row and at a narrow width. A showcase would replay nothing a page doesn't show: these controls have no run to script. Recommended: no showcase task.
- **D17. Version order (a note).** 0.4.0 is published (`main` reads `0.4.0`). Task 16's changeset is `minor` for 0.5.0.

## Global Constraints

- **Build on UI SDK (spec §2):**
  - Each component is one `definePrimitive` in `packages/agent-ui/src/core/<component>/`, exported as `<camelCase>Primitive` with the explicit `ReturnType<typeof definePrimitive<…>>` annotation. Each render file calls `createParts` or wraps a UI SDK component. `npm run lint` runs the guard.
  - Focus, keys, roving, popups, sheets, dismissal, search and announcements come from slot declarations, UI SDK components and `@ui-sdk/core` behaviors. The only new spec §2 rows are D1's and D10's; a task that finds it needs another stops and asks for a spec change.
  - A composed UI SDK component follows the Composer pattern: the slot's `state` hands its props and controller (memoized in `api.partState`), React passes them as props, web writes them onto the `ui-*` element in the root's `render` hook and hears its events through `hearComposed` (D1). ARIA a composed part needs from us (a picker row's `aria-selected`) comes from core part state, never from a render file.
  - A popup the primitive owns uses `createPopup` as Context Meter does, with `presentation` (D13) and `initialFocus` given as a selector.
  - A component composes the internal wrapper where its look fits, else bare UI SDK parts styled from its own stylesheet. The first task to need a missing wrapper adds it in both layers and to `internals` in `registry/catalog.mjs`.
- **Read first:** the `ui-sdk` skill, `node_modules/@ui-sdk/<framework>/docs/llms.txt`, `docs/popups.md`, and each component page a task names. Where the installed docs differ from this plan, follow the docs and add a line to `AGENTS.md` "UI SDK API notes".
- **Names:** primitives `kind-<component>`; web tags `kind-<component>[-<part>]` in light DOM, declared in `HTMLElementTagNameMap`; React `<Name>`, `<Name><Part>`; web `define<Name>()`; registry items `<component>` and `<component>-web`. The naming option is `label`, never `title`.
- **Web:** callbacks are DOM events; a callback whose presence offers an action has a `can-<action>` attribute; a callback that names a bubbling native event inside is renamed through `events` (a composed Command's `select` and Slider's `change`, for example). Values a web root reads when it connects (`defaultValue`) are properties.
- **Agent actions (spec §6):** listed only while available, through api getters that return `undefined` otherwise; same code paths as pointer and keyboard. Callbacks report who caused them through `actionSource`, `dispatch` or `createChange`, so an agent's call has `details.source === "agent"`. Actions that take an id refuse an unknown one and list them through `agent.items` (`closed: true`). Composed UI SDK parts carry `data-agent-hidden`, so each component is one snapshot entry. `data-agent-confirm` only where D7 and D10 say.
- **Accessibility (spec §8):** every root and trigger is named; a trigger that shows a value is named by its role and the value ("Model, GPT-5"); `announce` is polite and fires on outcomes only (a dictation that failed, a draft restored); every status has a mark and text; a danger option has words, not only a color.
- **Motion:** every animated primitive takes `motion: "auto" | "reduced" | "none"`; durations and easings from `src/core/motion/tokens.ts` and `--kind-duration-*`/`--kind-ease*`; `"reduced"` is at most a 120 ms opacity fade, `"none"` is instant. Popups and sheets animate in CSS from UI SDK's `data-starting-style`/`data-ending-style`; the waveform is CSS heights from a `--kind-dictation-level-<i>` variable per bar, held still under reduced motion.
- **Design bar:** light and dark through `--kind-color-*` tokens only. A part that comes and goes has a reserved place or replaces a part of the same size: a trigger's width doesn't follow its value while the popup is open, and the dictation button, waveform and status share one box. Every component PR has light and dark screenshots, nothing focused unless they show focus, plus one with its popup or sheet open. New glyphs are Lucide's (`plus`, `settings-2`, `shield`, `sparkles`, `mic`, `square`, `book-open`, `check`, `chevron-right`), drawn as CSS masks with a `forced-colors` rule and added to the Lucide entry in `THIRD_PARTY_NOTICES.md`.
- **Tests stay lean and never slow implementation:** build first, then test. Per component: core unit tests only for pure helpers, and one browser spec per layer with an `expectAgentActions` snapshot and a smoke test (renders, the keyboard path, axe in light and dark, with the popup open). Fixtures and explicitly resolved deferred promises only: dictation runs on a fake `DictationSource`, never a microphone. Budgets match Linux CI: fix chip widths and row heights in fixtures, and count nothing that depends on font metrics.
- **Session routine:** freeze the core primitive's options, state, slots and api first; then React, web, CSS, docs and specs go to parallel subagents, and the owner writes shared files (`core/index.ts`, `registry/catalog.mjs`, `size-budget.json`, `AGENTS.md`, `meta.json`) once. `npm run check` runs alone, through one subagent, never beside another Playwright run.
- **Size:** each task adds its primitive to `imports` in `size-budget.json` at its measured gzip size rounded up to the next 500 bytes, and raises the `./core` limit by the measured growth, rounded up to the next 1,000 bytes.
- **Docs:** pages import examples by relative path and link with `./x.mdx`; `scripts/tests/docs.test.mjs` enforces both.
- **Publication:** nothing publishes, versions or deploys.
- **Commits** carry `Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>`.
- **References:** name only what the code builds on. Third-party attribution goes only in `THIRD_PARTY_NOTICES.md`.

## Review Focus

1. **A web menu chosen with Enter:** Add Menu's item activated by Enter (a `keydown`, no click) calls `onAction` once with `source: "keyboard"`, in both layers. Task 1 and Task 4.
2. **Picker pages and search:** typing in a page filters that page; Backspace in the empty search goes back and restores the query typed there; the chosen row keeps its check mark across pages; the arrow keys reach the footer action. Task 2.
3. **Draft restore against a newer edit:** a submission that resolves after the person typed more clears only the submitted snapshot from storage, and a remount restores the newer text; a controlled composer never reads or writes storage. Task 13.
4. **Dictation that fails or is cancelled:** permission denied shows its text and returns to the mic button; Cancel inserts nothing; Stop inserts the final text once, never an interim one. Task 11.
5. **Narrow screens:** at 390 px with touch, every Wave 5 popup opens as a sheet, Settings' value rows replace the level, and nothing overflows the viewport. Task 14.

---

## File Map

```text
packages/agent-ui/src/types/records.ts                 (+ PickerItem, PickerAction, MenuEntry, ApprovalModeOption, EffortLevel, ContextChip, PromptTemplate, RegenerateOption)
packages/agent-ui/src/core/{composed-events,dictation,menu-base}.ts
packages/agent-ui/src/core/picker/{picker,base,index}.ts
packages/agent-ui/src/core/{add-menu,settings-menu,approval-mode,effort-slider,model-control,context-bar,dictation-button,prompt-library}/{<name>,index}.ts
packages/agent-ui/src/core/{model-selector,message,composer}/…                (Tasks 3, 7, 13, 14)
packages/agent-ui/src/react/<name>.tsx    packages/agent-ui/src/web/<name>.ts
packages/agent-ui/src/{react,web}/internal/{command,slider,switch}.*         (Task 1)
packages/agent-ui/src/styles/<name>.css
packages/agent-ui/tests/core/{dictation,picker}.test.mjs
packages/agent-ui/tests/fixtures/{react,web}/cases/<name>.*
tests/browser/wave-5/<name>.spec.ts
apps/docs/content/docs/components/<name>.mdx    apps/docs/examples/<name>/basic.tsx
registry/catalog.mjs    size-budget.json    AGENTS.md    .changeset/agent-ui-wave-5.md
```

The Dictation primitive's folder is `dictation-button/`, because `core/dictation.ts` is the source module and the guard names a primitive after its folder; the public name is still Dictation (`kind-dictation`).

## Component task routine

Tasks 2–14 each finish with these steps after their own tests pass. A task lists only what differs.

- [ ] **Registry:** add `<name>` to `components` in `registry/catalog.mjs` (title, one-line description, `uses` naming the items its render files import), and any new `internal` entry. Run `node --test scripts/tests/registry.test.mjs`. Expected: PASS.
- [ ] **Docs page:** follow `apps/docs/content/docs/components/step.mdx` and the `write-docs` and `fumadocs` skills: one captioned example on top, then Installation, Composition, Usage, API Reference (`<auto-type-table>` over `<Name>Options`), Agent (`<auto-type-table>` over `Pick<<Name>Api, …>`) and the closing `<Caption>` about Web Components. Add `apps/docs/examples/<name>/basic.tsx` (starting with `"use client"` when it holds state or handlers) and the page to `components/meta.json`, after `action` in task order. Run `node --test scripts/tests/docs.test.mjs && npm run build:docs`. Expected: PASS.
- [ ] **Screenshots:** light and dark screenshots of the docs example, nothing focused, plus one with the popup open and one as a sheet at 390 px, into `artifacts/screenshots/<name>-{light,dark,open,sheet}.png`, attached to the PR with the `github-pr-media` skill.
- [ ] **Size:** `npm run check:size`, then set the budgets as Global Constraints say.
- [ ] **Finish:** run `unslop` on the diff, then `expert-review`, and fix its findings. Run `npm run check` once, alone, through a subagent. Expected: PASS. Add any new UI SDK difference to `AGENTS.md` "UI SDK API notes" as one bullet named after the component, and move any `decisions.md` item the task settles to Resolved.
- [ ] **Commit and PR:** commit `feat(<name>): …`, push, and open the PR on the previous task's branch. The PR reports what was checked by hand in a real browser (keyboard, focus, the sheet on a touch viewport, reduced motion through the media query and the `motion` option, light and dark) and what wasn't.

---

### Task 1: Wave 5 groundwork

Spec §2, §7 Wave 5; D1, D5, D10.

**UI SDK:** `docs/components/{command,menu,slider,switch}.md` ("Events", "Controller"), `docs/popups.md` ("Modals and Sheets"), `core.md` "A Popup of Your Own" and "Remember the choice".

**Files:**
- Create: `packages/agent-ui/src/core/{composed-events,dictation,menu-base}.ts`, `src/{react,web}/internal/{command,slider,switch}.*`
- Modify: `src/types/{records,index}.ts`, `src/core/file-input-events.ts` (onto `hearComposed`), `src/core/index.ts`, `src/{react,web}/internal/menu.*` (checkbox and radio items, item descriptions, submenus, `presentation`), `scripts/ui-sdk-exceptions.json` (D1's and D10's rows), `scripts/check-ui-sdk-usage.mjs` if it names `file-input-events.ts`, `playwright.config.mjs` (`waves` gains `wave-5`), `scripts/affected-specs.mjs` if it names waves, `registry/catalog.mjs` (three internals)
- Test: `packages/agent-ui/tests/core/dictation.test.mjs`; `tests/browser/wave-5/composed-events.spec.ts` (web only, on a fixture page: a `ui-menu` inside a slot element; unit tests have no DOM); existing `tests/browser/wave-1/composer.spec.ts` and `uploader.spec.ts` (File Input still heard on web)

**Interfaces:**
- `types/records.ts`:
  - `PickerItem<Icon = unknown> { value: string; label: string; description?: string; meta?: string; icon?: Icon; keywords?: string[]; group?: string; disabled?: boolean; items?: PickerItem<Icon>[] }` (`items` makes the row open a page)
  - `PickerAction<Icon = unknown> { id: string; label: string; description?: string; icon?: Icon }`
  - `MenuEntry<Icon = unknown> { id: string; label: string; description?: string; icon?: Icon; group?: string; disabled?: boolean; items?: MenuEntry<Icon>[] }`
  - `ApprovalModeOption { value: string; label: string; description?: string; danger?: boolean }`
  - `EffortLevel { value: string; label: string }`
  - `ContextChip<Icon = unknown> { id: string; label: string; kind?: string; icon?: Icon }`
  - `PromptTemplate { id: string; title: string; body: string; description?: string; group?: string }`
  - `RegenerateOption<Icon = unknown> { id: string; label: string; description?: string; icon?: Icon; items?: RegenerateOption<Icon>[] }`
- `core/composed-events.ts` (D1): `hearComposed(el: HTMLElement, handlers: Record<string, (detail: unknown, event: Event) => void>): () => void`. Capture-phase listeners on `el` for each named event whose target's tag starts with `ui-`; returns the cleanup a `bind` returns. A cancelled event (`defaultPrevented`) is not handed on.
- `core/dictation.ts` (D10): `DictationEvent = { level: number } | { text: string; final: boolean } | { error: "unsupported" | "denied" | "no-speech" | "network" | string }`; `DictationSource { start(signal: AbortSignal): AsyncIterable<DictationEvent> }`; `createSpeechDictation(options?: { lang?: string; bars?: number }): DictationSource`. Aborting the signal stops recognition and releases every media track.
- `core/menu-base.ts` (D5): `menuBase<State, Api, Options>({ kind, toData(options): MenuData, onAction?, onChecked?, onValue? })` returning `options`, `state` (`popupState` plus `items`), `sync`, `controlled` (`open`), `api` (`controller` from `createMenuController()`, `partState.menu` handing `items`, `presentation`, `onAction`/`onCheckedChange`/`onValueChange` and `controller`), getters `open`/`close`, `slots` (`root`, `trigger`, `content`), and `agent` (`items` from every reachable id, `closed: true`).
- Internals: `internal-command` (Command parts, Kind classes), `internal-slider` (Slider, Track, Indicator, Thumb, Value), `internal-switch` (Switch, SwitchThumb, also used as a look by D6).

- [ ] **Step 1: Write the failing tests.** Browser (web): a `ui-*` element's non-bubbling event inside the slot element reaches the handler once, and not after the cleanup; an event from a `kind-*` element or one cancelled before capture reaches the slot isn't handed on. Core:

```js
test("createSpeechDictation reports unsupported without SpeechRecognition", async () => {
  const events = [];
  for await (const event of createSpeechDictation().start(new AbortController().signal)) events.push(event);
  assert.deepEqual(events, [{ error: "unsupported" }]);
});
test("createSpeechDictation turns results into text events and stops on abort", async () => { /* fake SpeechRecognition and getUserMedia on globalThis */ });
```

- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-5/composed-events.spec.ts`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** the interfaces. Move `file-input-events.ts` onto `hearComposed` with no change in behavior. Confirm in the installed `@ui-sdk/web` source that `action`, `checkedchange`, `valuechange`, `querychange`, `pageschange` and `valuecommit` are dispatched on elements inside the composing slot (not on a portal elsewhere): a popup rendered into a `container` outside the root isn't heard, so Wave 5 popups keep their content in place, and the note goes into "UI SDK API notes".
- [ ] **Step 4: Spec.** If the user changed any Open decision, rewrite its spec lines now (§2 rows and internal table, §6 confirm list, §7 Wave 5).
- [ ] **Step 5: Run** `npm run lint && npm run typecheck && npm run test:unit && npx playwright test tests/browser/wave-1/composer.spec.ts tests/browser/wave-1/uploader.spec.ts && npm run check:size`. Expected: PASS.
- [ ] **Step 6:** Write the AGENTS.md "UI SDK API notes" bullet ("Wave 5 groundwork"). Commit `feat: Wave 5 groundwork`, push, open the PR on this plan's branch.

---

### Task 2: Picker

Spec §7 Wave 5 "Picker"; D2, D3, D13.

**UI SDK:** `createPopup` with `popoverPreset`, `popupTrigger`, `popupContent`; Command (`docs/components/command.md`: "Pages", "Highlight Matches", "Filter and Keywords", "Controller", "Pending Actions") through `internal-command`; `hearComposed`.

**Files:**
- Create: `packages/agent-ui/src/core/picker/{picker,base,index}.ts`, `src/react/picker.tsx`, `src/web/picker.ts`, `src/styles/picker.css`
- Test: `packages/agent-ui/tests/core/picker.test.mjs`, `tests/browser/wave-5/picker.spec.ts`

**Interfaces:**
- `pickerBase({ kind, toItems(options): PickerItem[], check?: boolean })` (`core/picker/base.ts`): everything below but the name, for Model Selector, Model Control and Prompt Library to spread.
- Produces `pickerPrimitive` (`kind-picker`):
  - Options: `items: PickerItem[]`; `actions?: PickerAction[]`; `label` (the trigger's name: "Model", "Work in", …); `placeholder?` (the search field's, default "Search"); `emptyText?` (default "No matches"); `value`/`defaultValue`/`onValueChange`; `onAction?(id, details)` (`callback` through `dispatch`, closes the popup unless cancelled); `open`/`defaultOpen`/`onOpenChange`; `presentation?`; `motion`.
  - State: `popupState`, `query`, `pages` (the open page path, by row `value`), `chosen` (the chosen item, for the trigger).
  - Slots: `root`; `trigger` (`role: "button"`, `aria-haspopup="dialog"`, named "<label>, <chosen label>", showing the chosen icon and label); `content` (`initialFocus` is the search field's selector); `command` (the internal Command, handed `controller`, `items` as `CommandData`, `pages`, `filter: "fuzzy"`, `autoHighlight` and `onAction`/`onPagesChange`/`onQueryChange` through slot state); `item` (props `value`; holds icon, label with `CommandItemText` marks, description, `meta`, and the `check` part; `aria-selected` on the chosen row comes from part state); `back` (a "Back" row on a page, present while `pages` isn't empty); `action` (prop `value`, a footer row in the last group).
  - Choosing a row with `items` pushes its page; choosing any other row sets `value` through `createChange` (`"item-press"`) and closes; choosing an action calls `onAction` and closes. The query resets when the popup closes.
  - API getters: `open`/`close` (while closed and open), `setValue(value)` (a known leaf), `run(actionId)` (while `onAction` is set). `controlled`: `open`, `value`. Agent actions: `open`, `close`, `setValue`, `run`, with `agent.items` from every leaf and action.
- React: `Picker`, `PickerTrigger`, `PickerContent`, `PickerItem`, `PickerAction`. Web: `definePicker()`, `can-run`, events `pickerchange` and `pickeraction` (Command's own `valuechange`, `action` and `select` are taken).

- [ ] **Step 1: Write the failing tests.** Core: `toCommandData` keeps groups in first-seen order, puts actions last in one group, and nests `items` as pages. Browser, both layers:
  - **Review Focus 2.**
  - Opening focuses the search field; Escape clears the query, then closes and returns focus to the trigger.
  - Two-line rows keep a fixed height (`--kind-picker-row-height`) with and without a description match mark.
  - At 390 px with touch the popup is a sheet (`data-presentation="sheet"`).
  - Axe with the popup open, light and dark. `expectAgentActions(page, "Work in, kind-ui/agent-ui", ["open", "setValue", "run"])`.
- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-5/picker.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** The docs example is "Work in" (projects with icons and a "New project" action); the page adds Project and Branch examples (D3), the branch rows showing ahead/behind in `meta`.
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-command"]`). Commit `feat(picker): add Picker`.

---

### Task 3: Model Selector on Picker

Spec §7 Wave 3 "Model Selector" and Wave 5; D4.

**Files:**
- Modify: `packages/agent-ui/src/core/model-selector/model-selector.ts`, `src/react/model-selector.tsx`, `src/web/model-selector.ts`, `src/styles/model-selector.css`, `tests/browser/wave-3/model-selector.spec.ts`, `tests/browser/wave-3/agent.spec.ts` and `tests/fixtures/*/cases/agent.*` (the person path now opens the button), `apps/docs/content/docs/components/model-selector.mdx`, `apps/docs/examples/model-selector/*`
- Remove: the field, `data-model-selector-field` anchor and the Combobox parts it used; `internal-combobox` stays if anything else uses it, else it leaves the catalog.

**Interfaces:**
- `modelSelectorPrimitive` spreads `pickerBase`; `models: ModelOption[]` maps to `PickerItem` (`name` → `label`, `group`, `description`, `icon`), and a provider `group` can become a page with `pages: "groups"` (default `"flat"`). New: `actions?: PickerAction[]`, `onAction?`. Kept: `value`/`defaultValue`/`onValueChange`, `agentConfirm`-free `setValue`, `icon` per model (React `string | ReactElement`, web `string | Element`), web `modelchange`. New web event `modelaction`, `can-run`.
- The trigger is named "Model, <name>" and shows the model's icon (no `ComboboxValueIcon`, so server markup has it).

- [ ] **Step 1: Update the failing tests**, both layers: the 0.4.0 icons render in rows and trigger, in server markup too; "More models" is reachable by ArrowUp from the first row and calls `onAction("more")`; `pages: "groups"` opens a provider's models; `expectAgentActions(page, "Model, GPT-5", ["open", "setValue", "run"])` with `actions`, `["open", "setValue"]` without.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-3/model-selector.spec.ts tests/browser/wave-3/agent.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Move AGENTS.md's "Model Selector" and "Model Selector icons" notes to describe the Picker version; move the `ComboboxValueIcon`, field-renaming and `anchor` entries in `decisions.md` to Resolved.
- [ ] **Step 4: Run** the same, plus `npm run lint && npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Component task routine** (the page exists; it gains a "Changes in 0.5" note and the "More models" example). Commit `feat(model-selector)!: build Model Selector on Picker`.

---

### Task 4: Add Menu

Spec §7 Wave 5 "Add Menu"; D1, D5.

**UI SDK:** Menu (`docs/components/menu.md`: "Icons", "Submenus", "Menus as Data", "Presentation", "Controller") through `internal-menu`; `menuBase`.

**Files:**
- Create: `packages/agent-ui/src/core/add-menu/{add-menu,index}.ts`, `src/react/add-menu.tsx`, `src/web/add-menu.ts`, `src/styles/add-menu.css`
- Test: `tests/browser/wave-5/add-menu.spec.ts`

**Interfaces:**
- Produces `addMenuPrimitive` (`kind-add-menu`), spreading `menuBase`:
  - Options: `items: MenuEntry[]` (grouped by `group`; an entry with `items` is a submenu, which is how a "Plugins" group lists each plugin's commands); `label` (default "Add"); `onAction?(id, details)` (`callback` through `dispatch`); `open`/`defaultOpen`/`onOpenChange`; `presentation?`; `motion`.
  - Rows show icon, label and an optional description line; groups have visible labels.
  - API: base getters plus `run(id)` (while `onAction` is set; leaves only). Agent actions: `open`, `close`, `run`.
- React: `AddMenu` (+ `AddMenuTrigger`, `AddMenuContent`). Web: `defineAddMenu()`, `can-run`, event `addaction`.

- [ ] **Step 1: Write the failing browser test**, both layers:
  - **Review Focus 1.**
  - The trigger is an icon button named "Add"; ArrowRight opens a plugin's submenu and Escape closes only it; typeahead moves by label.
  - A sheet at 390 px with touch, where the submenu replaces the level.
  - Axe open, light and dark. `expectAgentActions(page, "Add", ["open", "run"])`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-5/add-menu.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** The docs example puts it in a Composer's actions row with "Upload file" (calling the composer's attach), "Add context" and a "Plugins" group.
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-menu"]`). Commit `feat(add-menu): add Add Menu`.

---

### Task 5: Settings Menu

Spec §7 Wave 5 "Settings Menu"; D5, D6, D9.

**Files:**
- Create: `packages/agent-ui/src/core/settings-menu/{settings-menu,index}.ts`, `src/react/settings-menu.tsx`, `src/web/settings-menu.ts`, `src/styles/settings-menu.css`
- Test: `tests/browser/wave-5/settings-menu.spec.ts`

**Interfaces:**
- Produces `settingsMenuPrimitive` (`kind-settings-menu`), spreading `menuBase`:
  - Options: `settings: ({ type: "toggle"; id; label; description?; icon? } | { type: "choice"; id; label; icon?; options: { value; label }[] })[]`; `values`/`defaultValues`/`onValuesChange` (`Record<string, boolean | string>`, one `createChange` per row with `details.id`); `label` (default "Settings"); `open`/`defaultOpen`/`onOpenChange`; `presentation?`; `motion`.
  - A toggle is a checkbox item drawn as a switch (D6) that keeps the menu open; a choice is a submenu trigger showing the value as trailing text, holding a radio group.
  - API: base getters plus `toggle(id, on?)`, `setValue(id, value)` (refuse unknown ids and values). `controlled`: `open`, `values`. Agent actions: `open`, `close`, `toggle`, `setValue`.
- React: `SettingsMenu` (+ trigger and content parts). Web: `defineSettingsMenu()`, event `valueschange`; `values` is a property.

- [ ] **Step 1: Write the failing browser test**, both layers: Space on a toggle flips it and the menu stays open, and a screen reader name reads "Web search, checked"; a choice row's submenu checks its value and the row's text updates without the menu moving; a host that cancels keeps the old value; axe open, light and dark; `expectAgentActions(page, "Settings", ["open", "toggle", "setValue"])`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-5/settings-menu.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-menu", "internal-switch"]`). Commit `feat(settings-menu): add Settings Menu`.

---

### Task 6: Approval Mode

Spec §6 "Agent actions", §7 Wave 5 "Approval Mode"; D5, D7.

**Files:**
- Create: `packages/agent-ui/src/core/approval-mode/{approval-mode,index}.ts`, `src/react/approval-mode.tsx`, `src/web/approval-mode.ts`, `src/styles/approval-mode.css`
- Test: `tests/browser/wave-5/approval-mode.spec.ts`

**Interfaces:**
- Produces `approvalModePrimitive` (`kind-approval-mode`), spreading `menuBase`:
  - Options: `modes: ApprovalModeOption[]`; `value`/`defaultValue`/`onValueChange`; `label` (default "Approvals"); `learnMoreHref?` (the header link) or `onLearnMore?`; `agentConfirm?` (default `true`); `open`/`defaultOpen`/`onOpenChange`; `presentation?`; `motion`.
  - The trigger shows the mode's label (and the warning mark for a danger mode), named "Approvals, <mode>". Rows are radio items with a description line; a danger row has `data-danger`, the warning mark and "Risky" in its name.
  - API: base getters plus `setValue(value)`. `controlled`: `open`, `value`. Agent actions: `open`, `close`, `setValue`; the root renders `data-agent-confirm` while `agentConfirm`.
- React: `ApprovalMode`. Web: `defineApprovalMode()`, event `modechange`, `defaults: { agentConfirm: true }`.

- [ ] **Step 1: Write the failing browser test**, both layers: arrow keys and Enter choose a mode and the menu closes; the danger row reads as risky without color (forced colors keeps the mark); the header link is reached by the arrows and follows its `href`; `act("setValue", "full")` is refused without a person while `agentConfirm`, and allowed with `agentConfirm: false`; axe open, light and dark; `expectAgentActions(page, "Approvals, Ask every time", ["open", "setValue"])`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-5/approval-mode.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-menu"]`). Commit `feat(approval-mode): add Approval Mode`.

---

### Task 7: Message regenerate-with menu

Spec §7 Wave 1 "Message" and Wave 5; D5, D15.

**Files:**
- Modify: `packages/agent-ui/src/core/message/message.ts`, `src/react/message.tsx`, `src/web/message.ts`, `src/styles/message.css`, `tests/browser/wave-1/message.spec.ts`, `apps/docs/content/docs/components/message.mdx`, `apps/docs/examples/message/*`

**Interfaces:**
- `messagePrimitive` gains `regenerateOptions?: RegenerateOption[]`; `onRegenerate(optionId: string | undefined, details)`. With options, the `regenerate` part is a menu trigger in the toolbar (`MessageRegenerate` keeps its name), and the menu is built through `menuBase`'s data path; without, it stays a button. A `RegenerateOption` with `items` is a submenu ("Try with another model ›").
- The agent action `regenerate(optionId?)` refuses an unknown id; `agent.items` lists the option ids while `regenerateOptions` is set. Web: `regenerate` event `detail.value` is the option id.

- [ ] **Step 1: Update the failing tests**, both layers: the toolbar keeps one Tab stop with the menu trigger in it; Enter on "More concise" calls `onRegenerate("concise")`; "Try again" calls it with `undefined`; without options nothing changes from 0.4.0 (existing assertions); `expectAgentActions` lists `regenerate` once the message settles.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-1/message.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint && npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Component task routine** (the page exists; it gains a "Regenerate with" section). Commit `feat(message): add regenerate options`.

---

### Task 8: Effort Slider

Spec §7 Wave 5 "Effort Slider"; D8.

**UI SDK:** `createPopup` with `popoverPreset`; Slider (`docs/components/slider.md`: "Step and Bounds", "Format and Locale", "Controller", "Saving on Commit") through `internal-slider`.

**Files:**
- Create: `packages/agent-ui/src/core/effort-slider/{effort-slider,index}.ts`, `src/react/effort-slider.tsx`, `src/web/effort-slider.ts`, `src/styles/effort-slider.css`
- Test: `tests/browser/wave-5/effort-slider.spec.ts`

**Interfaces:**
- Produces `effortSliderPrimitive` (`kind-effort-slider`):
  - Options: `levels: EffortLevel[]`; `value`/`defaultValue`/`onValueChange` (a level's `value`, reported on Slider's commit, so a drag reports once); `defaultLevel?` (Reset's target, default the middle level); `label` (default "Effort"); `modelLabel?` with `modelHref?` or `onModelPress?`; `open`/`defaultOpen`/`onOpenChange`; `presentation?`; `motion`.
  - Slots: `root`, `trigger` (named "Effort, <level>", showing the sparkle at the top level), `content`, `title`, `slider` (handed `controller`, `min: 0`, `max: levels.length - 1`, `step: 1`, `format` giving the level's label), `stops` (`aria-hidden` ticks with the labels under them), `reset` (`role: "button"`, present while the value isn't `defaultLevel`'s; focus recovery moves to the slider when it leaves), `model` (a link or button).
  - API: base `open`/`close`, `setValue(level)`, getter `reset` (while it'd change something). `controlled`: `open`, `value`. Agent actions: `open`, `close`, `setValue`, `reset`.
- React: `EffortSlider`. Web: `defineEffortSlider()`, event `effortchange`.

- [ ] **Step 1: Write the failing browser test**, both layers: the popup opens with focus on the thumb; arrow keys move one level and `aria-valuetext` reads its label; Home and End reach the ends and the top shows the sparkle; Reset appears and leaves without moving the slider; a drag reports one change; axe open, light and dark; `expectAgentActions(page, "Effort, Medium", ["open", "setValue"])`, then with a changed value `["open", "setValue", "reset"]`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-5/effort-slider.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-slider"]`). Commit `feat(effort-slider): add Effort Slider`.

---

### Task 9: Model Control

Spec §7 Wave 5 "Model Control"; D9.

**UI SDK:** nested popups (`docs/components/popover.md` "Nested popovers"), `pickerBase`, the Effort Slider primitive as the nested popup.

**Files:**
- Create: `packages/agent-ui/src/core/model-control/{model-control,index}.ts`, `src/react/model-control.tsx`, `src/web/model-control.ts`, `src/styles/model-control.css`
- Test: `tests/browser/wave-5/model-control.spec.ts`

**Interfaces:**
- Produces `modelControlPrimitive` (`kind-model-control`), spreading `pickerBase`:
  - Options: Model Selector's `models`, `value`/`defaultValue`/`onValueChange`, `actions?`/`onAction?`; `levels?: EffortLevel[]` with `effort`/`defaultEffort`/`onEffortChange` (no levels, no effort row); `label` (default "Model"); `open`/`defaultOpen`/`onOpenChange`; `presentation?`; `motion`.
  - The trigger reads "<model> · <effort>" and is named "Model, <model>, effort <effort>". The effort row is the last row before the actions; ArrowRight or Enter on it opens a nested Effort Slider popover beside the picker (a sheet stacks it as the next level), Escape closes only it and returns focus to the row.
  - API: Picker's getters plus `setEffort(level)`. Agent actions: Picker's plus `setEffort`; the nested Effort Slider is its own snapshot entry while open.
- React: `ModelControl`. Web: `defineModelControl()`, events `modelchange`, `effortchange`, `modelaction`.

- [ ] **Step 1: Write the failing browser test**, both layers: choosing a model closes the picker and updates the trigger text; the effort row opens the nested popover and both stay open; Escape closes the inner one, then the outer; the trigger's width doesn't change while the popup is open; axe with both open, light and dark; `expectAgentActions(page, "Model, GPT-5, effort High", ["open", "setValue", "setEffort"])`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-5/model-control.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["picker", "effort-slider", "internal-command", "internal-slider"]`). Commit `feat(model-control): add Model Control`.

---

### Task 10: Context Bar

Spec §2 (Attachments' row extended), §7 Wave 5 "Context Bar"; D11.

**UI SDK:** `createListFocus` (`createRovingFocus`), `createFocusRecovery`, `createPopup` with `popoverPreset`; the motion helper's `"fade-up"` and `bindLeavingRow` (spec §6 "Removed items").

**Files:**
- Create: `packages/agent-ui/src/core/context-bar/{context-bar,index}.ts`, `src/react/context-bar.tsx`, `src/web/context-bar.ts`, `src/styles/context-bar.css`
- Modify: spec §2 Attachments row, `scripts/ui-sdk-exceptions.json`
- Test: `tests/browser/wave-5/context-bar.spec.ts`; a case in `tests/browser/wave-1/budgets.spec.ts`

**Interfaces:**
- Produces `contextBarPrimitive` (`kind-context-bar`):
  - Options: `chips: ContextChip[]`; `label` (default "Context"); `onRemove?(id, details)` (`"action"`); `open`/`defaultOpen`/`onOpenChange` (the overflow popover); `presentation?`; `motion`.
  - State: `visibleCount` (from the list's `ResizeObserver`), `rows` (with leaving rows).
  - Slots: `root` (`role: "group"` named by `label`), `list` (`role: "list"`, measured), `chip` (`listitem`, roving, prop `value`; icon, label, remove), `remove` (pointer-only, hidden from assistive technology, as Attachments'), `overflow` (the "+N" trigger, named "N more"), `content` (the popover's list, each row removable).
  - Removing the focused chip moves focus to a neighbor; a chip that moves into the overflow keeps the count right in the same frame (no flash of N+1 chips).
  - API: getters `remove(id)` (while `onRemove` is set), `open`/`close` (while chips overflow). `controlled`: `open`. Agent actions: `remove`, `open`, `close`.
- React: `ContextBar`. Web: `defineContextBar()`, `can-remove`, event `contextremove`.

- [ ] **Step 1: Write the failing browser test**, both layers: at a fixed 360 px width with `--kind-context-chip-max-width: 120px` the bar shows the fixture's known count and "+N"; Delete removes the focused chip and focus moves; adding a chip doesn't move the composer below it (bounding box); the overflow popover lists the rest and removing one there updates "+N"; axe with the popover open, light and dark; `expectAgentActions(page, "Context", ["remove", "open"])`. Budget: adding one chip among 10 and 200 renders a fixed number of parts.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-5/context-bar.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** The docs example sits above a Composer's editor.
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine.** Commit `feat(context-bar): add Context Bar`.

---

### Task 11: Dictation

Spec §2 ("Dictation audio and speech" row), §6 "Agent actions", §7 Wave 5 "Dictation"; D10.

**UI SDK:** `announce`, `createFocusRecovery`; no UI SDK component covers capture, which is why D10 adds a spec §2 row.

**Files:**
- Create: `packages/agent-ui/src/core/dictation-button/{dictation-button,index}.ts`, `src/react/dictation.tsx`, `src/web/dictation.ts`, `src/styles/dictation.css`
- Test: `tests/browser/wave-5/dictation.spec.ts` (a fake `DictationSource` from the fixture, with deferred events)

**Interfaces:**
- Produces `dictationPrimitive` (`kind-dictation`):
  - Options: `source?: DictationSource` (no source, no button: D10); `onText?(text, details)` (`callback`); `label` (default "Dictate"); `agentConfirm?` (default `true`); `motion`.
  - State: `phase: "idle" | "listening" | "transcribing" | "error"`, `levels: number[]` (the last `bars` levels, `live`), `interim` (shown, never sent), `error`.
  - Slots: `root`; `start` (`role: "button"`, mic glyph, present while `idle` or `error`); `waveform` (`aria-hidden`, bars from `--kind-dictation-level-<i>` through `live` attributes, so a level renders nothing in React); `status` ("Listening", "Transcribing" with a running status mark, or the error's words); `stop` and `cancel` (`role: "button"`, present while `listening`). All share one box of fixed size.
  - Start aborts nothing else; a second start while listening is refused. Stop waits for the source's last `final` text, then calls `onText` once with the joined final text and returns to `idle`; Cancel aborts and calls nothing. An error announces its words ("Microphone blocked") and keeps the button. Focus moves from Start to Stop and back through focus recovery.
  - API: getters `start` (while `idle` or `error` with a source), `stop` and `cancel` (while `listening`). `controlled`: `phase`. Agent actions: `start` (behind `data-agent-confirm` while `agentConfirm`), `stop`, `cancel`.
- React: `Dictation`. Web: `defineDictation()`, event `dictationtext`, `source` is a property.

- [ ] **Step 1: Write the failing browser test**, both layers:
  - **Review Focus 4.**
  - Levels animate the bars at full motion and hold them still under reduced motion and `motion="none"`.
  - Interim text shows in the status and is never sent.
  - Axe in each phase, light and dark. `expectAgentActions(page, "Dictate", ["start"])`, then after the person starts, `["stop", "cancel"]`; `act("start")` is refused without a person.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-5/dictation.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** The docs example inserts the text into a Composer with `setValue` and shows `createSpeechDictation` and a `MediaRecorder` source posting to a host endpoint; it says Chrome's recognition sends audio to a speech service.
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine.** Commit `feat(dictation): add Dictation`.

---

### Task 12: Prompt Library

Spec §7 Wave 5 "Prompt Library"; D14.

**Files:**
- Create: `packages/agent-ui/src/core/prompt-library/{prompt-library,index}.ts`, `src/react/prompt-library.tsx`, `src/web/prompt-library.ts`, `src/styles/prompt-library.css`
- Test: `tests/browser/wave-5/prompt-library.spec.ts`

**Interfaces:**
- Produces `promptLibraryPrimitive` (`kind-prompt-library`), spreading `pickerBase` with `check: false`:
  - Options: `prompts: PromptTemplate[]`; `onInsert?(prompt, details)` (`callback` through `dispatch`); `actions?`/`onAction?`; `label` (default "Prompts"); `open`/`defaultOpen`/`onOpenChange`; `presentation?`; `motion`.
  - Rows show the title and the description, else the body's first line; the search matches the body too. Choosing a prompt calls `onInsert` and closes.
  - API: Picker's `open`/`close`/`run` plus `insert(id)` (while `onInsert` is set). Agent actions: `open`, `close`, `insert`, `run`.
- React: `PromptLibrary`. Web: `definePromptLibrary()`, `can-insert`, event `promptinsert`.

- [ ] **Step 1: Write the failing browser test**, both layers: a query that only matches a body finds its prompt; Enter calls `onInsert` with the prompt and focus returns to the trigger; no row has a check mark; axe open, light and dark; `expectAgentActions(page, "Prompts", ["open", "insert"])`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-5/prompt-library.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["picker", "internal-command"]`). Commit `feat(prompt-library): add Prompt Library`.

---

### Task 13: Composer draft restore

Spec §4.1 "Composer contract", §7 Wave 5; D12.

**UI SDK:** `createLocalStorage`, `createSessionStorage` and `ValueStorage` (`core.md` "Remember the choice"); `announce`.

**Files:**
- Modify: `packages/agent-ui/src/core/composer/composer.ts`, `src/react/composer.tsx`, `src/web/composer.ts`, `src/styles/composer.css`, `tests/browser/wave-1/composer.spec.ts`, `apps/docs/content/docs/components/composer.mdx`

**Interfaces:**
- Options: `draftKey?: string`; `draftStorage?: ValueStorage` (both needed; ignored with a controlled `value`).
- State: `restored: boolean`. Slot: `restored` ("Draft restored" with Discard, `role: "status"`, in the place the attachments area keeps, so the editor doesn't move); Discard empties the draft and the storage and leaves; the next edit hides it.
- Saving writes `{ text, tokens }` on each draft change; a resolved submission removes the stored draft only when it still equals the submitted snapshot. A changed `draftKey` restores that key's draft into an empty editor, never over text.
- API: getter `discardDraft` (while `restored`). Agent action `discardDraft` (under the composer's `agentConfirm`, as every composer action is).

- [ ] **Step 1: Update the failing tests**, both layers: **Review Focus 3**; a remount with the same `draftKey` restores text and tokens and announces "Draft restored"; Discard clears it and storage; a storage whose `set` throws leaves typing working; a controlled composer with `draftKey` never touches storage (a spy storage records no call).
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-1/composer.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Spec §4.1 gains the draft-restore line from D12.
- [ ] **Step 4: Run** the same, plus `npm run lint && npm run typecheck && npm run test:unit`. Expected: PASS.
- [ ] **Step 5: Component task routine** (the page gains a "Draft restore" section). Commit `feat(composer): restore drafts`.

---

### Task 14: Composer on narrow screens

Spec §6 "Motion", §7 Wave 5; D13, D16.

**Files:**
- Modify: `packages/agent-ui/src/styles/composer.css` and the stylesheets of every Wave 5 trigger, `apps/docs/content/docs/components/composer.mdx`, `apps/docs/examples/composer/full.tsx` (create)
- Test: `tests/browser/wave-5/composer-compact.spec.ts`

**Interfaces:**
- `--kind-composer-compact-width` (default `28rem`) and an `@container` on the composer root: below it the controls row wraps under the editor and labelled triggers show only their icon (their names stay); Send keeps its place at the row's end.
- No option and no script; `presentation: "auto"` on each popup does the rest.

- [ ] **Step 1: Write the failing browser test**, both layers, with a 390 × 844 touch viewport: **Review Focus 5**; the full composer fixture (Add Menu, Context Bar, Model Control, Approval Mode, Settings Menu, Dictation, Send) has no horizontal overflow (`scrollWidth === clientWidth`) at 390 px and at 320 px; each trigger keeps its accessible name with its label hidden; axe in light and dark.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-5/composer-compact.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** The Composer page gains the "full composer" example (D16) at full and narrow widths.
- [ ] **Step 4: Run** the same, plus `npm run lint && npm run build:docs`. Expected: PASS.
- [ ] **Step 5:** Screenshots of the full composer at 390 px with a sheet open, light and dark; then the routine's **Finish** and **Commit and PR** steps. Commit `feat(composer): narrow-screen layout`.

---

### Task 15: Wave 5 agent conformance

Spec §6 "Agent actions", §10 "Agent actions". Each component's snapshot is tested in its task; this task covers what they share, as Wave 4 Task 12 did.

**Files:**
- Modify: `packages/agent-ui/tests/fixtures/{react,web}/cases/agent.*` (a `case=wave-5` page: the Wave 4 page plus every Wave 5 component and a Message with `regenerateOptions`)
- Test: `tests/browser/wave-5/agent.spec.ts` (through `tests/browser/agent-conformance.ts`)

- [ ] **Step 1: Write the test**, both layers:
  - The snapshot lists every Wave 5 component once by its accessible name: no composed Command, Menu or Slider appears as an entry of its own.
  - Only Approval Mode (while `agentConfirm`), Dictation's `start` and the composer's actions render `data-agent-confirm`.
  - Each Wave 5 action but the bridge's generic `press` runs once through `act` and once through a person's input on a fresh page; attributes and text match, apart from inline styles, `tabindex` and popups the person opened on the way (`ignore`).
  - Callbacks receive `details.source === "agent"`, and a cancelling change callback leaves the state unchanged.
  - Actions that take an id refuse an unknown one; on web, every `can-*` attribute adds and removes its action.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-5/agent.spec.ts`. Expected: PASS; fix the owning primitive for any failure.
- [ ] **Step 3: Commit** `test: add Wave 5 agent conformance`, then follow the routine's **Finish** and **Commit and PR** steps.

---

### Task 16: Docs index and the 0.5.0 changeset

Spec §9.1, §9.5; D16, D17.

**Files:**
- Create: `.changeset/agent-ui-wave-5.md`
- Modify: `apps/docs/content/docs/index.mdx`, `packages/agent-ui/README.md` (component list), `scripts/tests/docs.test.mjs` (the visible pages)

**Interfaces:**
- `.changeset/agent-ui-wave-5.md`: `"@kind-ui/agent-ui": minor`, listing the nine new components, Model Selector's move onto Picker (its markup changes: what a host styling `data-model-selector-field` or the combobox must change), Message's `regenerateOptions` and the Composer's `draftKey`.
- No showcase page unless D16 changes.

- [ ] **Step 1: Write the failing test.** `docs.test.mjs`: every Wave 5 page is listed in `components/meta.json` and the docs index.
- [ ] **Step 2: Run** `node --test scripts/tests/docs.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement**, in the site's voice (`write-docs`).
- [ ] **Step 4: Run** `npm run build:docs`, then `npm run check` alone, through a subagent. Expected: PASS; `check:registry-consumers` installs every visible React item and its web twin.
- [ ] **Step 5:** Run `unslop` and `expert-review`. Commit `docs: index Wave 5 and add the 0.5.0 changeset`, push, open the PR. Don't publish, version or deploy.

---

## How this plan builds on UI SDK

| Requirement | Where |
| --- | --- |
| One `definePrimitive` per component, `createParts` per render file | Guard in `npm run lint`, every task |
| Search, pages and ranked matches are UI SDK Command | Picker, Model Selector, Model Control, Prompt Library (Tasks 2, 3, 9, 12) |
| Menus, submenus, checkbox and radio items are UI SDK Menu | `menuBase` (Task 1), Tasks 4–7 |
| Levels are UI SDK Slider | Effort Slider, Model Control (Tasks 8, 9) |
| Popups, nested popups and sheets come from `createPopup` and `presentation` | Tasks 2, 8–12, 14 |
| Roving chips, focus recovery and leaving rows reuse Waves 1–2 | Context Bar (Task 10) |
| Saved drafts use UI SDK storage | Composer (Task 13) |
| Composed components are heard on web through one spec §2 row | `hearComposed` (Task 1, D1) |
| Every component is a live UI SDK primitive with its actions | `expectAgentActions` in Tasks 2–14, and Task 15 |
| Hand-written code only for spec §2 rows | D1 and D10 add one row each; Context Bar extends Attachments' |

## Self-Review Notes

- **Scope coverage:** searchable Picker with icons, check mark, two-line rows, sections, page rows and footer actions (Task 2), Model Selector on it with logos and "More models" (Task 3), Work in/project/branch pickers (Task 2's page, D3); Add menu (Task 4); Settings menu (Task 5); Approval mode menu (Task 6); Effort slider popover (Task 8) and the combined trigger with a nested popover (Task 9); context bar (Task 10); dictation (Task 11); prompt library (Task 12); draft restore (Task 13); mobile composer (Task 14); regenerate-with menu (Task 7).
- **Spec coverage:** §2 rows and internal table: Task 1, Task 10, Task 11. §4.1: Task 13. §6 agent confirm list: Tasks 6, 11, 15. §7 Wave 5 rows and behavior lines: Tasks 2–14. §8: axe, keyboard and announcement checks per task. §9.1, §9.5: Task 16 and each page.
- **Follow-ups D1 opens, not in Wave 5:** File Tree's `onSelect` and Inline Citation's page count can move onto `hearComposed` and leave `decisions.md`'s open list; each is its own fix PR.
- **Out of scope:** prompt variables and editing (D14); saving attachments with a draft (D12); a speech engine of our own (D10); a showcase (D16).
