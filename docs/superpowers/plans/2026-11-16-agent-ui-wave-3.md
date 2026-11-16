# `@kind-ui/agent-ui` Wave 3 (0.3) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Each task is one session and one stacked PR: Task 1 stacks on this plan's PR, and each later task stacks on the one before.

**Goal:** Ship Wave 3, "human input": Confirmation, Question, Checkpoint, Model Selector, Reasoning Effort, Suggestion, Context Meter, Feedback, Notice and Guardrail Notice, in React and Web Components, with registry items, docs pages, a showcase page and the 0.3.0 changeset.

**Architecture:** Every Wave 3 component is one `definePrimitive` that composes UI SDK components the way Composer composes Token Input: the primitive owns options, state, announcements and agent actions, and hands the UI SDK component its props through slot state. One shared pending-action helper carries the §4.1 lock (synchronous disable, retry on failure, stale results ignored) for Confirmation, Question, Checkpoint and Feedback, and Plan and Subagent move onto it. Confirmation is the only place approve and deny render; Tool embeds it. Notice and Guardrail Notice share one base, as the indicators share `indicator.ts`.

**Tech Stack:** Unchanged. `@ui-sdk/core`, `@ui-sdk/react` and `@ui-sdk/web` stay at `0.1.0-beta.1`, `motion` at `14.14.0`. No new runtime dependency.

**Spec:** `docs/superpowers/specs/2026-11-14-agent-ui-design.md`: §2 "Building on UI SDK" and "Internal general components", §4.1 approval and composer contracts, §4.2 `Approval`, §6 Motion and Agent actions, §7 Wave 3, §8. Also read `AGENTS.md` ("UI SDK API notes", Verification policy, the streaming UX checklist) and `.agents/experts/*/decisions.md`.

## Decisions

Decided 2026-11-16, as recommended. D3, D4 and D6–D10 are written into spec §2, §6 and §7, and D1 and D5 into §6. Task 1 moves D1 to Settled in core `decisions.md`.

- **D1. Agent confirmation for Queue `reorder`/`remove`, Uploader `cancel` and Attachments `remove`.** Spec §6 doesn't list them, and core `decisions.md` holds it open.
  - **Decided: don't add them.** UI SDK's bridge reads `data-agent-confirm` per component, not per action (AGENTS.md, Composer "Agent confirm"), so marking Queue would also gate `reorder`, and marking Uploader would gate `retry`. Each action is reversible or low-stakes for the draft it touches. The Queue, Uploader and Attachments docs pages gain one `allow` example showing how a host requires a person for any of them. Task 1 moves the item to Settled.
- **D2. Fix four cross-cutting open items in Wave 3 groundwork.** **Decided: yes, all four, as Task 2**, so Wave 3 builds on them and the showcase doesn't inherit them:
  - **`"use client"`:** every `src/react/**/*.tsx` render file starts with `"use client";`, so a Next.js App Router consumer imports registry items without wrapping them. Vite ignores it and the registry copies it byte-for-byte.
  - **React error #418 on every docs page:** find the mismatching markup with a development build of the static export and fix its cause in the render file or docs layout. No `suppressHydrationWarning`.
  - **Composer attachments area jumps 48px:** play `expand` on the area when its first chip arrives and hide it after the last chip's exit and the collapse end (styles `decisions.md`).
  - **Last chip removed leaves focus on `<body>`:** the composer gives the attachments' focus recovery the editor as its fallback.
- **D3. Context Meter details open on press, through Popover, not Hover Card.** UI SDK Hover Card's trigger must be a link, and its docs say touch and screen reader users may never open it. **Decided: Popover with its "Open on Hover" option**, so the details open on hover, focus and press. Spec §2's internal table and §7 say so.
- **D4. Name "Context" `ContextMeter`.** `Context`, `ContextTrigger` and `kind-context` read as React Context and clash with every primitive's `context` parameter. **Decided: `ContextMeter`, `kind-context-meter`, registry items `context-meter` and `context-meter-web`.** Spec §2 and §7 use the new name.
- **D5. Wave 3 actions spec §6 doesn't list for confirmation** (`suggestion.pick`, `feedback.rate`, `feedback.submitComment`, `notice.dismiss`, `modelSelector.setValue`, `reasoningEffort.setValue`). **Decided: none render `data-agent-confirm`.** A host whose `onPick` sends a prompt gates it with `allow`, as D1; the Suggestion page shows how.
- **D6. Question with several questions.** "One question or a sequence" (spec §7) doesn't say how a sequence shows. **Decided: one form, every question as its own fieldset, one Submit.** Nothing required hides on a later page, `select(questionId, …)` reaches any question, and the form's height only grows as the host adds questions. Paging can come later as an option.
- **D7. Checkpoint `restore` from an agent.** **Decided: `checkpoint.restore` opens the Alert Dialog, the same code path as a press** (spec §6), and only the dialog's Restore button calls `onRestore`. With `data-agent-confirm` on the root, an agent needs a person twice: once for the action, once in the dialog.
- **D8. Confirmation's deny reason.** **Decided: a `reason` option (default off) shows a Textarea above the choices from the start, and Deny sends its text.** No second step, and nothing appears or moves when Deny is pressed. `deny(reason?)` from an agent fills it.
- **D9. Feedback comment.** **Decided: an "Add a comment" button appears once a rating is set and the host supplies `onComment`; it opens a Popover with a Textarea and Send.** Rating never opens a popup by itself, so focus moves only when a person asks.
- **D10. Dismissing a Notice.** **Decided:** Dismiss plays the `"fade"` exit through the motion helper, then calls `onDismiss`; the host removes the notice. Before the exit, focus moves to the element a `focusFallback` option returns, else to the next focusable element after the notice (Task 10 checks `core.md` "Focus Recovery" for UI SDK's way to find it and records it in the API notes). A host that removes a notice without Dismiss removes it at once, as with any host-rendered child (spec §6).
- **D11. Version order (a note, not a decision).** The Wave 3 changeset lands after the 0.2.0 version PR (#40) merges, or both waves version together.

## Global Constraints

- **Build on UI SDK (spec §2):**
  - Each component is one `definePrimitive` in `packages/agent-ui/src/core/<component>/`, and each render file calls `createParts` or wraps a UI SDK component. `npm run lint` runs the guard.
  - Focus, keys, roving, popups, dismissal, dialogs, announcements and ARIA come from slot declarations, UI SDK components and `@ui-sdk/core` behaviors. Code outside UI SDK only for a spec §2 exception row; a new row is a spec change first. Wave 3 needs no new row.
  - A UI SDK component a primitive composes follows the Composer pattern: the slot's `state` hands its props (memoized in `api.partState` so identity holds), React passes them as props, and web writes them onto the `ui-*` element in the root's `render` hook.
  - A component composes the internal wrapper (`src/{react,web}/internal/<name>`) where its look fits, else the bare UI SDK parts styled from its own stylesheet, as Composer and Uploader do. The first task to need a wrapper that doesn't exist adds it, in both layers, following `internal/avatar.*`, and adds it to `internal` in `registry/catalog.mjs`. The task says which.
- **Read first:** the `ui-sdk` skill, `node_modules/@ui-sdk/<framework>/docs/llms.txt`, and the component pages each task names. Where the installed docs differ from this plan, follow the docs and add a line to `AGENTS.md` "UI SDK API notes".
- **Names:** primitives `kind-<component>`; web tags `kind-<component>[-<part>]` in light DOM, declared in `HTMLElementTagNameMap`; React `<Name>`, `<Name><Part>`; web `define<Name>()`; registry items `<component>` and `<component>-web`.
- **Layers, TypeScript, declaration emit, web callbacks:** as in Wave 2. Exported primitives carry the explicit `ReturnType<typeof definePrimitive<…>>` annotation. Web callbacks are DOM events; a callback whose presence offers an action has a `can-<action>` attribute.
- **Agent actions (spec §6):** listed only while available, through api getters that return `undefined` otherwise; same code paths as pointer and keyboard. `confirmation.approve`/`deny` always render `data-agent-confirm`; `checkpoint.restore` and `question.submit` render it unless `agentConfirm: false`. Actions that take an id refuse an unknown one and list their ids through `agent.items` (`closed: true`), as Chain of Thought does.
- **Approval contract (§4.1):** one implementation, Task 3's Confirmation over Task 1's `createPendingAction`. Tool embeds it and Plan and Subagent share the helper. No other component renders approve or deny.
- **Accessibility (spec §8):** every root with a role is named; `announce` is polite except Guardrail Notice when it blocks; announcements fire on outcomes only; every status has an icon and text.
- **Motion:** every animated primitive takes `motion: "auto" | "reduced" | "none"`; durations and easings come from `src/core/motion/tokens.ts` and `--kind-duration-*`/`--kind-ease*`; `"reduced"` is at most a 120 ms opacity fade, `"none"` is instant. Popups and dialogs animate through UI SDK's `data-starting-style`/`data-ending-style` in CSS, keyed on `data-motion` and `prefers-reduced-motion`.
- **Design bar:** polished in light and dark through `--kind-color-*` tokens only. No layout shift: a part that comes and goes (an error, an outcome, a counter) has a reserved place or replaces a part of the same size. Every component PR has light and dark screenshots, taken with nothing focused unless they show focus.
- **Streaming UX checklist** (`AGENTS.md`): "Approvals keep their outcome" applies to Confirmation (and Tool through it), Question and Checkpoint; "Mount-only pop-in" to Suggestion and Notice.
- **Tests never slow implementation:** build first, then run the task's unit tests and its one browser spec. Each component gets an `expectAgentActions` snapshot check and a smoke test (renders, keyboard path, axe in light and dark) in both layers. `npm run check` runs once before push, through a subagent; so do screenshot sets and flake hunts. Fixtures and explicitly resolved deferred promises only.
- **Size:** when a task grows the `./core` entry, raise its `size-budget.json` limit by the measured growth, rounded up to the next 1,000 bytes.
- **Publication:** nothing publishes or deploys; the package stays `"private": true`.
- **Commits** carry `Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>`.
- **References:** name only what the code builds on. Third-party attribution goes only in `THIRD_PARTY_NOTICES.md`.

## Review Focus

1. **A replaced approval generation:** approve is pending for generation 1, the host sends generation 2, then generation 1's promise rejects. Generation 2's choices are enabled and show no error; a late resolve is ignored too. Task 3.
2. **`submit-failed`:** both choices are enabled again, "Decision not sent" is announced once by Confirmation, and the Tool around it announces nothing more. Task 3.
3. **Approve then Deny within one task:** the host gets one call. Task 3; the same double-press check in Tasks 4, 5 and 9.
4. **Question required answers:** `submit` isn't offered until every required question has an answer, and a rejected submit keeps every answer. Task 4.
5. **Restore that rejects:** the dialog stays open with the error, Restore works again, and the dialog returns focus to the trigger when it closes. Task 5.

---

## File Map

```text
packages/agent-ui/src/types/records.ts                 (+ Question, QuestionOption, Answers, ModelOption, SuggestionItem, TokenUsage)
packages/agent-ui/src/core/pending.ts                  (createPendingAction)
packages/agent-ui/src/core/approval.ts                 (approvalKey, isActionable, approvalLabel moved from tool/format.ts)
packages/agent-ui/src/core/notice/base.ts              (noticeBase, shared with guardrail-notice)
packages/agent-ui/src/core/{confirmation,question,checkpoint,model-selector,reasoning-effort,suggestion,context-meter,feedback,notice,guardrail-notice}/{<name>,index}.ts
packages/agent-ui/src/react/<name>.tsx    packages/agent-ui/src/web/<name>.ts
packages/agent-ui/src/{react,web}/internal/{textarea,radio,checkbox,tooltip,alert-dialog,popover,combobox,segmented-control,carousel,meter}.*   (as tasks need them)
packages/agent-ui/src/styles/<name>.css    src/styles/status-mark.css (info, warning)
packages/agent-ui/tests/core/<name>.test.mjs
packages/agent-ui/tests/fixtures/{react,web}/cases/<name>.*
tests/browser/wave-3/<name>.spec.ts
apps/docs/content/docs/components/<name>.mdx    apps/docs/examples/<name>/basic.tsx
apps/docs/content/docs/showcase/human-input.mdx
registry/catalog.mjs    size-budget.json    AGENTS.md    .changeset/agent-ui-wave-3.md
```

## Component task routine

Tasks 3–10 each finish with these steps after their own tests pass. A task lists only what differs.

- [ ] **Registry:** add `<name>` to `components` in `registry/catalog.mjs`, `uses` naming the items its render files import, and any new `internal` entry. Run `node --test scripts/tests/registry.test.mjs`. Expected: PASS.
- [ ] **Docs page:** follow `apps/docs/content/docs/components/step.mdx` and the `write-docs` and `fumadocs` skills: one captioned example on top, then Installation, Composition, Usage, API Reference (`<auto-type-table>` over `<Name>Options`), Agent (`<auto-type-table>` over `Pick<<Name>Api, …>`) and the closing `<Caption>` about Web Components. Add `apps/docs/examples/<name>/basic.tsx` (starting with `"use client"`) and the page to `components/meta.json`, in a "Human input" group after Queue. Run `node --test scripts/tests/docs.test.mjs && npm run build:docs`. Expected: PASS.
- [ ] **Screenshots:** light and dark screenshots of the docs example, nothing focused, into `artifacts/screenshots/<name>-{light,dark}.png`, attached to the PR with the `github-pr-media` skill. A component with a popup or dialog adds one of it open.
- [ ] **Size:** `npm run check:size`, and raise the `./core` limit as the Global Constraints say.
- [ ] **Finish:** run `unslop` on the diff, then `expert-review`, and fix its findings. Run `npm run check` once, through a subagent. Expected: PASS. Add any new UI SDK difference to `AGENTS.md` "UI SDK API notes", and move any `decisions.md` item the task settles to Resolved.
- [ ] **Commit and PR:** commit `feat(<name>): …`, push, and open the PR on the previous task's branch. The PR reports what was checked by hand in a real browser (keyboard, focus, reduced motion through the media query and the `motion` option, light and dark) and what wasn't.

---

### Task 1: Wave 3 groundwork

Spec §4.1 approval contract, §6 Agent actions; decision D1.

**UI SDK:** `createFocusRecovery`, `announce`. No component yet.

**Files:**
- Create: `packages/agent-ui/src/core/{pending,approval}.ts`
- Modify: `src/types/{records,index}.ts`, `src/core/{plan/plan,subagent/subagent,tool/format,tool/tool,index}.ts`
- Modify: `playwright.config.mjs` (projects `wave-3-react`, `wave-3-web`, `wave-3-react-strict` and their cross-browser twins), `scripts/affected-specs.mjs` if it names waves
- Modify: `.agents/experts/core/decisions.md` (D1 to Settled), the Queue, Uploader and Attachments docs pages (D1's `allow` example)
- Test: `packages/agent-ui/tests/core/{pending,approval}.test.mjs`, existing `tests/browser/wave-2/{plan,subagent}.spec.ts`

**Interfaces:**
- `core/pending.ts`:
  - `createPendingAction<State>(context, options: { state: KeysMatching<State, boolean>; key?: () => string }): { run(call: () => unknown): Promise<"done" | "failed" | "stale"> | undefined; release(): void }`.
  - `run` returns `undefined` and calls nothing while pending; otherwise it sets the state key synchronously, calls `call` (a throw counts as a rejection), and settles. A result after `destroy`, `release` or a change of `key()` since the call started is `"stale"` and writes nothing; otherwise the key clears.
  - Plan's `accept` and Subagent's `cancel` move onto it with no change in behavior.
- `core/approval.ts`:
  - `approvalKey(approval: Approval): string` (`approvalId:generation`).
  - `isActionable(approval?: Approval): boolean`: `requested` or `submit-failed`.
  - `approvalLabel` moves here from `tool/format.ts`, reexported where it was.
- `types/records.ts`:
  - `QuestionOption { value: string; label: string; description?: string }`
  - `Question { id: string; prompt: string; kind: "single" | "multiple" | "text"; options?: QuestionOption[]; required?: boolean; placeholder?: string }`
  - `Answers = Record<string, string | string[]>`
  - `ModelOption { id: string; name: string; group?: string; description?: string; disabled?: boolean }`
  - `SuggestionItem { id: string; label: string; description?: string }`
  - `TokenUsage { input?: number; output?: number; reasoning?: number; cached?: number }`

- [ ] **Step 1: Write the failing tests.**

```js
test("a second run waits for the first", async () => {
  const { action, store } = setup();
  const first = deferred();
  action.run(() => first.promise);
  assert.equal(action.run(() => {}), undefined);
  assert.equal(store.get().pending, true);
});
test("a result after the key changed is stale", async () => {
  const { action, store, setKey } = setup();
  const call = deferred();
  const result = action.run(() => call.promise);
  setKey("b:2");
  call.reject(new Error("late"));
  assert.equal(await result, "stale");
});
test("a throw releases like a rejection", async () =>
  assert.equal(await setup().action.run(() => { throw new Error("x"); }), "failed"));
test("actionable approvals", () => {
  assert.equal(isActionable(approval("submit-failed")), true);
  assert.equal(isActionable(approval("submitting")), false);
});
```

- [ ] **Step 2: Run** `npm run test:unit`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** the interfaces, then move Plan and Subagent onto `createPendingAction`.
- [ ] **Step 4: Run** `npm run lint && npm run typecheck && npm run test:unit && npx playwright test tests/browser/wave-2/plan.spec.ts tests/browser/wave-2/subagent.spec.ts`. Expected: PASS, with Wave 2's double-press and rejection tests unchanged.
- [ ] **Step 5:** Move D1 to Settled in core `decisions.md` and add the `allow` example to the three pages. Commit `refactor: share the pending action and approval helpers for Wave 3`, then follow the routine's **Finish** and **Commit and PR** steps.

---

### Task 2: Wave 1 and 2 follow-ups (D2)

Closes the four open items D2 names.

**Files:**
- Modify: every `packages/agent-ui/src/react/**/*.tsx` (first line `"use client";`), `scripts/tests/registry.test.mjs`
- Modify: the docs render path that mismatches (found in Step 3), `src/core/{composer,attachments}/*.ts`, `src/react/composer.tsx`, `src/web/composer.ts`, `src/styles/composer.css`
- Modify: `.agents/experts/{core,styles,react}/decisions.md`
- Test: `tests/browser/wave-1/composer.spec.ts`, `scripts/tests/docs.test.mjs`

- [ ] **Step 1: Write the failing tests.**
  - `registry.test.mjs`: every React item file starts with `"use client";`.
  - `composer.spec.ts`, both layers: adding the first attachment moves `kind-composer-input`'s top by under 1px per frame across the whole change (sampled each `requestAnimationFrame`), and removing the last does the same; under `motion="none"` it moves at once. Removing the last chip with Delete leaves focus in the editor.
  - `docs.test.mjs` (or a small Playwright check over the static export served from `apps/docs/out`): opening three pages logs no React error.
- [ ] **Step 2: Run** the three. Expected: FAIL.
- [ ] **Step 3: Implement.** For #418, load a page from a development build of the export, read which element mismatches, and fix its server markup at the source. Composer: play `expand`/collapse on the attachments area through the motion helper, keeping it shown while its last chip leaves (as now) and until the collapse ends; give the attachments' `createFocusRecovery` the editor as fallback.
- [ ] **Step 4: Run** the same tests, plus `npx playwright test tests/browser/wave-1/budgets.spec.ts` and `npm run lint`. Expected: PASS.
- [ ] **Step 5:** Move the four items to Resolved. Screenshot the composer mid-expand. Run `unslop` and `expert-review`, then `npm run check` through a subagent. Commit `fix: client directive, docs hydration and composer attachments follow-ups`, push, open the PR.

---

### Task 3: Confirmation, and approvals in Tool

Spec §4.1 approval contract, §7 Wave 3 "Confirmation"; D8. Closes core's "Decision not sent isn't announced".

**UI SDK:** Button and Textarea (`docs/components/{button,textarea}.md`), `announce`, `createFocusRecovery`. Adds `internal-textarea`.

**Files:**
- Create: `packages/agent-ui/src/core/confirmation/{confirmation,index}.ts`, `src/react/confirmation.tsx`, `src/web/confirmation.ts`, `src/styles/confirmation.css`, `src/{react,web}/internal/textarea.*`
- Modify: `src/core/tool/tool.ts`, `src/react/tool.tsx`, `src/web/tool.ts`, `src/styles/tool.css`, `apps/docs/content/docs/components/tool.mdx`
- Test: `packages/agent-ui/tests/core/confirmation.test.mjs`, `tests/browser/wave-3/confirmation.spec.ts`, `tests/browser/wave-2/tool.spec.ts`

**Interfaces:**
- Consumes: `createPendingAction` (keyed by `approvalKey`), `isActionable`, `approvalLabel`, the status mark.
- Produces `confirmationPrimitive` (`kind-confirmation`):
  - Options: `approval: Approval` (`"value"`); `label: string` (names the group, for example "Run search_docs?"); `onApprove?` and `onDeny?`, `"action"` options called with `{ approvalId, generation, reason? }`; `reason?: boolean` (D8); `approveLabel` and `denyLabel`, default "Approve" and "Deny"; `motion`.
  - State: `pending: "approve" | "deny" | null`, `reasonText`, and the outcome from `approvalLabel`.
  - Lock (§4.1): a press sets `pending` synchronously and disables both choices with `aria-disabled`, so focus stays. Host `submitting` keeps the lock; `submit-failed` releases it while the generation is current; a new `approvalKey` drops it and makes older results stale; `responded` and `auto` end it.
  - Announcements, once per generation: "Decision not sent" on entering `submit-failed`; the outcome ("Approved", "Denied", "Approved automatically" …) on entering `responded` or `auto`. Nothing on `requested` or `submitting`.
  - Slots: `root` (`role: "group"`, named by `label`, `data-state`, always `data-agent-confirm`); `reason` (internal Textarea, present while `reason` and actionable); `approve` and `deny` (`role: "button"`, present while their callback is set and the approval is actionable or pending); `outcome` (status mark and text, present for `submitting`, `submit-failed`, `responded` and `auto`); `error` ("Decision not sent. Try again.", present for `submit-failed`).
  - Layout: the choices row and the outcome row share one height, so a decision swaps them in place. When a choice leaves while focused, `createFocusRecovery` moves focus to a `focusFallback` option's element (Tool passes its trigger), else to the outcome; Step 3 records how the outcome takes focus without a hand-written `tabindex`.
  - API getters `approve` and `deny(reason?: string)`: offered while their callback is set, the approval is actionable and nothing is pending. Agent actions: `approve`, `deny`.
- Tool: new options `onApprove`, `onDeny`, `approvalReason`, passed to a Confirmation in the `approval` part while `call.approval` is present (its outcome replaces the old status text). Tool's announcements stay as they are, so the decision is announced once. Web: `<kind-tool can-approve can-deny>` writes them onto its `kind-confirmation`, whose `approve` and `deny` events bubble to the host.
- React: `Confirmation`, `ConfirmationReason`, `ConfirmationApprove`, `ConfirmationDeny`, `ConfirmationOutcome`, `ConfirmationError`, and `ToolApproval` renders `Confirmation`. Web: `defineConfirmation()`, `can-approve`, `can-deny`.

- [ ] **Step 1: Write the failing tests.** Core: the lock and staleness table above, over a fake store. Browser, both layers:
  - **Review Focus 1, 2, 3.**
  - Without `onDeny` (web: `can-deny`) only Approve renders; `auto` renders the outcome and no choices.
  - Deciding moves nothing above or below the confirmation (bounding boxes before and after).
  - `act("deny", "Too broad")` is refused without approval and, approved, calls `onDeny` with that reason and `source: "agent"`.
  - In a Tool: `onApprove` gets the call's `approvalId` and `generation`; the tool's status stays `awaiting-input` through `submit-failed`.
  - Reduced motion: the swap is an opacity fade only. Axe in light and dark.
  - `expectAgentActions(page, "Run search_docs?", ["approve", "deny"])`.
- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-3/confirmation.spec.ts tests/browser/wave-2/tool.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-textarea"]`; Tool's `uses` gains `confirmation`). The Tool page's approval section moves from "status only" to Confirmation. Commit `feat(confirmation): add Confirmation and approve or deny in Tool`.

---

### Task 4: Question

Spec §7 Wave 3 "Question", §6 agent confirmation; D6.

**UI SDK:** Radio group and Checkbox group (`docs/components/{radio,checkbox}.md`, "Fieldset and Legend", "Group"), whose roving focus comes from UI SDK; internal Textarea; Button. Adds `internal-radio`, `internal-checkbox`.

**Files:**
- Create: `packages/agent-ui/src/core/question/{question,answers,index}.ts`, `src/react/question.tsx`, `src/web/question.ts`, `src/styles/question.css`, `src/{react,web}/internal/{radio,checkbox}.*`
- Test: `packages/agent-ui/tests/core/question.test.mjs`, `tests/browser/wave-3/question.spec.ts`

**Interfaces:**
- Consumes: `createPendingAction`, the `Question` and `Answers` types.
- Produces in `answers.ts`: `missingAnswers(questions: Question[], answers: Answers): string[]` (required ids with no value, an empty array or blank text); `applyAnswer(question, answers, value): Answers` (single replaces, multiple toggles, unknown option values unchanged).
- Produces `questionPrimitive` (`kind-question`):
  - Options: `questions: Question[]`; `value`/`defaultValue`/`onValueChange(answers, details)` (mutually exclusive, as the composer's draft); `onSubmit?(answers)` and `onSkip?()` (`"action"`); `submitted?: Answers` (host-confirmed answers, shown read-only in place of the form); `label`; `agentConfirm` (default `true`); `motion`.
  - Slots: `root` (a `<form>` named by `label`, `data-agent-confirm`); with prop `value` (a question id), `question` (fieldset), `prompt` (legend), `choices` (Radio or Checkbox group by `kind`), `text` (Textarea); `submit` and `skip` (`role: "button"`); `error` (reserved line under the buttons); `summary` (present while `submitted`).
  - Submit is `aria-disabled` while `missingAnswers` is non-empty or pending. A rejection keeps the answers and shows the error; resolving shows nothing until the host passes `submitted`.
  - API: `select(questionId, value)`, `setText(questionId, text)` (each `false` for an unknown id or a wrong kind), and getters `submit` (offered while `onSubmit` is set, nothing is missing and nothing pending) and `skip` (while `onSkip` is set). `controlled`: `value`. Agent actions: `select`, `setText`, `submit`, `skip`; `agent.items` lists question ids with their prompts.
- React: `Question`, `QuestionItem`, `QuestionPrompt`, `QuestionChoices`, `QuestionText`, `QuestionSubmit`, `QuestionSkip`, `QuestionError`, `QuestionSummary`. Web: `defineQuestion()`; `can-submit` and `can-skip`, events `questionsubmit` (a form inside fires native `submit`) and `skip`.

- [ ] **Step 1: Write the failing tests.** Core: `missingAnswers` and `applyAnswer` for each kind and for blank text. Browser, both layers:
  - **Review Focus 3, 4.**
  - Each choice group is one Tab stop with arrow keys (UI SDK's own); Space toggles a checkbox.
  - Enter in a text answer inserts a newline and never submits.
  - `submitted` swaps the form for the summary without changing the page below by more than the height difference, and the summary lists every answer.
  - `act("select", "env", "prod")` then `act("submit")` (approved) calls `onSubmit` with `source: "agent"`; `select` with an unknown id returns `false`.
  - Axe in light and dark. `expectAgentActions(page, "Deploy questions", ["select", "setText", "skip"])` before an answer, with `submit` joining once the required ones are set.
- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-3/question.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-radio", "internal-checkbox", "internal-textarea"]`). Commit `feat(question): add Question`.

---

### Task 5: Checkpoint

Spec §7 Wave 3 "Checkpoint", §6 agent confirmation; D7.

**UI SDK:** Alert Dialog (`docs/components/alert-dialog.md`, "Async Action": a Close part's `action` keeps the dialog open until its promise settles and keeps a rejection in that part's state), Tooltip, Button. Adds `internal-alert-dialog`, `internal-tooltip`.

**Files:**
- Create: `packages/agent-ui/src/core/checkpoint/{checkpoint,index}.ts`, `src/react/checkpoint.tsx`, `src/web/checkpoint.ts`, `src/styles/checkpoint.css`, `src/{react,web}/internal/{alert-dialog,tooltip}.*`
- Test: `tests/browser/wave-3/checkpoint.spec.ts`

**Interfaces:**
- Produces `checkpointPrimitive` (`kind-checkpoint`):
  - Options: `label` (default "Checkpoint"); `description?` (for example "Before editing auth.ts"); `onRestore?()` (`"action"`); `restored?: boolean` (host state, shows "Restored" in place of the button); `confirmTitle` and `confirmDescription` (defaults "Restore this checkpoint?" and "Changes after it will be discarded."); `open`/`defaultOpen`/`onOpenChange` for the dialog; `agentConfirm` (default `true`); `motion`.
  - Slots: `root` (`role: "group"` named by `label`, `data-agent-confirm`), `line` (the divider, `aria-hidden`), `label`, `restore` (the Alert Dialog trigger, with a Tooltip "Restore checkpoint"), and the dialog's `title`, `description`, `cancel` and `confirm` (a Close part whose `action` calls `onRestore`, with `pendingAnnouncement` "Restoring").
  - API getter `restore`: opens the dialog (D7); offered while `onRestore` is set, not `restored`, and the dialog is closed. `controlled`: `open`. Agent actions: `restore`.
- React: `Checkpoint`, `CheckpointLine`, `CheckpointLabel`, `CheckpointRestore`, `CheckpointDialog`. Web: `defineCheckpoint()`, `can-restore`, event `restore`.

- [ ] **Step 1: Write the failing browser tests**, both layers:
  - **Review Focus 5**, and a double press on the dialog's Restore calls the host once.
  - Escape and Cancel close the dialog without calling the host; focus returns to the trigger.
  - `restored` swaps the button for "Restored" with no change in the row's height.
  - Reduced motion: the dialog only fades. Axe with the dialog open, light and dark.
  - `act("restore")` (approved) opens the dialog and calls nothing. `expectAgentActions(page, "Checkpoint", ["restore"])`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-3/checkpoint.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint && npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-alert-dialog", "internal-tooltip"]`). Commit `feat(checkpoint): add Checkpoint`.

---

### Task 6: Model Selector and Reasoning Effort

Spec §7 Wave 3 "Model Selector", "Reasoning Effort".

**UI SDK:** Combobox (`docs/components/combobox.md`: "Groups", "Highlight Matches", "Filter and Keywords"), `fuzzyScore` and `matchSegments` (`core.md` "Rank What Someone Searches For", "Highlight What Matched"); Segmented Control (`docs/components/segmented-control.md`, "Indicator"). Adds `internal-combobox`, `internal-segmented-control`.

**Files:**
- Create: `packages/agent-ui/src/core/{model-selector,reasoning-effort}/{<name>,index}.ts`, `src/core/model-selector/filter.ts`, `src/react/{model-selector,reasoning-effort}.tsx`, `src/web/{model-selector,reasoning-effort}.ts`, `src/styles/{model-selector,reasoning-effort}.css`, `src/{react,web}/internal/{combobox,segmented-control}.*`
- Test: `packages/agent-ui/tests/core/model-selector.test.mjs`, `tests/browser/wave-3/{model-selector,reasoning-effort}.spec.ts`

**Interfaces:**
- Produces in `filter.ts`: `filterModels(models: ModelOption[], query: string): { group: string | undefined; models: ModelOption[] }[]`: groups in first-seen order, models scored by the best `fuzzyScore` of name, group and description, above zero, best first within a group; an empty query keeps everything in order.
- Produces `modelSelectorPrimitive` (`kind-model-selector`): options `models`, `value`/`defaultValue`/`onValueChange(id, details)`, `label` (default "Model"), `placeholder`, `disabled`. Slots hand Combobox its items, groups and value; each item's name renders through `matchSegments` with matches in `<mark>`. The trigger shows the selected name and its group. API `setValue(id): boolean` (`false` for unknown or disabled). `controlled`: `value`. Agent actions: `setValue`, with `agent.items` from `models`.
- Produces `reasoningEffortPrimitive` (`kind-reasoning-effort`): options `levels?: { value: string; label: string }[]` (default Low, Medium, High), `value`/`defaultValue`/`onValueChange`, `label` (default "Reasoning effort"), `disabled`, `motion` (the indicator slides at full motion, fades under reduced). API `setValue(value): boolean`. Agent actions: `setValue`, with `agent.items` from `levels`.
- React: `ModelSelector` (+ `Trigger`, `Input`, `Content`, `Group`, `Item`, `Empty` parts) and `ReasoningEffort` (+ `Item`, `Indicator`). Web: `defineModelSelector()`, `defineReasoningEffort()`, event `valuechange`.

- [ ] **Step 1: Write the failing tests.** Core: `filterModels` keeps group order, ranks "son4" to "Sonnet 4" first, drops zero scores, and returns everything for `""`. Browser, both layers:
  - Typing filters and highlights; ArrowDown and Enter select; Escape closes and focus stays on the input.
  - Disabled models can't be chosen by pointer, keys or `setValue`.
  - The trigger keeps its width when the selection changes to a longer name (fixed or min width, truncated with the full name in its label).
  - Reasoning Effort: arrow keys move the selection; reduced motion doesn't slide the indicator.
  - Axe with the list open, light and dark. `expectAgentActions(page, "Model", ["setValue"])`, `expectAgentActions(page, "Reasoning effort", ["setValue"])`, and `act("setValue", "unknown")` changes nothing.
- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-3/model-selector.spec.ts tests/browser/wave-3/reasoning-effort.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** The docs example places Reasoning Effort beside Model Selector in a composer's toolbar.
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine**, once per component: two pages and four registry items in one PR. Commit `feat: add Model Selector and Reasoning Effort`.

---

### Task 7: Suggestion

Spec §7 Wave 3 "Suggestion"; D5.

**UI SDK:** Carousel (`docs/components/carousel.md`: "Usage", "Align"), Button, the motion helper's `"fade-up"` entrance. Adds `internal-carousel`.

**Files:**
- Create: `packages/agent-ui/src/core/suggestion/{suggestion,index}.ts`, `src/react/suggestion.tsx`, `src/web/suggestion.ts`, `src/styles/suggestion.css`, `src/{react,web}/internal/carousel.*`
- Test: `tests/browser/wave-3/suggestion.spec.ts`

**Interfaces:**
- Produces `suggestionPrimitive` (`kind-suggestion`): options `suggestions: SuggestionItem[]`, `onPick?(id, details)`, `label` (default "Suggestions"), `motion`. Slots: `root` (the Carousel, named by `label`), `viewport`, `list`, `item` (prop `value`; a Button showing `label` and optional `description`), `previous` and `next` (Carousel's, shown only while there's more to scroll). Suggestions added after the first frame play `"fade-up"` once; a removed one leaves at once (host data, but chips are cheap; D1's leaving rows aren't needed). API `pick(id): boolean`, offered while `onPick` is set. Agent actions: `pick`, with `agent.items` from `suggestions`.
- React: `Suggestion`, `SuggestionItem`, `SuggestionPrevious`, `SuggestionNext`. Web: `defineSuggestion()`, `can-pick`, event `pick`.

- [ ] **Step 1: Write the failing browser tests**, both layers: Tab reaches each chip; Previous and Next appear only when chips overflow; a new chip fades up once and an updated one doesn't replay; adding chips doesn't move content above; without `onPick` chips render but `pick` isn't offered; axe in light and dark; `expectAgentActions(page, "Suggestions", ["pick"])` and `act("pick", "b")` calls `onPick("b")` with `source: "agent"`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-3/suggestion.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-carousel"]`). The page shows `allow` for hosts whose pick sends a prompt (D5). Commit `feat(suggestion): add Suggestion`.

---

### Task 8: Context Meter

Spec §7 Wave 3 "Context"; D3, D4.

**UI SDK:** Meter (`docs/components/meter.md`: "Format and Locale", "Value Label"), Popover with "Open on Hover" (`docs/components/popover.md`). Adds `internal-meter`, `internal-popover`.

**Files:**
- Create: `packages/agent-ui/src/core/context-meter/{context-meter,format,index}.ts`, `src/react/context-meter.tsx`, `src/web/context-meter.ts`, `src/styles/context-meter.css`, `src/{react,web}/internal/{meter,popover}.*`
- Test: `packages/agent-ui/tests/core/context-meter.test.mjs`, `tests/browser/wave-3/context-meter.spec.ts`

**Interfaces:**
- Produces in `format.ts`: `contextValueText(used, total, locale?)` ("57,600 of 128,000 tokens, 45%"); `contextRows(usage?: TokenUsage, cost?: number, currency?: string, locale?): { label: string; value: string }[]` (only supplied fields, in the order input, output, reasoning, cached, cost; `0` is shown).
- Produces `contextMeterPrimitive` (`kind-context-meter`): options `used`, `total`, `usage?`, `cost?`, `currency` (default `"USD"`), `locale?`, `label` (default "Context"), `open`/`defaultOpen`/`onOpenChange`, `motion`. The trigger holds the Meter (value text from `contextValueText`) and the percent; `--kind-context-ratio` drives the ring; `data-level` is `normal`, `high` (≥ 80%) or `full` (≥ 95%), with its own icon and color. The popover lists `contextRows`. API `open()`, `close()`. `controlled`: `open`. Agent actions: `open`, `close`.
- React: `ContextMeter`, `ContextMeterTrigger`, `ContextMeterValue`, `ContextMeterContent`. Web: `defineContextMeter()`.

- [ ] **Step 1: Write the failing tests.** Core: value text and rows, including `0` and a missing `cost`. Browser, both layers: hover, focus and press each open the details, Escape closes and focus stays on the trigger; a new `used` doesn't change the trigger's width (tabular numbers); `aria-valuetext` matches; `high` and `full` show their icon; reduced motion: the ring and popover only fade; axe open and closed in light and dark; `expectAgentActions(page, "Context", ["close", "open"])`.
- [ ] **Step 2: Run** `npm run test:unit && npx playwright test tests/browser/wave-3/context-meter.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-meter", "internal-popover"]`). Commit `feat(context-meter): add Context Meter`.

---

### Task 9: Feedback

Spec §7 Wave 3 "Feedback"; D9.

**UI SDK:** Toggle group with single selection (`docs/components/toggle.md`, "Single Selection"), internal Popover and Textarea, Button.

**Files:**
- Create: `packages/agent-ui/src/core/feedback/{feedback,index}.ts`, `src/react/feedback.tsx`, `src/web/feedback.ts`, `src/styles/feedback.css`
- Test: `tests/browser/wave-3/feedback.spec.ts`

**Interfaces:**
- Consumes: `createPendingAction`.
- Produces `feedbackPrimitive` (`kind-feedback`): options `rating`/`defaultRating`/`onRatingChange(rating: "up" | "down" | null, details)`, `onComment?(text)` (`"action"`), `commentSent?: boolean` (host state: "Thanks for your feedback" replaces the comment button), `label` (default "Feedback"), `motion`. Slots: `root` (`role: "group"` named by `label`), `up` and `down` (Toggles, "Good response" and "Bad response"; pressing the pressed one clears it), `comment` (D9: the Popover trigger, present once rated and `onComment` is set), `comment-text`, `comment-send`, `comment-error`, `thanks`. Send keeps the popover open while pending, closes on resolve, and keeps the text with the error on rejection. API: `rate(rating): boolean` and the getter `submitComment(text?)` (offered while `onComment` is set and nothing pending). `controlled`: `rating`. Agent actions: `rate`, `submitComment`.
- React: `Feedback`, `FeedbackUp`, `FeedbackDown`, `FeedbackComment`, `FeedbackThanks`. Web: `defineFeedback()`, `can-comment`, events `ratingchange` and `comment`.

- [ ] **Step 1: Write the failing browser tests**, both layers: one Tab stop for the pair with arrow keys between; Up then Up clears; the comment button appears without moving the toggles; a double press on Send calls the host once; a rejection keeps the text; the popover returns focus to its trigger; reduced motion only fades; axe with the popover open, light and dark; `expectAgentActions(page, "Feedback", ["rate", "submitComment"])` and `act("rate", "down")` calls `onRatingChange("down")` with `source: "agent"`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-3/feedback.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.** The docs example puts Feedback in a Message's actions.
- [ ] **Step 4: Run** the same, plus `npm run lint`. Expected: PASS.
- [ ] **Step 5: Component task routine** (`uses: ["internal-toggle", "internal-popover", "internal-textarea"]`). Commit `feat(feedback): add Feedback`.

---

### Task 10: Notice and Guardrail Notice

Spec §7 Wave 3 "Notice", "Guardrail Notice"; D10.

**UI SDK:** Button, `announce` (urgent for a blocking guardrail, `core.md` "Urgent Announcements"), `createFocusRecovery`, `bindStepPanel` for the guardrail detail (the Step base's `bindPanel` call, as Step owns its panel rather than wrapping Collapsible), the motion helper's `"fade"` exit.

**Files:**
- Create: `packages/agent-ui/src/core/notice/{base,notice,index}.ts`, `src/core/guardrail-notice/{guardrail-notice,index}.ts`, `src/react/{notice,guardrail-notice}.tsx`, `src/web/{notice,guardrail-notice}.ts`, `src/styles/{notice,guardrail-notice}.css`
- Modify: `src/styles/status-mark.css` (`info` and `warning` glyphs)
- Test: `tests/browser/wave-3/{notice,guardrail-notice}.spec.ts`

**Interfaces:**
- Produces `noticeBase(config)` in `core/notice/base.ts`, spread by both primitives as the indicators spread `indicator.ts`:
  - Options: `variant: "info" | "success" | "warning" | "error"` (default `"info"`), `title?`, `onDismiss?()` (`"action"`), `focusFallback?: () => HTMLElement | null` (D10), `motion`.
  - Slots: `root` (`role: "note"`, named by `title`, `data-variant`), `icon` (status mark: `info`, `complete`, `warning`, `error`), `title`, `description`, `actions` (host buttons), `dismiss` (`role: "button"`, "Dismiss").
  - Announces `title` politely once when the notice appears after the first frame or its variant changes, never on text edits.
  - API getter `dismiss`: offered while `onDismiss` is set; plays the exit (D10), then calls `onDismiss`.
- Produces `noticePrimitive` (`kind-notice`). Agent actions: `dismiss`.
- Produces `guardrailNoticePrimitive` (`kind-guardrail-notice`): the base, plus `reason: string`, `detail?: string`, `blocking?: boolean`, `open`/`defaultOpen`/`onOpenChange` for the detail. The root is `role: "alert"` and announces urgently only while `blocking`; otherwise it's a note. Slots add `reason`, `detail-trigger` (`role: "button"`, "Why?"), `detail` (bound with `bindStepPanel`, findable). Agent actions: `dismiss`, `expand`, `collapse`.
- React: `Notice`, `NoticeIcon`, `NoticeTitle`, `NoticeDescription`, `NoticeActions`, `NoticeDismiss`, and `GuardrailNotice` with `Reason`, `DetailTrigger`, `Detail`. Web: `defineNotice()`, `defineGuardrailNotice()`, `can-dismiss`, event `dismiss`.

- [ ] **Step 1: Write the failing browser tests**, both layers: each variant has its icon and text; a notice present on load isn't announced, one added later is announced once; Dismiss fades it, moves focus per D10, then calls the host once; a blocking guardrail is `role="alert"` and a non-blocking one isn't; the detail opens by keys and find in page with no `height` animation under reduced motion; axe in light and dark for every variant; `expectAgentActions(page, "Model output withheld", ["collapse", "dismiss", "expand"])`.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-3/notice.spec.ts tests/browser/wave-3/guardrail-notice.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement.**
- [ ] **Step 4: Run** the same, plus `npm run lint && npm run typecheck`. Expected: PASS.
- [ ] **Step 5: Component task routine**, once per component: two pages and four registry items in one PR. Commit `feat: add Notice and Guardrail Notice`.

---

### Task 11: Wave 3 agent conformance

Spec §6 "Agent actions", §10 "Agent actions". Each component's own snapshot is tested in its task; this task covers what they share, as Wave 2 Task 10 did.

**Files:**
- Modify: `packages/agent-ui/tests/fixtures/{react,web}/cases/agent.*` (a `case=wave-3` page with every Wave 3 component and a Tool awaiting approval)
- Test: `tests/browser/wave-3/agent.spec.ts`

- [ ] **Step 1: Write the test**, both layers:
  - The snapshot lists every Wave 3 component, each by its accessible name.
  - Each listed action runs once through `act` and once through a person's input on a fresh page; attributes and text match, apart from inline styles and `tabindex`.
  - Change callbacks receive `details.source === "agent"`, and a cancelling callback leaves the state unchanged.
  - `confirmation.approve`/`deny`, `checkpoint.restore` and `question.submit` are refused when the permission callback denies them; Confirmation's mark stays with `agentConfirm={false}`.
  - On web, every `can-*` attribute adds and removes its action.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-3/agent.spec.ts`. Expected: PASS; fix the owning primitive for any failure.
- [ ] **Step 3: Commit** `test: add Wave 3 agent conformance`, then follow the routine's **Finish** and **Commit and PR** steps.

---

### Task 12: Showcase, docs index and the Wave 3 changeset

Spec §7 (a showcase page per wave), §9.1, §9.5; D11.

**Files:**
- Create: `apps/docs/content/docs/showcase/human-input.mdx`, `apps/docs/examples/showcase/human-input.tsx`, `.changeset/agent-ui-wave-3.md`
- Modify: `apps/docs/content/docs/showcase/meta.json`, `apps/docs/content/docs/index.mdx`, `packages/agent-ui/README.md` (component list), `scripts/tests/docs.test.mjs`

**Interfaces:**
- The showcase plays one scripted run on a Replay button: a composer with Model Selector, Reasoning Effort and Context Meter; a Tool that asks for approval through Confirmation (one approve, one `submit-failed` then retry); a Question the agent asks; a Checkpoint between turns; Feedback on the answer; Suggestions after it; a Notice, and a blocking Guardrail Notice on one request.
- `.changeset/agent-ui-wave-3.md`: `"@kind-ui/agent-ui": minor`, listing the ten components, Tool's approve and deny, and any D2 fixes.

- [ ] **Step 1: Write the failing test.** `docs.test.mjs`: the Showcase section lists `agent-activity` then `human-input`, and the page holds one `<Example>`.
- [ ] **Step 2: Run** `node --test scripts/tests/docs.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement**, in the site's voice (`write-docs`).
- [ ] **Step 4: D11.** Land the changeset only once the 0.2.0 version PR (#40) has merged: `packages/agent-ui/package.json` reads `0.2.0`. If not, stop and report.
- [ ] **Step 5: Run** `npm run build:docs`, then `npm run check` through a subagent. Expected: PASS; `check:registry-consumers` installs every visible React item and its web twin.
- [ ] **Step 6:** Light and dark screenshots of the showcase. Run `unslop` and `expert-review`. Commit `docs: add the Wave 3 showcase and changeset`, push, open the PR. Don't publish, version or deploy.

---

## How this plan builds on UI SDK

| Requirement | Where |
| --- | --- |
| One `definePrimitive` per component, `createParts` per render file | Guard in `npm run lint`, every task |
| Popups, dialogs, choice groups, search and meters are UI SDK components | Popover, Alert Dialog, Tooltip, Radio, Checkbox, Toggle, Combobox, Segmented Control, Carousel, Meter (Tasks 3–10) |
| Search ranking and match highlighting come from `@ui-sdk/core` | `fuzzyScore`, `matchSegments` (Task 6) |
| The approval contract lives in one place | `createPendingAction` (Task 1), Confirmation (Task 3), embedded by Tool |
| Every component is a live UI SDK primitive with its actions | `expectAgentActions` in Tasks 3–10, and Task 11 |
| Hand-written code only for spec §2 rows | No new row |

## Self-Review Notes

- **Spec coverage:** §7 Wave 3 rows and behavior requirements: Tasks 3–10. §4.1 approval contract: Tasks 1 and 3. §6 agent confirmation: Tasks 3–5 and 11. §6 Motion: each task, Task 2 for the composer. §8: axe, keyboard and announcement checks per task. §9.1 and §9.5: Task 12 and each docs page.
- **Out of scope:** paging in Question (D6); an "always allow" setting in Confirmation (host policy, §4.1); open `decisions.md` items no Wave 3 component reaches, like the Queue `known` set and the late-button retarget in `kind-step-list-item`.
