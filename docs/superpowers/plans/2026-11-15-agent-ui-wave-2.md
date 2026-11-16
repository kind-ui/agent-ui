# `@kind-ui/agent-ui` Wave 2 (0.2) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Each task is one session and one stacked PR: Task 1 stacks on this plan's PR, and each later task stacks on the one before.

**Goal:** Ship Wave 2, "agent activity": Status, Reasoning, Tool, Chain of Thought, Task, Plan, Subagent and Queue, in React and Web Components, with registry items, docs pages, a showcase page and the 0.2.0 changeset.

**Architecture:** Every Step-based component spreads one shared Step base definition into its own `definePrimitive`, the way the indicators share `core/indicator.ts`. Each component keeps its own primitive name, agent snapshot entry and folder, and the guard still sees one primitive per folder. Lists of items (Chain of Thought, Task, Plan, Queue) share one roving-focus helper, and every status icon draws from one shared status mark stylesheet. Render layers stay `createParts` calls plus classes.

**Tech Stack:** Unchanged from Wave 1. `@ui-sdk/core`, `@ui-sdk/react` and `@ui-sdk/web` stay at `0.1.0-beta.1`, and `motion` at `14.14.0`. No new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-11-14-agent-ui-design.md`: §2 "Building on UI SDK", §4.1, §5 Step base, §6 Motion and Agent actions, §7 Wave 2, §8. Also read `AGENTS.md` ("UI SDK API notes", Verification policy, the streaming UX checklist) and `.agents/experts/*/decisions.md`.

## Decisions for the user

Tasks marked with a decision follow the recommended option unless the user picks another. Task 1 writes each approved decision into the spec.

- **D1. Exit animations for removed items (spec §6).** Today a removed attachment chip or uploader row disappears at once, and the items after it jump into place. The open question is how an item the host removed can animate out.
  - **Recommended:** a component that renders items from host data keeps each removed item as a *leaving row* until its exit finishes.
    - A leaving row stays in place with `inert` and `aria-hidden="true"`, plays the `"fade"` preset through the motion helper's `exit`, and is then dropped. The items after it move with `layout`.
    - Leaving rows aren't in the component's `items`, the agent snapshot or roving focus, so the host's data stays the only truth.
    - With reduced motion the row fades for 120 ms and nothing slides. With `motion="none"`, it leaves at once.
    - This applies to Queue (Task 8) and, in Task 9, to Attachments and Uploader. Components whose children the host renders (Conversation rows, nested steps) can't hold a removed child, so they stay as they are, and their docs say so.
  - **Alternative:** no exit animations; the docs say removed items leave at once. Task 9 is then dropped.
- **D2. Removing a Queue item from the keyboard (spec §2 exception table).** Attachments already handle Delete and Backspace on a focused item (an exception row in spec §2), with a remove badge for the pointer that's hidden from assistive technology. The question is whether Queue does the same.
  - **Recommended:** Queue does the same. The exception row becomes "Attachment and Queue item removal on Delete/Backspace". Each Queue row keeps one Tab stop for the whole list and has no extra focusable buttons.
  - **Alternative:** each row gets a focusable Remove button, which adds one Tab stop per row.
- **D3. Does find in page count as a person? (spec §5, core decisions).** Today a step that find in page opens no longer closes on its own when it completes.
  - **Recommended:** yes. A person searched for the text, so the step stays open. Spec §5 gets one sentence saying so, and the code doesn't change.
- **D4. `title` on Web Components (web decisions).** On `<kind-step>`, the `title` attribute is also HTML's tooltip attribute, so it may show a native tooltip over the whole step. Every Wave 2 Step-based element inherits that attribute.
  - **Recommended:** Task 1 checks in a browser whether the tooltip shows. If it does, the Step base option `title` becomes `label` in both layers. This is a breaking change, allowed before 1.0, and the changeset says so.
- **D5. Version order.** `.changeset/agent-ui-wave-1.md` hasn't been released, and the package is still at `0.0.0`. Changesets merges pending changesets, so the Wave 1 and Wave 2 changesets together would produce `0.1.0`, not `0.2.0`.
  - **Recommended:** merge the 0.1.0 version PR before Task 11. If it hasn't merged by then, Task 11 still adds the Wave 2 changeset and reports that both waves will version together.

## Global Constraints

- **Build on UI SDK (spec §2):**
  - Each component is one `definePrimitive` in `packages/agent-ui/src/core/<component>/`.
  - Each render file calls `createParts` or wraps a UI SDK component.
  - Focus, keys, roving, reordering, panels, announcements and ARIA come from slot declarations, UI SDK components and `@ui-sdk/core` behaviors.
  - Code outside UI SDK only for a spec §2 exception row. A new row is a spec change first.
  - `npm run lint` runs the guard.
- **Read first:** the `ui-sdk` skill, then `node_modules/@ui-sdk/<framework>/docs/llms.txt`, plus the `core.md` sections and component pages each task names. Where the installed docs differ from this plan, follow the docs and add a line to `AGENTS.md` "UI SDK API notes".
- **Names:**
  - Primitives are `kind-<component>`: `kind-status`, `kind-reasoning`, `kind-tool`, `kind-chain-of-thought`, `kind-task`, `kind-plan`, `kind-subagent`, `kind-queue`.
  - Web tags are `kind-<component>` and `kind-<component>-<part>`, in light DOM.
  - React exports are `<Name>` and `<Name><Part>`. Web exports are `define<Name>()`.
  - Registry items are `<component>` and `<component>-web`.
- **Layers (spec §2):** `types` imports nothing, and `core` never imports React, `ai` or Tailwind. Render layers import core only through `@kind-ui/agent-ui/core`.
- **TypeScript:** strict, NodeNext, explicit `.js` imports, named reexports only.
- **Exported primitives** carry the explicit `ReturnType<typeof definePrimitive<…>>` annotation (`AGENTS.md`, "Declaration emit").
- **Web callbacks** are DOM events (`AGENTS.md`, "Web callbacks and availability").
  - A callback whose presence offers an action has a `can-<action>` boolean attribute.
  - Where a bubbling native event inside would take the event's name, the event gets a prefix.
  - Each Wave 2 web file declares its tags in `HTMLElementTagNameMap`.
- **Agent actions (spec §6):**
  - An action is listed only while it's available, through an api getter that returns `undefined` otherwise.
  - Actions run the same code paths as pointer and keyboard input.
  - `plan.accept` and `subagent.cancel` render `data-agent-confirm`, which `agentConfirm: false` turns off.
- **Accessibility (spec §8):**
  - Every root with a role has an accessible name.
  - `announce` is polite and fires only on transitions into `awaiting-input`, `complete`, `error` or `cancelled`, never per streamed token.
  - Every status has an icon and text.
- **Motion:**
  - Every animated primitive takes `motion: "auto" | "reduced" | "none"`.
  - Durations and easings come from `src/core/motion/tokens.ts` and the matching `--kind-duration-*` / `--kind-ease*` CSS tokens.
  - `"reduced"` is at most a 120 ms opacity fade, and `"none"` is instant.
- **Design bar:**
  - Polished in light and dark mode, using `--kind-color-*` tokens only.
  - No layout shift while content streams.
  - Status marks animate between states through the shared status mark (Task 1).
  - Every component PR includes light and dark screenshots, taken with nothing focused.
- **Streaming UX checklist** (`AGENTS.md`): applies to Reasoning, Tool, Chain of Thought and Subagent.
- **Tests:**
  - Fixtures and explicitly resolved deferred promises only: no live services, sleeps or model calls.
  - Build first, then run only the targeted tests.
  - Hand slow work (full browser runs, flake hunts, screenshot sets) to a subagent with only the command and the files it covers.
- **Size:**
  - When a task grows the `./core` entry, raise its limit in `size-budget.json` by the growth `npm run check:size` measures, rounded up to the next 1,000 bytes.
- **Publication:** nothing publishes or deploys. The package stays `"private": true`.
- **Commits** carry `Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>`.
- **References:** name only what the code builds on. Third-party attribution goes only in `THIRD_PARTY_NOTICES.md`.

## Review Focus

1. **Tool output that is falsy:** `output.value` of `0`, `false`, `""` or `null` shows that value, not "no output", and `copyOutput` is listed. Test in Task 4.
2. **Concurrent tools:** updating one tool's `call` never closes another tool, or clears its "Copied" state. Test in Task 4.
3. **Reasoning that jumps from `pending` to `complete`** (a cached answer): it stays closed, never shows or announces "Thinking", and announces "Thought for N s" once. Test in Task 3.
4. **The host removes the Queue item that is being moved:** the move cancels, focus goes to a neighbor, and no `onReorder` fires. Test in Task 8.
5. **A host `onAccept` or `onCancel` that rejects:** the button is enabled again, and a double press calls the host once. Test in Tasks 6 and 7.

---

## File Map

```text
packages/agent-ui/src/types/records.ts                          (+ QueueItem)
packages/agent-ui/src/core/step/base.ts                         (stepBase, bindStepPanel, stepAnnouncement)
packages/agent-ui/src/core/list-focus.ts                        (createListFocus, shared by StepList and item lists)
packages/agent-ui/src/core/leaving.ts                           (mergeLeaving, D1)
packages/agent-ui/src/core/{status,reasoning,tool,chain-of-thought,task,plan,subagent,queue}/{<name>,index}.ts
packages/agent-ui/src/react/<name>.tsx    packages/agent-ui/src/web/<name>.ts
packages/agent-ui/src/styles/{status-mark,status,reasoning,tool,chain-of-thought,task,plan,subagent,queue}.css
packages/agent-ui/tests/core/<name>.test.mjs
packages/agent-ui/tests/fixtures/{react,web}/cases/<name>.*
tests/browser/layer.ts    tests/browser/wave-2/<name>.spec.ts
apps/docs/content/docs/components/<name>.mdx    apps/docs/examples/<name>/basic.tsx
apps/docs/content/docs/showcase/agent-activity.mdx
registry/catalog.mjs    size-budget.json    AGENTS.md    .changeset/agent-ui-wave-2.md
```

## Component task routine

Tasks 2–8 each finish with these steps, after their own failing tests pass. A task lists only what differs.

- [ ] **Registry:** add `<name>` to `components` in `registry/catalog.mjs`, with `uses` naming the items its render files import. Run `node --test scripts/tests/registry.test.mjs`. Expected: PASS.
- [ ] **Docs page:** follow `apps/docs/content/docs/components/step.mdx` and the `write-docs` and `fumadocs` skills.
  - Put one example with a caption on top, then Installation, Composition, Usage, API Reference (`<auto-type-table>` over `<Name>Options`), Agent (`<auto-type-table>` over `Pick<<Name>Api, …>`) and the closing `<Caption>` about Web Components.
  - Add the example as `apps/docs/examples/<name>/basic.tsx`, starting with `"use client"`.
  - Add the page to `components/meta.json`.
  - Run `node --test scripts/tests/docs.test.mjs && npm run build:docs`. Expected: PASS.
- [ ] **Screenshots:** take light and dark screenshots of the docs example, with nothing focused, into `artifacts/screenshots/<name>-{light,dark}.png`. Attach them to the PR with the `github-pr-media` skill.
- [ ] **Size:** run `npm run check:size`, and raise the `./core` limit as the Global Constraints say.
- [ ] **Finish:**
  - Run `unslop` on the diff, then `expert-review`, and fix its findings.
  - Run `npm run check` once, through a subagent. Expected: PASS.
  - Add any new UI SDK difference to `AGENTS.md` "UI SDK API notes".
- [ ] **Commit and PR:** commit `feat(<name>): …`, push, and open the PR on the previous task's branch. The PR reports what was checked by hand in a real browser: keyboard, focus, reduced motion (the media query and the `motion` option), light and dark mode. It also says what wasn't checked.

---

### Task 1: Wave 2 groundwork

Spec §5, §6 Motion; decisions D1–D4.

**UI SDK:** `createRovingFocus`, `createFocusRecovery` and `bindPanel` (`core.md` "Roving Focus", "Focus Recovery", "Panels and Presence"). The motion helper's `exit` and `layout`.

**Files:**
- Create: `packages/agent-ui/src/core/step/base.ts`, `src/core/list-focus.ts`, `src/core/leaving.ts`, `src/styles/status-mark.css`, `tests/browser/layer.ts`
- Modify: `src/core/step/{step,step-list,index}.ts`, `src/core/index.ts`, `src/styles/{step,agent-ui}.css`, and every `src/web/*.ts` (`HTMLElementTagNameMap` entries for the Wave 1 tags)
- Modify: `playwright.config.mjs`, and the `project.name.startsWith(…)` checks in `tests/browser/wave-1/*.spec.ts`
- Modify: the spec (approved decisions D1–D3), `.agents/experts/{core,web,styles}/decisions.md` (move the items this task settles to Resolved)
- Test: `packages/agent-ui/tests/core/{leaving,list-focus}.test.mjs`, `tests/browser/wave-1/step.spec.ts`

**Interfaces:**
- Produces, in `core/step/base.ts`:
  - `stepBase<State extends StepState, Api extends StepApi>(config: { kind?: string; announcement?: (status: StepStatus, title: string) => string | undefined })`. It returns `{ options, state, sync, controlled, api, slots, agent }`, each spreadable into `definePrimitive`.
    - `api(context)` returns `StepApi`, and `slots(slot)` returns the seven Step slots.
    - `announcement` replaces the default `"<title> <outcome>"`, and returning `undefined` keeps the step quiet.
    - Every base slot writes `data-step-part="<slot>"` (`root`, `trigger`, `icon`, `title`, `meta`, `content`, `children`), and the icon slot also writes `data-status-mark`.
  - `bindStepPanel(el: HTMLElement, options: { isOpen(): boolean; isExiting(): boolean; motion(): MotionMode; reveal(event: Event): void; trigger(): HTMLElement | undefined; subscribe(listener: () => void): () => void; exited(): void }): () => void`. This is the content slot's current `bindPanel` call, moved here.
  - `stepAnnouncement(status: StepStatus, title: string): string | undefined`, which returns the current text for a status, or `undefined` for none.
  - `stepPrimitive = definePrimitive({ name: "kind-step", ...stepBase({}) })`. Its behavior and public types don't change.
- Produces, in `core/list-focus.ts`:
  - `createListFocus<State extends { focused: string | null }, Props extends { value: string }>(context, options: { slot: string }): { roving; recovery }`, moved from `step-list.ts`.
  - It includes the "keep the order from before" fallback, and the item slot's `on.keydown` and `bind` read the same way.
  - `stepListPrimitive` uses it.
- Produces, in `core/leaving.ts` (D1):
  - `type Row<T> = { item: T; leaving: boolean }`
  - `mergeLeaving<T extends { id: string }>(rows: readonly Row<T>[], next: readonly T[]): Row<T>[]`:
    - Every item in `next` appears in `next`'s order, with `leaving: false`.
    - A row whose id has left `next` stays at its old place after its previous neighbor, with `leaving: true`.
    - An id that comes back stops leaving.
  - `dropRow<T extends { id: string }>(rows: readonly Row<T>[], id: string): Row<T>[]`.
- Produces `status-mark.css`:
  - Rules keyed on `[data-status-mark][data-status=…]` for every `StepStatus`, plus `skipped`, which draws a minus like `cancelled`. The rules move from `step.css`'s icon block.
  - Under `prefers-reduced-motion: reduce` or `data-motion="reduced"`, the glyph and fill change with opacity only, over `--kind-duration-reduced`, with no `scale`. Under `data-motion="none"`, nothing transitions.
- Produces `step.css` keyed on `[data-step-part=…]` instead of `[data-slot="kind-step-…"]`, so every Step-based component looks the same.
- Produces `tests/browser/layer.ts`:
  - `layerOf(testInfo: TestInfo): "react" | "web"`, from `/-web(-|$)/` on the project name.
  - Wave 1 specs use it instead of `startsWith("wave-1-web")`.
- Produces the Playwright projects `wave-2-react`, `wave-2-web` and `wave-2-react-strict`, matching `wave-2/**/*.spec.ts` on the existing servers, plus their cross-browser twins.

- [ ] **Step 1: Write the failing tests.**

```js
test("a removed item stays in place, leaving", () =>
  assert.deepEqual(mergeLeaving(rows(["a", "b", "c"]), items(["a", "c"])), [row("a"), row("b", true), row("c")]));
test("an item that comes back stops leaving", () =>
  assert.deepEqual(mergeLeaving([row("a"), row("b", true)], items(["a", "b"])), [row("a"), row("b")]));
test("a leaving row follows its neighbor through a reorder", () =>
  assert.deepEqual(mergeLeaving(rows(["a", "b", "c"]), items(["c", "a"])), [row("c"), row("a"), row("b", true)]));
test("dropRow removes only that row", () => assert.deepEqual(dropRow([row("a"), row("b", true)], "b"), [row("a")]));
```

Add to `step.spec.ts`, both layers:
- Each part has its `data-step-part`.
- After `motion="reduced"`, a status change runs no transition on the icon's `transform`.
- With `motion="none"`, a status change runs no transition at all.

- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-1/step.spec.ts`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** the interfaces above. `step.ts`, `step-list.ts` and their render files keep their public behavior. All of `wave-1/step.spec.ts` keeps passing unchanged, apart from the new assertions.
- [ ] **Step 4: D4.** In Chromium, hover a `<kind-step title="Read the logs">`. If a native tooltip shows, rename the option `title` to `label` in `StepOptions`, both render layers, the fixtures, the Step docs page and the spec.
- [ ] **Step 5: Run** `npm run lint && npm run typecheck && npm run test:unit && npx playwright test tests/browser/wave-1`. Expected: PASS.
- [ ] **Step 6:** Write the approved D1–D3 into the spec (§6 Motion bullet, §2 exception row, §5 sentence). Commit `refactor(step): share the Step base, list focus and status mark for Wave 2`, then follow the routine's **Finish** and **Commit and PR** steps.

---

### Task 2: Status

Spec §7 Wave 2 "Status".

**UI SDK:** `definePrimitive` and `announce`. It needs nothing else.

**Files:**
- Create: `packages/agent-ui/src/core/status/{status,index}.ts`, `src/react/status.tsx`, `src/web/status.ts`, `src/styles/status.css`
- Test: `tests/browser/wave-2/status.spec.ts`, plus fixture cases `status`

**Interfaces:**
- Consumes: Task 1's status mark.
- Produces `statusPrimitive` (`kind-status`):
  - Options:
    - `status?: StepStatus`, default `"pending"`.
    - `label?: string`. The defaults are `Pending`, `Running`, `Needs input`, `Complete`, `Failed` and `Cancelled`.
    - `motion`.
  - Slots: `root`, `icon` (`aria-hidden`, `data-status-mark`) and `label` (state `{ label }`).
  - The root has no role. Like Markdown, it's content, it appears in the agent snapshot by kind, and it offers no actions.
  - It announces the label, politely, on transitions into `awaiting-input`, `complete`, `error` or `cancelled` only.
- React: `Status`, `StatusIcon`, `StatusLabel`. Web: `defineStatus()`, `<kind-status>` (fills in its icon and label when it connects empty).

- [ ] **Step 1: Write the failing browser tests**, in both layers:
  - Each status shows its default label and `data-status`.
  - A change from `running` to `complete` announces "Complete" once. Twenty label changes while `running` announce nothing.
  - The badge's height doesn't change across statuses.
  - Under reduced motion, the mark runs no `transform` transition.
  - Axe reports no violations in light or dark mode.
  - The agent snapshot lists `kind-status` with no actions.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-2/status.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** A pill with the mark and the label, in `status.css`. The docs say to put it at the end of a row, since a new label can change its width.
- [ ] **Step 4: Run** the spec, plus `npm run lint && npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Component task routine.** Commit `feat(status): add Status`.

---

### Task 3: Reasoning

Spec §5, §7 Wave 2 "Reasoning".

**UI SDK:** the Step base (`bindPanel`, `announce`), and the Markdown view (`markdownViewPrimitive`) for the content.

**Files:**
- Create: `packages/agent-ui/src/core/reasoning/{reasoning,index}.ts`, `src/react/reasoning.tsx` (renders `./markdown.js`), `src/web/reasoning.ts` (uses `kind-markdown`), `src/styles/reasoning.css`
- Modify: `tests/browser/wave-1/budgets.spec.ts` (Reasoning cases)
- Test: `packages/agent-ui/tests/core/reasoning.test.mjs`, `tests/browser/wave-2/reasoning.spec.ts`

**Interfaces:**
- Consumes: `stepBase`.
- Produces `reasoningTitle(status: StepStatus, durationSeconds?: number): string`:
  - `pending`, `running` and `awaiting-input` give `"Thinking"`.
  - Any other status gives `"Thought for N s"`, with `N = Math.max(1, Math.round(durationSeconds))`, or `"Thought"` when the duration is unknown.
- Produces `reasoningPrimitive` (`kind-reasoning`):
  - It is `stepBase({ kind: "reasoning", announcement })`, plus `text: string`.
  - `announcement` gives:
    - the title on `complete`
    - `"Thinking failed"` on `error`
    - `"Thinking stopped"` on `cancelled`
  - The title slot's state is `{ title }`. A host `title` overrides it.
  - The content holds the Markdown view, with `streaming` while the status is `running`.
  - Agent actions: `expand`, `collapse`.
- React: `Reasoning`, `ReasoningTrigger`, `ReasoningIcon`, `ReasoningTitle`, `ReasoningContent`. Web: `defineReasoning()`.

- [ ] **Step 1: Write the failing tests.**

```js
test("thinking while running", () => assert.equal(reasoningTitle("running"), "Thinking"));
test("rounds the duration, at least 1 s", () => {
  assert.equal(reasoningTitle("complete", 2.6), "Thought for 3 s");
  assert.equal(reasoningTitle("complete", 0.2), "Thought for 1 s");
});
test("no duration", () => assert.equal(reasoningTitle("complete"), "Thought"));
```

Browser tests, both layers:
- It opens on `running` and closes on `complete`.
- A person's toggle stops the automatic behavior.
- Streaming 40 chunks keeps the trigger's bounding box unchanged.
- "Thought for 3 s" is announced once.
- **Review Focus 3:** going from `pending` straight to `complete` stays closed and announces only "Thought for N s".
- Find in page opens the step.
- Reduced motion animates no `height`.
- Axe reports no violations.
- `expectAgentActions(page, "Thought for 3 s", ["collapse", "expand"])`, and `act` with `expand` sets `data-open`.

Budgets: a streamed chunk into a Reasoning after 10 and after 500 blocks parses only the tail block. The DOM-write counts equal the Markdown case's.
- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-2/reasoning.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same commands, plus `npx playwright test tests/browser/wave-1/budgets.spec.ts -g Reasoning` and `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["markdown"]`). Commit `feat(reasoning): add Reasoning on the Step base`.

---

### Task 4: Tool

Spec §4.1 "Tool call and result contract", §7 Wave 2 "Tool".

**UI SDK:** the Step base, Code Block (`codeBlockPrimitive`), the Markdown view, and the `createCopy` clipboard exception (`core/clipboard.ts`).

**Files:**
- Create: `packages/agent-ui/src/core/tool/{tool,format,index}.ts`, `src/react/tool.tsx`, `src/web/tool.ts`, `src/styles/tool.css`
- Modify: `tests/browser/wave-1/budgets.spec.ts` (Tool cases)
- Test: `packages/agent-ui/tests/core/tool.test.mjs`, `tests/browser/wave-2/tool.spec.ts`

**Interfaces:**
- Consumes: `stepBase` and `createCopy`.
- Produces, in `format.ts`:
  - `toolStatus(call: ToolCall): StepStatus`. It checks, in this order:
    1. `outcome === "error"` gives `error`.
    2. `outcome` of `denied` or `cancelled` gives `cancelled`.
    3. `approval.state` of `requested`, `submitting` or `submit-failed` gives `awaiting-input`.
    4. `output?.state === "available"` gives `complete`.
    5. Anything else gives `running`.
  - `toolValue(value: unknown): { kind: "markdown"; text: string } | { kind: "code"; code: string }`:
    - A non-empty string gives Markdown.
    - Anything else gives `JSON.stringify(value, null, 2)` as code. `undefined` gives `"undefined"`, and a value that can't be serialized gives `String(value)`.
  - `approvalLabel(approval?: Approval): string | undefined`:
    - `requested`: "Waiting for approval"
    - `submitting`: "Sending decision"
    - `submit-failed`: "Decision not sent"
    - `responded`: "Approved" or "Denied"
    - `auto`: "Approved automatically" or "Denied automatically"
- Produces `toolPrimitive` (`kind-tool`), which is `stepBase({ kind: "tool" })` plus:
  - Options:
    - `call: ToolCall` (option kind `"value"`).
    - `status?: StepStatus`, which defaults to `toolStatus(call)`.
    - `error?: { message: string }`.
    - `highlight?: Highlight`, passed to both code blocks.
  - The title defaults to `call.name`.
  - Slots:
    - `approval`: the text from `approvalLabel`, plus `data-approval`.
    - `input`: label "Input", with a "Partial" badge and `data-state="streaming"` while `input.state === "streaming"`.
    - `input-copy`: `role: "button"`.
    - `output`: present while `call.output !== undefined`. While `preliminary`, it gets `data-state="preliminary"` and a "Preliminary" badge.
    - `output-copy`: `role: "button"`.
    - `error`: present while `outcome === "error"`. It shows `error.message`, or "The tool failed."
  - The input and output each render a Code Block without its header, so the Tool's own copy buttons are the only ones shown. A Markdown output renders through the Markdown view.
  - API: the base, plus `copyInput(): Promise<boolean>`, and the getter `copyOutput`, which is `undefined` while there's no output. Copied state lasts 2 s, as in Code Block.
  - Agent actions: `expand`, `collapse`, `copyInput`, `copyOutput`.
- React: `Tool`, `ToolTrigger`, `ToolIcon`, `ToolTitle`, `ToolApproval`, `ToolContent`, `ToolInput`, `ToolOutput`, `ToolError`. Web: `defineTool()`.

- [ ] **Step 1: Write the failing tests.**

```js
test("status follows the call", () => {
  assert.equal(toolStatus(call({ input: { state: "streaming", value: {} } })), "running");
  assert.equal(toolStatus(call({ approval: approval("requested") })), "awaiting-input");
  assert.equal(toolStatus(call({ output: { state: "preliminary", value: 1 } })), "running");
  assert.equal(toolStatus(call({ output: { state: "available", value: null } })), "complete");
  assert.equal(toolStatus(call({ outcome: "denied" })), "cancelled");
});
test("falsy output is shown as itself", () => {
  for (const [value, code] of [[0, "0"], [false, "false"], ["", '""'], [null, "null"], [undefined, "undefined"]])
    assert.deepEqual(toolValue(value), { kind: "code", code });
});
test("text output is markdown", () => assert.deepEqual(toolValue("**ok**"), { kind: "markdown", text: "**ok**" }));
test("approval labels", () => assert.equal(approvalLabel(approval("auto", { approved: false })), "Denied automatically"));
```

Browser tests, both layers:
- The "Partial" badge shows while the input streams.
- **Review Focus 1:** `output.value === 0` shows `0`, and the agent snapshot lists `copyOutput`.
- **Review Focus 2:** three tools are open, and one has been copied. Updating the second tool's `call` leaves the first and third open, and the first still "Copied".
- Copy writes the formatted input, through the `clipboard.ts` helper (`tests/browser/clipboard.ts`).
- The header's height doesn't change from `running` through `awaiting-input` to `complete`.
- Axe reports no violations.
- `expectAgentActions(page, "search_docs", ["collapse", "copyInput", "expand"])` holds before any output, and `copyOutput` joins it once output arrives.

Budgets: streaming one tool's input among 10 and among 500 tools writes only that tool's nodes, and React renders only that tool.
- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-2/tool.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same commands, plus `npx playwright test tests/browser/wave-1/budgets.spec.ts -g Tool` and `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["markdown", "code-block"]`). The docs example maps an AI SDK tool part through `fromUIMessagePart`. Commit `feat(tool): add Tool on the Step base`.

---

### Task 5: Chain of Thought

Spec §5, §7 Wave 2 "Chain of Thought".

**UI SDK:** the Step base for the outer step. For the inner steps, the item pattern of UI SDK Accordion (`docs/components/accordion.md`, "Build Your Own"): one primitive owns every item's open state, keyed by `value`, so `expandStep(id)` can reach any of them. Also `createListFocus`, `bindStepPanel` and `announce`.

**Files:**
- Create: `packages/agent-ui/src/core/chain-of-thought/{chain-of-thought,open-steps,index}.ts`, `src/react/chain-of-thought.tsx`, `src/web/chain-of-thought.ts`, `src/styles/chain-of-thought.css`
- Test: `packages/agent-ui/tests/core/chain-of-thought.test.mjs`, `tests/browser/wave-2/chain-of-thought.spec.ts`

**Interfaces:**
- Consumes: `stepBase`, `bindStepPanel`, `stepAnnouncement`, `createListFocus` and `nextOpen`.
- Produces `ChainOfThoughtStep = { id: string; status: StepStatus; title: string; durationSeconds?: number }`.
- Produces `nextOpenSteps(input: { prev: ChainOfThoughtStep[]; next: ChainOfThoughtStep[]; open: string[]; toggled: string[]; autoOpen: StepAutoOpen }): string[]`:
  - It runs `nextOpen` for each step whose status changed. A new step counts as coming from `pending`.
  - Ids that are no longer in `next` drop out.
- Produces `chainOfThoughtPrimitive` (`kind-chain-of-thought`), which is `stepBase({ kind: "chain-of-thought" })` plus:
  - Options:
    - `steps: ChainOfThoughtStep[]` (`"value"`).
    - `openSteps?: string[]`. Passing it controls it.
    - `onOpenStepsChange?: (open: string[], details: ChangeDetails<StepOpenChangeReason>) => void`.
  - Item slots, each with prop `value`:
    - `item`: `data-status`, `data-open`.
    - `item-trigger`: `role: "button"`, roving focus.
    - `item-icon`: the status mark.
    - `item-title`, `item-meta`.
    - `item-content`: bound with `bindStepPanel` and findable.
  - Each item's title is announced through `stepAnnouncement`.
  - API: the base, plus `expandStep(id: string): boolean`. It returns `false` for an unknown id or an open step, and a successful call counts as a toggle.
  - `controlled`: `open`, `status`, `openSteps`.
  - Agent actions: `expand`, `collapse`, `expandStep`.
- React: `ChainOfThought`, `ChainOfThoughtTrigger`, `ChainOfThoughtIcon`, `ChainOfThoughtTitle`, `ChainOfThoughtContent`, `ChainOfThoughtList`, `ChainOfThoughtItem`, `ChainOfThoughtItemTrigger`, `ChainOfThoughtItemIcon`, `ChainOfThoughtItemTitle`, `ChainOfThoughtItemMeta`, `ChainOfThoughtItemContent`. Web: `defineChainOfThought()`.

- [ ] **Step 1: Write the failing tests.**

```js
test("a running step opens and a completed one closes", () =>
  assert.deepEqual(nextOpenSteps({ prev: [s("a", "running")], next: [s("a", "complete"), s("b", "running")], open: ["a"], toggled: [], autoOpen: "running" }), ["b"]));
test("a toggled step keeps its state", () =>
  assert.deepEqual(nextOpenSteps({ prev: [s("a", "running")], next: [s("a", "complete")], open: ["a"], toggled: ["a"], autoOpen: "running" }), ["a"]));
test("removed steps drop out", () =>
  assert.deepEqual(nextOpenSteps({ prev: [s("a", "running")], next: [], open: ["a"], toggled: [], autoOpen: "running" }), []));
```

Browser tests, both layers:
- The item triggers are one Tab stop. ArrowDown, ArrowUp, Home and End move between them.
- Removing the focused item moves focus to a neighbor.
- `act` with `expandStep("b")` opens step b. An unknown id changes nothing.
- An item's completion is announced once. Thirty items appended one at a time announce only their terminal transitions.
- Appending items doesn't move the items above them.
- Reduced motion animates no `height`.
- Axe reports no violations.
- `expectAgentActions(page, "Researching flights", ["collapse", "expand", "expandStep"])`.
- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-2/chain-of-thought.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Item parts share `step.css` through `data-step-part`, so they look like steps.
- [ ] **Step 4: Run** the same commands, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine.** The docs say why items are data rather than nested `Step`s: `expandStep` needs one owner. Commit `feat(chain-of-thought): add Chain of Thought`.

---

### Task 6: Task and Plan

Spec §7 Wave 2 "Task", "Plan"; §6 agent confirmation.

**UI SDK:** the Step base, `createListFocus` over a `list` of focusable `listitem`s (the Attachments shape), and UI SDK Progress parts, composed and styled as Uploader composes them. Plan's accept uses an `"action"` option.

**Files:**
- Create: `packages/agent-ui/src/core/{task,plan}/{<name>,index}.ts`, `src/core/item-list.ts` (the item-list slots both share, spread like `indicator.ts`), `src/react/{task,plan}.tsx`, `src/web/{task,plan}.ts`, `src/styles/{task,plan}.css`
- Test: `packages/agent-ui/tests/core/item-list.test.mjs`, `tests/browser/wave-2/{task,plan}.spec.ts`

**Interfaces:**
- Consumes: `stepBase`, `createListFocus`, and the `TaskItem` and `PlanItem` types.
- Produces `itemProgress(items: { status: string }[], done: readonly string[]): { done: number; total: number; percent: number }`:
  - `percent` is rounded, and it's 0 for an empty list.
  - Task counts `complete` as done. Plan counts `complete` and `skipped`.
- Produces `taskPrimitive` (`kind-task`), which is `stepBase({ kind: "task" })` plus:
  - Option `items: TaskItem[]`.
  - Slots: `list` (`role: "list"`), and, with prop `value`, `item` (`role: "listitem"`, roving focus), `item-icon` (the status mark), `item-title` and `item-files`.
  - The meta part's state is `{ done, total }`, and it renders "2 of 5".
  - Agent actions: `expand`, `collapse`.
- Produces `planPrimitive` (`kind-plan`), which is `stepBase({ kind: "plan" })` plus:
  - Options:
    - `items: PlanItem[]`.
    - `onAccept?: () => unknown` (`"action"`, so a returned promise is tracked).
    - `agentConfirm?: boolean`, default `true`.
  - Slots:
    - Task's item slots, plus `item-description`.
    - `progress`: a Progress whose `value` is `percent`, labeled "N of M steps".
    - `accept`: `role: "button"`, with `aria-disabled` while pending.
  - The root has `data-agent-confirm` while `agentConfirm` is on.
  - The `accept` getter is `undefined` without `onAccept` or while one is pending. A rejected promise makes it available again.
  - Agent actions: `expand`, `collapse`, `accept`.
- React: `Task`, `TaskList`, `TaskItem`, `TaskItemIcon`, `TaskItemTitle`, `TaskItemFiles`, and `Plan`, `PlanList`, `PlanItem`, `PlanItemIcon`, `PlanItemTitle`, `PlanItemDescription`, `PlanProgress`, `PlanAccept`, each with the base step parts.
- Web: `defineTask()`, `definePlan()`. `<kind-plan can-accept>` fires `accept`, and listeners call `event.detail.waitUntil(promise)`.

- [ ] **Step 1: Write the failing tests.**

```js
test("task progress counts complete", () =>
  assert.deepEqual(itemProgress([st("complete"), st("running"), st("error")], ["complete"]), { done: 1, total: 3, percent: 33 }));
test("plan progress counts skipped as done", () =>
  assert.deepEqual(itemProgress([st("complete"), st("skipped")], ["complete", "skipped"]), { done: 2, total: 2, percent: 100 }));
test("empty list", () => assert.deepEqual(itemProgress([], ["complete"]), { done: 0, total: 0, percent: 0 }));
```

Browser tests, both layers:
- The items are one Tab stop with arrow keys between them.
- An item's mark changes when its status does, and runs no `transform` transition under reduced motion.
- The progress has `aria-valuenow` and its label.
- **Review Focus 5:** a double press on Accept calls the host once. A rejected promise enables Accept again.
- Accept is absent without `onAccept` (web: without `can-accept`).
- An agent `accept` is refused without approval. With `agentConfirm={false}`, it runs.
- A status change doesn't move the rows.
- Axe reports no violations.
- `expectAgentActions(page, "Migration plan", ["accept", "collapse", "expand"])`.
- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-2/task.spec.ts tests/browser/wave-2/plan.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same commands, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine**, once for each of `task` and `plan`, as two pages and four registry items in one PR. Commit `feat: add Task and Plan`.

---

### Task 7: Subagent

Spec §7 Wave 2 "Subagent"; §6 agent confirmation.

**UI SDK:** the Step base; the internal Avatar (`internal-avatar`); StepList for the nested steps, which the host renders in the `children` part. `onCancel` is an `"action"` option.

**Files:**
- Create: `packages/agent-ui/src/core/subagent/{subagent,index}.ts`, `src/react/subagent.tsx`, `src/web/subagent.ts`, `src/styles/subagent.css`
- Test: `packages/agent-ui/tests/core/subagent.test.mjs`, `tests/browser/wave-2/subagent.spec.ts`

**Interfaces:**
- Consumes: `stepBase`.
- Produces `initials(name: string): string`. It returns the first letters of the first two words, in upper case, or `"?"` when there are none.
- Produces `subagentPrimitive` (`kind-subagent`), which is `stepBase({ kind: "subagent" })` plus:
  - Options:
    - `agentName: string`.
    - `avatarSrc?: string`.
    - `onCancel?: () => unknown` (`"action"`).
    - `agentConfirm?: boolean`, default `true`.
  - Slots:
    - `avatar`: state `{ name, initials, src }`, rendered through the internal Avatar.
    - `result`: `data-empty` when there's no content. It shows once the status is `complete`.
    - `cancel`: `role: "button"`.
  - The `cancel` getter is listed only while `onCancel` is supplied, the status is `pending`, `running` or `awaiting-input`, and no cancel is pending.
  - Agent actions: `expand`, `collapse`, `cancel`.
- React: `Subagent`, `SubagentAvatar`, `SubagentResult`, `SubagentCancel`, plus the base step parts. Web: `defineSubagent()`. `can-cancel` offers `cancel`, which fires `subagentcancel`.

- [ ] **Step 1: Write the failing tests.**

```js
test("initials", () => {
  assert.equal(initials("Code reviewer"), "CR");
  assert.equal(initials("ada"), "A");
  assert.equal(initials("  "), "?");
});
```

Browser tests, both layers:
- Nested steps in the children part keep their own single Tab stop.
- The result shows on `complete`.
- Cancel is absent without `onCancel`, and gone after `complete`.
- **Review Focus 5:** a double press on Cancel calls the host once, and a rejected promise enables Cancel again.
- An agent `cancel` needs approval.
- Without an image, the avatar shows its initials.
- Nested steps streaming in don't move the header.
- Axe reports no violations.
- `expectAgentActions(page, "Code reviewer", ["cancel", "collapse", "expand"])`.
- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-2/subagent.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same commands, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-avatar"]`). Commit `feat(subagent): add Subagent`.

---

### Task 8: Queue

Spec §7 Wave 2 "Queue"; decisions D1, D2.

**UI SDK:**
- `createReorder` and `reorderMessage` (`core.md` "Reordering": "Sort a List" and "What's Read Out").
- `createListFocus`, with the reorder handler running before roving focus.
- The internal Collapsible for the Queued and Completed sections.
- The motion helper's `exit` and `layout` for leaving rows (D1).
- **Exception (D2):** Delete and Backspace remove the focused row.

**Files:**
- Modify: `packages/agent-ui/src/types/records.ts` (+ `QueueItem`), `src/types/index.ts`, `scripts/ui-sdk-exceptions.json` (D2 row)
- Create: `packages/agent-ui/src/core/queue/{queue,index}.ts`, `src/react/queue.tsx`, `src/web/queue.ts`, `src/styles/queue.css`
- Test: `tests/browser/wave-2/queue.spec.ts`

**Interfaces:**
- Consumes: `createListFocus`, `mergeLeaving`, `dropRow` and the status mark.
- Produces `QueueItem { id: string; title: string; description?: string; status: "pending" | "complete" }`.
- Produces `queuePrimitive` (`kind-queue`):
  - Options:
    - `items: QueueItem[]` (`"value"`).
    - `label?: string`, default `"Queue"`.
    - `onReorder?: (id: string, index: number, details: ChangeDetails<"drag" | "move-key" | "imperative">) => void`.
    - `onRemove?: (id: string) => void`.
    - `motion`.
  - State:
    - `rows: Row<QueueItem>[]`, from `mergeLeaving`.
    - `moving: ReorderDraft | null`.
    - `focused`.
  - The host owns the order. A drop calls `onReorder`, and the list shows the host's next `items`.
  - Slots:
    - `root`: `role: "region"`, named by `label`.
    - `section`: prop `value` of `"pending"` or `"complete"`, with state `{ count }`.
    - `list`: `role: "list"`, `aria-roledescription="sortable list"`.
    - `item`: prop `value`; `role: "listitem"`, `aria-roledescription="sortable item"`, `aria-describedby` pointing at the instructions part. It's `inert` and `aria-hidden` while leaving.
    - `item-icon`, `item-title`, `item-description`.
    - `item-remove`: pointer only and hidden from assistive technology, like Attachments'.
    - `instructions`.
  - Only pending rows can be picked up.
  - API:
    - `reorder(id: string, index: number): boolean`, through `reorder.move`. Its getter is listed only while `onReorder` is supplied and there are two or more pending items.
    - `remove(id: string): boolean`. Its getter is listed only while `onRemove` is supplied and there's at least one item.
  - Agent actions: `reorder`, `remove`. `controlled`: `items`.
  - It announces through `reorderMessage`, with each item's title as its `label`.
- React: `Queue`, `QueueSection`, `QueueList`, `QueueItem`, `QueueItemIcon`, `QueueItemTitle`, `QueueItemDescription`, `QueueItemRemove`, `QueueInstructions`.
- Web: `defineQueue()`. `can-reorder` and `can-remove` offer the actions, which fire `reorder` (`detail: { id, index }`) and `remove` (`detail: { id }`).

- [ ] **Step 1: Write the failing browser tests**, in both layers:
  - Space, ArrowDown, Space on the first row calls `onReorder("a", 1)`, with `source` `keyboard` and reason `move-key`. The move is announced, and Escape cancels it.
  - Dragging a row calls `onReorder` with reason `drag`.
  - Delete on a focused row calls `onRemove`. When the host removes the row, it leaves with `inert` and is gone once its exit ends, and focus moves to a neighbor.
  - **Review Focus 4:** the host removes the row being moved. The move cancels, no `onReorder` fires, and focus moves to a neighbor.
  - Without `onReorder` and `onRemove` (web: without `can-*`), no row can be picked up or removed.
  - Completed rows can't be picked up, and the Completed section starts closed.
  - Under reduced motion, a leaving row only fades, and its neighbors don't slide.
  - Axe reports no violations.
  - `expectAgentActions(page, "Queue", ["remove", "reorder"])`, and `act("reorder", "c", 0)` calls `onReorder("c", 0)` with source `agent`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-2/queue.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** Follow `core.md` "Sort a List" for the slot `on` order. Leaving rows play `exit(el, "fade")`, then `dropRow`, and the rows after them run `layout` from rects measured before the drop.
- [ ] **Step 4: Run** the spec, plus `npm run lint && npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-collapsible"]`). Commit `feat(queue): add Queue with keyboard and pointer reordering`.

---

### Task 9: Exits for Attachments and Uploader (D1)

Skip this task if D1 is declined. Closes the styles items "Removed chips leave without an exit animation" and "Uploader rows leave without an exit animation", and the core item "The uploader's `mounted` set never forgets ids".

**Files:**
- Modify: `packages/agent-ui/src/core/{attachments,uploader}/*.ts`, `src/react/{attachments,uploader}.tsx`, `src/web/{attachments,uploader}.ts`
- Test: `tests/browser/wave-1/{composer,uploader}.spec.ts`

**Interfaces:**
- Consumes: `mergeLeaving` and `dropRow`.
- Changes no public type. `items` and the agent snapshot still hold only host items.

- [ ] **Step 1: Write the failing tests**, in both layers:
  - A removed chip or row is `inert` while it leaves, and is gone afterward.
  - The items after it end where they were going, with no jump. Check each one's `getBoundingClientRect` at the end of the move.
  - An uploader item removed and added again under the same id plays its entrance.
  - Focus recovery still moves to a neighbor.
  - Under reduced motion, there's only a fade.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-1/composer.spec.ts tests/browser/wave-1/uploader.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement**, the same way as Queue's leaving rows. The uploader forgets an id when its row is dropped.
- [ ] **Step 4: Run** the same specs, plus `npx playwright test tests/browser/wave-1/budgets.spec.ts` and `npm run lint`. Expected: PASS.
- [ ] **Step 5:** Move the three decisions items to Resolved. Take screenshots of a chip and a row mid-exit, then follow the routine's **Finish** and **Commit and PR** steps. Commit `feat: animate removed attachments and uploads out`.

---

### Task 10: Wave 2 agent conformance

Spec §6 "Agent actions", §10 "Agent actions". Each component's own snapshot is already tested in Tasks 2–8. This task covers the bridge behaviors they share, as Wave 1 Task 13 did.

**Files:**
- Modify: `packages/agent-ui/tests/fixtures/{react,web}/cases/agent.*` (a `case=wave-2` page with all eight components, each with an accessible name where it has a role)
- Test: `tests/browser/wave-2/agent.spec.ts`

- [ ] **Step 1: Write the test**, in both layers:
  - The snapshot lists all eight components. Status appears by kind.
  - Each listed action runs once through `act`, and once through a person's input on a fresh page. The attributes and text match, apart from inline styles and `tabindex`.
  - Change callbacks (`onOpenChange`, `onOpenStepsChange`, `onReorder`) receive `details.source === "agent"`, and a cancelling callback leaves the state unchanged.
  - `plan.accept` and `subagent.cancel` are refused when the permission callback denies them.
  - On web, `can-accept`, `can-cancel`, `can-reorder` and `can-remove` add and remove their actions.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-2/agent.spec.ts`. Expected: PASS. Fix the owning primitive for any failure.
- [ ] **Step 3: Commit** `test: add Wave 2 agent conformance`, then follow the routine's **Finish** and **Commit and PR** steps.

---

### Task 11: Showcase, docs index and the Wave 2 changeset

Spec §7 (a showcase page per wave), §9.1, §9.5; decision D5.

**Files:**
- Create: `apps/docs/content/docs/showcase/{agent-activity.mdx,meta.json}`, `apps/docs/examples/showcase/agent-activity.tsx`, `.changeset/agent-ui-wave-2.md`
- Modify: `apps/docs/content/docs/{meta.json,index.mdx}`, `packages/agent-ui/README.md` (component list), `scripts/tests/docs.test.mjs`

**Interfaces:**
- The showcase plays one scripted agent run on a Replay button:
  - Status and Reasoning stream first.
  - Then two concurrent Tools run, one asking for approval and shown as status.
  - Then a Plan, with Accept.
  - Then a Subagent with nested steps.
  - A Queue holds follow-up prompts.
- `.changeset/agent-ui-wave-2.md` is `"@kind-ui/agent-ui": minor`, and it lists the eight components and any D4 rename as a breaking change.

- [ ] **Step 1: Write the failing test.** `docs.test.mjs`: the sidebar lists a Showcase section with `agent-activity`, and the page holds one `<Example>`.
- [ ] **Step 2: Run** `node --test scripts/tests/docs.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.** Write the page in the site's voice, following `write-docs`.
- [ ] **Step 4: D5.** Check `.changeset/` and `packages/agent-ui/package.json`. If the Wave 1 changeset is still pending, say in the PR that both waves will version together as 0.1.0.
- [ ] **Step 5: Run** `npm run build:docs`, then `npm run check` through a subagent. Expected: PASS. `check:registry-consumers` installs all 21 visible React items and their 21 web twins.
- [ ] **Step 6:** Take light and dark screenshots of the showcase. Run `unslop` and `expert-review`. Commit `docs: add the Wave 2 showcase and changeset`, push, and open the PR. Don't publish, version or deploy.

---

## How this plan builds on UI SDK

| Requirement | Where |
| --- | --- |
| One `definePrimitive` per component, `createParts` per render file | Guard in `npm run lint`, every task |
| Shared Step behavior lives in one place | Task 1's `stepBase`, spread by Tasks 3–7 |
| Roving focus, focus recovery, reorder and announcements come from `@ui-sdk/core` | `createListFocus` (Task 1), `createReorder` and `reorderMessage` (Task 8), `announce` |
| Every component is a live UI SDK primitive with its actions | `expectAgentActions` in Tasks 2–8, and Task 10 |
| Hand-written code only for spec §2 rows | Queue's Delete/Backspace (D2) is the only new row |

## Self-Review Notes

- **Spec coverage:**
  - The §7 Wave 2 rows and behavior requirements: Tasks 2–8.
  - §5 Step base for Reasoning, Chain of Thought, Tool, Task, Plan and Subagent: Task 1, then Tasks 3–7.
  - §4.1 tool and approval contracts as status: Task 4.
  - §6 Motion: Task 1, and Task 9 for exits.
  - §6 Agent actions and confirmation: Tasks 6, 7 and 10.
  - §8: axe, keyboard and announcement checks in each task.
  - §9.1 and §9.5: Task 11 and each task's docs page.
  - §10 count budgets for the components that stream: Tasks 3 and 4.
- **Out of scope:**
  - Approve and deny controls in Tool, which arrive with Confirmation in Wave 3.
  - The Wave 1 showcase page, which Wave 1 didn't ship.
  - Open decisions items no Wave 2 component reaches, like the late-button retarget in `kind-step-list-item`, which needs an upstream fix.
