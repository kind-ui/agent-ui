# `@kind-ui/agent-ui` Wave 7 (0.9 and 0.10) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. Each task is one session and one PR, opened and left for the user's review: **no task merges its own PR.**

**Goal:** Ship Wave 7, "agent ops", in two releases. **7a (0.9.0)** fixes the four gaps fx-gui hit first (Composer steering, Message's delivery mark, Terminal approval, retrying on Message and Tool), then adds a minimal Diff, Step Group and Handoff. **7b (0.10.0)** adds Trace, Run Timeline, Job Progress, Schedule Card, Agent Card, Usage Meter, Quota Notice, Activity Graph and Flow Graph, with Context Meter's breakdown and Thread List's inbox. Every new component and change ships in core and all five render layers (React, Web Components, Vue, Svelte, Solid), with registry items, docs pages, the published skill's references, size budgets and one changeset per release.

**Architecture:** Every Wave 7 component is one `definePrimitive` that composes UI SDK, as Waves 1–6 do. Trace is UI SDK Waterfall; Run Timeline is UI SDK Timeline; Job Progress and Quota Notice use Progress and Meter; Schedule Card uses Switch; Activity Graph is `createGridFocus`; Flow Graph is `createViewport` with `spatialMove`. Step-shaped components spread `stepBase`; Usage Meter and Context Meter share a `meterBase` extracted from Context Meter; Terminal, Tool and Handoff share an `approvalPart` extracted from Tool; Message and Tool share a `retryPart` over a `createCountdown` extracted from Connection Status. Diffing is jsdiff, graph layout is dagre: pure data in core, like the Markdown engine's libraries.

**Tech Stack:** `@ui-sdk/*` stay at `0.1.0-beta.17`, `motion` at `14.14.0`. New runtime dependencies, each exact-pinned by the task that first imports it: `diff@9.0.0` (BSD-3-Clause, 4.9 KB gzip for the three functions Diff uses; Task 6) and `@dagrejs/dagre@3.1.4` (MIT, 17 KB gzip, with `@dagrejs/graphlib`; Task 19, if Flow Graph stays).

**Spec:** `docs/superpowers/specs/2026-11-25-agent-ui-wave-7-design.md` (binding for Wave 7; its §2 is the scope, §3 the frozen contracts, §4–§5 each component's behavior, §9 the fx-gui stop-gaps) and the base spec `docs/superpowers/specs/2026-11-14-agent-ui-design.md` (§2 "Building on UI SDK", §4.1, §5, §6, §8, §9, §10). Also read `AGENTS.md` ("UI SDK API notes", "Framework layers: shared interfaces", Verification policy, the streaming UX checklist), `.agents/experts/*/decisions.md`, the Wave 6 plan for the routine this one keeps, and the framework layers plan for D5 (names in each framework) and D10 (markers).

## Decisions

Proposed 2026-11-25. The scope decisions (what merges, what's dropped, Diff in 7a) are the spec's §2 and its §10 open questions; this list covers how the work runs.

- **D1. Scope and order.** Spec §2: 12 new components and 8 changed. The five fx-gui gaps go first: Batch A is gaps 1, 2, 3 and 5 (Tasks 2–5); gap 4, the Diff, opens Batch B (Task 6) because it's a new component rather than an option on a shipped one, and Terminal's and Tool's approvals (Batch A) are what it serves. 7b starts only once 7a's tasks are open as PRs.
- **D2. Contracts freeze first.** Task 1 lands every Wave 7 type (spec §3.1), the four shared core modules (spec §3.2: `countdown`, `retry`, `approval-part`, `aggregate`, `meter-base`) as refactors with no API change, the markers, the `wave-7` Playwright projects and the skill's `ops` group. No component task edits a shared type or module; one that needs a change opens a small PR against `main` that every open task merges before it continues (framework layers plan D10).
- **D3. Five layers in every task.** A task isn't done until its component renders in React, Web Components, Vue, Svelte and Solid with React's part names (framework layers plan D5), is listed in each `registry/layers/<layer>.mjs`, passes `parity.spec.ts` and `hydration.spec.ts` on every layer, and has docs examples in all four example languages. React and Web are written first by the owner; Vue, Svelte and Solid go to three parallel subagents once the core primitive is frozen (step 3 of the routine).
- **D4. Shared files take per-task markers.** As Wave 6 D21: Task 1 adds one `wave-7-task-<n>: <name>` marker per task in `core/index.ts`, `registry/catalog.mjs`, the five `registry/layers/<layer>.mjs`, `tests/fixtures/shared/parity.ts`, `packages/agent-ui/tests/core/ui-sdk-testing.test.mjs`, `tests/browser/budgets/{react,vue,svelte,solid}.ts`, `tests/browser/wave-1/{forced-colors,status-mark}.spec.ts`, `packages/agent-ui/src/styles/agent-ui.css`, the registry consumers, `THIRD_PARTY_NOTICES.md` and `AGENTS.md` ("UI SDK API notes"). JSON files (`size-budget.json`, `apps/docs/content/docs/components/meta.json`) and lockfile changes are rebased by whichever task lands second. Task 21 removes the markers.
- **D5. Two releases, two integration points.** 7a tasks (2–8) branch from `main` after Task 1 and open PRs against `main`. 7b tasks (10–19) open PRs against a `wave-7b` branch the coordinator cuts from `main` after Task 1, so nothing from 7b ships in 0.9.0's tarball; Task 21 opens `wave-7b` → `main` once 0.9.0 has published. Task 9 writes the 0.9.0 changeset, Task 21 the 0.10.0 one. No other task writes a changeset. (Spec §10 Q6: if the user wants one 0.9.0, Task 9 drops its changeset, 7b targets `main`, and Task 21 writes one.)
- **D6. Ports.** Each task's session owns ports `7000 + 50 × N` to `7049 + 50 × N` (Task 1: 7050–7099; Task 21: 8050–8099). Within it, `KIND_FIXTURE_PORT_BASE` is the session base + 0 for React and Web, + 10 for the Vue subagent, + 20 Svelte, + 30 Solid, and + 40 for the one full `npm run check`. No other Wave 7 session or fx-gui (6100–6299) uses them.
- **D7. Tests never slow the build (user rule).** Build first, then the task's own spec on its own layers; `npm run check` once, alone, before push, through one subagent. Unit tests only for pure helpers. Each browser spec stays under 30 s per layer: fixed fixture data, fixed sizes, deferred promises resolved by the test, no sleeps.
- **D8. fx-gui is the test bed.** Each task's PR names the fx-gui stop-gap its change replaces (spec §9) and, for 7a, adds a short "fx-gui swap" note to the PR body: the stop-gap file, the component and options that replace it. Swapping fx-gui itself is fx-gui's work after the release; no Agent UI task edits fx-gui.
- **D9. No showcase.** Every 7a change is a conversation part its own page shows, and 7b's are single components. Task 21 adds an "Agent ops" example to the Trace page (a Run Timeline, a Trace and a Usage Meter of one fixture run) only if the docs review asks for a together view; no scripted showcase.

## Global Constraints

- **Build on UI SDK (base spec §2):**
  - Each component is one `definePrimitive` in `packages/agent-ui/src/core/<component>/`, exported as `<camelCase>Primitive` with the explicit `ReturnType<typeof definePrimitive<…>>` annotation. Each render file calls `createParts` or wraps a UI SDK component. `npm run lint` runs the guard.
  - Focus, keys, roving and grid focus, typeahead, popups, dismissal, virtualization, scroll following, pan and zoom, and announcements come from slot declarations, UI SDK components and `@ui-sdk/core` behaviors. No Wave 7 task adds a spec §2 exception row; a task that finds it needs one stops and asks.
  - A composed UI SDK component follows the Composer pattern: the slot's `state` hands its props and controller (memoized in `api.partState`), React passes them as props, Vue, Svelte and Solid pass them key by key (part state is a keyless proxy in all three), web writes them onto the `ui-*` element in the root's `render` hook and hears its events through `hearComposed`. Composed parts carry `data-agent-hidden`, so each component is one snapshot entry.
- **Read first:** the `ui-sdk` skill; `node_modules/@ui-sdk/<framework>/docs/llms.txt` for each layer you write; the component pages a task names (`docs/components/waterfall.md`, `timeline.md`, `progress.md`, `meter.md`, `switch.md`, `menu.md`, `avatar.md`); `core.md` sections a task names. For Vue, Svelte and Solid, that framework's skill (`vue-best-practices`, `svelte-core-bestpractices`, `solid-best-practices`) and its expert's `decisions.md`. Where installed docs differ from this plan, follow the docs and add a line under the task's "UI SDK API notes" marker.
- **Names:** primitives `kind-<component>`; web tags `kind-<component>[-<part>]` in light DOM, declared in `HTMLElementTagNameMap`; React `<Name>`, `<Name><Part>`; Vue `src/vue/<name>.ts`; Svelte `src/svelte/<name>/`; Solid `src/solid/<name>.tsx`; web `define<Name>()`; registry items `<component>`, `-web`, `-vue`, `-svelte`, `-solid`. The naming option is `label`, never `title`.
- **Web:** callbacks are DOM events, renamed through `events` where a bubbling native event takes the name (`select`, `change`, `copy`, `toggle`); a callback whose presence offers an action has a `can-<action>` attribute. Vue: a `"callback"` whose presence offers an action is re-declared as `"action"` on a derived primitive (AGENTS.md "Vue conformance").
- **Agent actions (base spec §6, spec §3.3):** listed only while available, through api getters that return `undefined` otherwise; same code paths as pointer and keyboard; `details.source` on every callback; `data-agent-confirm` only where spec §3.3 says.
- **Accessibility (base spec §8, spec §7):** every root and trigger is named; a control's name starts with its visible text; statuses have a mark and words; `announce` is polite and fires on outcomes only; one Tab stop per collection.
- **Motion:** `motion: "auto" | "reduced" | "none"`; tokens from `src/core/motion/tokens.ts`; `"reduced"` at most a 120 ms fade; popups animate in CSS from UI SDK's `data-starting-style`/`data-ending-style`. Nothing loops while nothing is waiting.
- **Design bar (user rules):** light and dark through `--kind-color-*` only; shared controls through `data-kind-*`; focus rings only on `:focus-visible`, subtle (`--kind-focus-ring`), never on a text field or editor; nothing that comes and goes moves content. New glyphs are Lucide's, drawn as CSS masks with a `forced-colors` rule, added under the task's marker in `THIRD_PARTY_NOTICES.md`. **No sparkle or star-burst icon or animation, anywhere** (`scripts/tests/no-sparkle.test.mjs`).
- **References:** name only what the code builds on (UI SDK, jsdiff, dagre, Lucide). Third-party attribution goes only in `THIRD_PARTY_NOTICES.md`.
- **Size:** each task adds its primitive to `imports` in `size-budget.json` at its measured gzip size rounded up to the next 500 bytes, and raises the `./core` limit by the measured growth rounded up to the next 1,000 bytes.
- **Docs:** pages use `<ExampleCode example="<name>/<example>" />` and `<Install name="<name>" />`; examples import `@/components/ui/<name>` (React) and `@/components/ui/<layer>/<name>`; links are `./x.mdx`. `scripts/tests/docs.test.mjs` enforces it.
- **Publication:** nothing publishes, versions or deploys. **No task merges its own PR.**
- **Commits** carry `Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>`.

## Review Focus

1. **Steering by keyboard and pointer:** while `running`, Enter steers, Mod+Enter queues, the chevron menu offers the other mode, a steer clears only the sent snapshot, and a rejected steer keeps the draft. IME composition never sends. Task 2.
2. **Terminal approval in place:** the command shows, Approve runs it (output appears after the approval, which becomes its outcome), Deny keeps the command, Always allow reports `always: true`; nothing above moves. Task 4.
3. **Retrying never chatters:** the countdown ticks without an announcement; "Retrying, attempt 2" is announced once; the streamed text above doesn't move. Tasks 3, 5.
4. **A 2,000-line Diff:** scrolls smoothly (virtualized), a streamed hunk renders a fixed number of parts at 40 and 2,000 lines, "Show N lines" is reachable by Tab and by find in page. Task 6.
5. **A 5,000-span Trace:** ArrowDown into rows not yet rendered, selecting and expanding render a fixed number of parts. Task 10.
6. **Parity in five layers:** every new part has the same tree in React, Web, Vue, Svelte and Solid, at rest and after its interaction, and hydrates without a warning. Every task.

---

## File Map

```text
packages/agent-ui/src/types/{message,tool,step,records,index}.ts            (Task 1: spec §3.1)
packages/agent-ui/src/core/{countdown,retry,approval-part,aggregate,meter-base}.ts   (Task 1: spec §3.2)
packages/agent-ui/src/core/{composer,queue}/…                                (Task 2)
packages/agent-ui/src/core/message/…                                         (Task 3)
packages/agent-ui/src/core/{terminal,confirmation}/…, core/approval-part.ts  (Task 4)
packages/agent-ui/src/core/tool/…                                            (Task 5)
packages/agent-ui/src/core/{diff,step-group,handoff}/{<name>,index}.ts       (Tasks 6–8)
packages/agent-ui/src/core/{trace,run-timeline,job-progress,schedule-card,agent-card,usage-meter,quota-notice,activity-graph,flow-graph}/…   (Tasks 10–19)
packages/agent-ui/src/core/{context-meter,thread-list}/…                     (Tasks 15, 18)
packages/agent-ui/src/{react/<name>.tsx, web/<name>.ts, vue/<name>.ts, svelte/<name>/, solid/<name>.tsx}
packages/agent-ui/src/{react,web,vue,svelte,solid}/internal/{waterfall,timeline,switch}.*   (Tasks 10, 11, 13)
packages/agent-ui/src/styles/<name>.css
packages/agent-ui/tests/core/{countdown,aggregate,diff-rows,trace-spans,activity-levels,flow-layout}.test.mjs
packages/agent-ui/tests/fixtures/shared/<name>.ts
packages/agent-ui/tests/fixtures/{react,web,vue,svelte,solid}/cases/<name>.*
tests/browser/wave-7/<name>.spec.ts    tests/browser/budgets/<layer>.ts
apps/docs/content/docs/components/<name>.mdx
apps/docs/examples/<name>/basic.{tsx,vue,svelte,solid.tsx}
registry/catalog.mjs    registry/layers/<layer>.mjs    registry/consumers/…
packages/agent-ui/skills/agent-ui/{SKILL.md,references/{components,compose,approvals,agents}.md}
size-budget.json    AGENTS.md    THIRD_PARTY_NOTICES.md    .changeset/agent-ui-wave-7{a,b}.md
```

## Parallel batches

| Batch | Release | Tasks | Starts after | PR base | Files they share |
| --- | --- | --- | --- | --- | --- |
| 0 | both | 1 (groundwork) | this plan merged | `main` | none: it lands alone |
| A | 7a | 2, 3, 4, 5 | Task 1 merged | `main` | only marked shared files. Task 4 owns `approval-part.ts` and the approval props in Tool's render files; Task 5 owns the rest of Tool. |
| B | 7a | 6, 7, 8 | Batch A's PRs open (Task 8 needs Task 4 merged) | `main` | marked shared files; Task 6 adds `diff` to `package.json` and the lockfile |
| C | 7a | 9 (conformance, docs index, 0.9.0) | Tasks 2–8 merged | `main` | agent fixture pages, docs index, skill, changeset |
| D | 7b | 10, 11, 12, 13, 14, 15, 16, 17, 18 | Task 1 merged and Batch B's PRs open | `wave-7b` | marked shared files; Task 15 alone edits Context Meter, Task 18 alone Thread List |
| E | 7b | 19 (Flow Graph, Open) | Batch D's PRs open | `wave-7b` | adds `@dagrejs/dagre`; dropped if the user drops Flow Graph |
| F | 7b | 20 (conformance), 21 (docs index, 0.10.0, `wave-7b` → `main`) | Tasks 10–19 merged into `wave-7b`; Task 21 also after 0.9.0 publishes | `wave-7b`, then `main` | agent fixture pages, docs index, skill, changeset |

With fewer sessions free, start Tasks 2 and 4 first (the two largest gaps and Task 8's dependency), then 3 and 5, then 6. In 7b, start 10 (Trace) and 18 (Thread List inbox) first: they're the largest.

### Task table

| Task | Release | Batch | Owns (beyond its marked lines) | Port base | Depends on |
| --- | --- | --- | --- | --- | --- |
| 1 Groundwork | both | 0 | `types/*`, `core/{countdown,retry,approval-part,aggregate,meter-base}.ts`, Connection Status/Tool/Context Meter core refactors, markers, `playwright.config.mjs`, `scripts/build-skill.mjs` | 7050 | — |
| 2 Composer steering, Queue Send now | 7a | A | `core/{composer,queue}/`, their render files ×5 layers, `composer.css`, `queue.css` | 7100 | 1 |
| 3 Message delivery and retrying | 7a | A | `core/message/`, its render files, `message.css` | 7150 | 1 |
| 4 Terminal approval, Always allow | 7a | A | `core/{terminal,confirmation}/`, `core/approval-part.ts`, their render files, Tool render files' approval props | 7200 | 1 |
| 5 Tool retry and retrying | 7a | A | `core/tool/` (but `approvalPart`), Tool render files (but approval props), `tool.css` | 7250 | 1 |
| 6 Diff | 7a | B | `core/diff/`, Diff render files, `diff.css`, `diff` dependency | 7300 | 1 |
| 7 Step Group | 7a | B | `core/step-group/`, render files, `step-group.css` | 7350 | 1 |
| 8 Handoff | 7a | B | `core/handoff/`, render files, `handoff.css` | 7400 | 1, 4 |
| 9 7a conformance, docs, 0.9.0 | 7a | C | `tests/browser/wave-7/{agent,aria-patterns}.spec.ts`, agent fixtures, docs index, skill references, `.changeset/agent-ui-wave-7a.md` | 7450 | 2–8 |
| 10 Trace | 7b | D | `core/trace/`, `internal-waterfall` ×5, render files, `trace.css` | 7500 | 1 |
| 11 Run Timeline | 7b | D | `core/run-timeline/`, `internal-timeline` ×5, render files, `run-timeline.css` | 7550 | 1 |
| 12 Job Progress | 7b | D | `core/job-progress/`, render files, `job-progress.css` | 7600 | 1 |
| 13 Schedule Card | 7b | D | `core/schedule-card/`, `internal-switch` ×5 (Settings Menu draws a Switch's look; this is the first real Switch), render files, `schedule-card.css` | 7650 | 1 |
| 14 Agent Card (Open) | 7b | D | `core/agent-card/`, render files, `agent-card.css` | 7700 | 1 |
| 15 Usage Meter, Context Meter breakdown | 7b | D | `core/{usage-meter,context-meter}/`, their render files, `{usage-meter,context-meter}.css` | 7750 | 1 |
| 16 Quota Notice | 7b | D | `core/quota-notice/`, render files, `quota-notice.css` | 7800 | 1 |
| 17 Activity Graph | 7b | D | `core/activity-graph/`, render files, `activity-graph.css` | 7850 | 1 |
| 18 Thread List inbox | 7b | D | `core/thread-list/`, its render files, `thread-list.css` | 7900 | 1 |
| 19 Flow Graph (Open) | 7b | E | `core/flow-graph/`, render files, `flow-graph.css`, `@dagrejs/dagre` dependency | 7950 | 1 |
| 20 7b conformance | 7b | F | `tests/browser/wave-7/agent.spec.ts` (`case=wave-7b`), `aria-patterns.spec.ts` | 8000 | 10–19 |
| 21 Docs, 0.10.0, release merge | 7b | F | docs index, skill references, `.changeset/agent-ui-wave-7b.md`, marker removal | 8050 | 20, 0.9.0 published |

## Component task routine

Tasks 2–8 and 10–19 each follow these steps after their own **Interfaces** are written down. A task lists only what differs. "The component" is the new component or the changed one.

- [ ] **1. Freeze core.** Write the primitive's options (with TSDoc and `@default`s: the docs' API tables read them), state, slots, api, `controlled` and `agent`. Unit-test only pure helpers (`node --test packages/agent-ui/tests/core/<helper>.test.mjs`). Add the `checkServer` case under the task's marker in `ui-sdk-testing.test.mjs`. Run `npm run lint && npm run typecheck && npm run test:unit`. Expected: PASS. Commit `feat(<name>): core`.
- [ ] **2. React and Web.** Shared fixture data in `tests/fixtures/shared/<name>.ts` (fixed dates, `now`, `timeZone: "UTC"`), cases in `tests/fixtures/{react,web}/cases/`, the parity entry with its interaction under the task's marker, the stylesheet (`@layer components`, keyed on `data-*` and `--kind-*`) imported from `agent-ui.css` at the marker, and `tests/browser/wave-7/<name>.spec.ts`: an `expectAgentActions` snapshot, the keyboard path, the task's own checks, and axe in light and dark (with any popup open). Run `KIND_LAYERS=react,web KIND_FIXTURE_PORT_BASE=<base> npx playwright test tests/browser/wave-7/<name>.spec.ts`. Expected: PASS.
- [ ] **3. Vue, Svelte and Solid, in parallel.** Start three subagents, one per layer, each with: the frozen core file, the React render file and React fixture case as the structural reference, the framework's skill and `.agents/experts/<layer>/decisions.md`, its port (D6), and its owned files: `src/<layer>/…`, `tests/fixtures/<layer>/cases/<name>.*`, `apps/docs/examples/<name>/*.<layer extension>`, `registry/consumers/<layer>/items/<name>.*`, its manifest line and spec list under the task's marker in `registry/layers/<layer>.mjs`, and budget entries in `tests/browser/budgets/<layer>.ts`. Each runs `KIND_LAYERS=react,<layer> npx playwright test tests/browser/wave-7/<name>.spec.ts tests/browser/parity.spec.ts tests/browser/hydration.spec.ts --grep <name>` and `npm run typecheck`. A core bug a subagent finds comes back to the owner, who fixes it in core and re-runs React and Web.
- [ ] **4. Registry and skill.** Add the component to `components` in `registry/catalog.mjs` at the marker (title, one-line description, `group`, `when`, `uses` naming the internals its render files import) and any new internal under `internals`. Run `npm run build:skill` (regenerates `skills/agent-ui/references/components.md`) and update `SKILL.md`'s component count. Where the task says, add a section to `references/compose.md` or `approvals.md`. Run `node --test scripts/tests/{registry,skill,parity,layers}.test.mjs`. Expected: PASS.
- [ ] **5. Docs.** Follow `apps/docs/content/docs/components/step.mdx` and the `write-docs` and `fumadocs` skills: one captioned example on top, then Installation (`<Install>`), Composition, Usage, API Reference (`<auto-type-table>` over `<Name>Options`), Agent (`Pick<<Name>Api, …>`), the framework naming note and the closing Web Components caption. For a changed component, add a section and an example to its existing page. Add the page to `components/meta.json`. Run `node --test scripts/tests/docs.test.mjs && npm run build:docs`. Expected: PASS.
- [ ] **6. Screenshots.** Light and dark of the docs example, nothing focused, plus one with its popup, approval or menu open and one at 390 px, into `artifacts/screenshots/<name>-{light,dark,open,narrow}.png`, attached to the PR with the `github-pr-media` skill. Then run `impeccable` `audit` and `critique` on them and `web-interface-guidelines` on the render and style files; fix what they find or say why not.
- [ ] **7. Size.** `npm run check:size`, then set budgets as Global Constraints say.
- [ ] **8. Finish.** Write the task's bullet under its "UI SDK API notes" marker in `AGENTS.md` (only what differs from UI SDK or from this plan), and `decisions.md` entries for what the experts should keep. Run `unslop` on the diff, then `expert-review` (`node scripts/expert-scope.mjs --base main` names the experts), and fix the findings. Run `npm run check` once, alone, through one subagent, with `KIND_FIXTURE_PORT_BASE=<base + 40>`. Expected: PASS.
- [ ] **9. PR.** Commit `feat(<name>): …`, push, and open the PR against the batch's base. The body reports what was checked by hand in a real browser (keyboard, focus rings only on keyboard, 390 px with touch, reduced motion through the media query and the `motion` option, light and dark), what wasn't, the fx-gui stop-gap it replaces (spec §9) and, for 7a, the swap note (D8). **Don't merge.**

---

### Task 1: Wave 7 groundwork

Spec §3; D2, D4, D5, D6.

**UI SDK:** `core.md` "Live State", "Announcements", "Names and Labels"; the installed `@ui-sdk/core` exports of `visibleWaterfallRows`, `createWaterfallController`, `createTimelineController` (to note which entry each comes from for Tasks 10 and 11).

**Files:**
- Create: `packages/agent-ui/src/core/{countdown,retry,approval-part,aggregate,meter-base}.ts`
- Modify: `src/types/{message,tool,step,records,index}.ts` (spec §3.1); `src/core/connection-status/connection-status.ts` (spreads `createCountdown`), `src/core/tool/tool.ts` (spreads `approvalPart`), `src/core/context-meter/context-meter.ts` (spreads `meterBase`), with no option, state key, slot or action changing; `src/core/index.ts` (exports and markers); `registry/catalog.mjs`, `registry/layers/*.mjs`, `tests/fixtures/shared/parity.ts`, `tests/browser/budgets/*.ts`, `tests/browser/wave-1/{forced-colors,status-mark}.spec.ts`, `src/styles/agent-ui.css`, `registry/consumers/*`, `THIRD_PARTY_NOTICES.md`, `AGENTS.md`, `packages/agent-ui/tests/core/ui-sdk-testing.test.mjs` (one marker per Tasks 2–8 and 10–19, D4); `playwright.config.mjs` (`waves` gains `wave-7`); `scripts/affected-specs.mjs` if it names waves; `scripts/build-skill.mjs` (an `ops` group, heading "Agent ops", after `shell`); `docs/superpowers/specs/2026-11-14-agent-ui-design.md` (§4.2 gains spec §3.1's types; §6's confirm list gains spec §3.3's; §7 gains a "Wave 7 (0.9 and 0.10): agent ops" section pointing at the Wave 7 spec; the internal components table gains Waterfall, Timeline and Switch rows).
- Test: `packages/agent-ui/tests/core/{countdown,aggregate}.test.mjs`

**Interfaces (spec §3.2):**
- `createCountdown(context, { key, at })` writes `live` whole seconds until `at()` (an ISO instant) to state key `key`; `null` on the server and before the root binds; one `setTimeout` per instance, waking on each whole second; cleared on destroy. `countdownText(seconds, locale)` → "in 4 sec", "in 1 min 12 sec" (`durationLabel`).
- `retryPart({ retry: (options) => RetryState | undefined, countdownKey })` returns `{ slot, state, onOptions }` the component spreads: the slot `retry` (present while `retry`; `data-retry-part`; a running status mark, `aria-hidden`; text from `retryText(retry, seconds)`), and an `onOptions` listener that `announce`s `retryAnnouncement(retry)` when `attempt` changes and the instance saw the previous state.
- `approvalPart` moves Tool's approval slot, `approvalState` memo and options (`onApprove`, `onDeny`, `approvalReason`) verbatim; Task 4 adds `onAlwaysAllow`.
- `aggregateStatus(statuses: StepStatus[]): StepStatus` as spec §3.2.
- `meterBase` moves Context Meter's popup, ring and formatting verbatim.

- [ ] **Step 1: Write the failing tests.**

```js
test("aggregateStatus puts a waiting step first", () => {
  assert.equal(aggregateStatus(["complete", "awaiting-input", "running"]), "awaiting-input");
  assert.equal(aggregateStatus(["complete", "error", "running"]), "running");
  assert.equal(aggregateStatus(["complete", "error"]), "error");
  assert.equal(aggregateStatus(["cancelled", "cancelled"]), "cancelled");
  assert.equal(aggregateStatus([]), "pending");
});
test("countdownText reads whole seconds", () => {
  assert.equal(countdownText(4, "en"), "in 4 sec");
  assert.equal(countdownText(72, "en"), "in 1 min 12 sec");
});
```

- [ ] **Step 2: Run** `npm run test:unit`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** the types and modules, and the three refactors. Every existing spec of Connection Status, Tool and Context Meter must pass unchanged in every layer: run `npx playwright test tests/browser/wave-6/connection-status.spec.ts tests/browser/wave-2/tool.spec.ts tests/browser/wave-3/context-meter.spec.ts tests/browser/parity.spec.ts --grep "connection-status|tool|context-meter"` with `KIND_FIXTURE_PORT_BASE=7050`.
- [ ] **Step 4: Spec.** If the user changed any spec §10 answer, rewrite the Wave 7 spec and this plan's affected tasks now, before any component starts.
- [ ] **Step 5: Run** `npm run lint && npm run typecheck && npm run test:unit && npm run test:scripts && npm run check:size`. Expected: PASS (sizes unchanged within 100 bytes).
- [ ] **Step 6:** Write the "Wave 7 groundwork" bullet in `AGENTS.md`. Commit `feat: Wave 7 groundwork`, push, open the PR against `main`. Don't merge.

---

### Task 2: Composer steering and Queue's Send now

Spec §4 "Composer steering", gap 1. Replaces fx-gui `components/stopgaps/steer-keys.tsx`.

**UI SDK:** Token Input (`submitShortcut`, IME), Menu (`docs/components/menu.md`, "Controller"), `createFocusRecovery`, `isComposing`.

**Files:**
- Modify: `src/core/composer/composer.ts`, `src/core/queue/queue.ts`; Composer's and Queue's render files in all five layers; `src/styles/{composer,queue}.css`
- Test: `tests/browser/wave-7/composer-steer.spec.ts`; Queue's case in the same spec

**Interfaces:**
- Composer options: `running?: boolean` (default `false`); `onSteer?(draft, details: { mode: "steer" | "queue"; source })` (`"action"`: a returned promise is the steer's pending lock); `steerMode?: "steer" | "queue"` (default `"steer"`).
- State: `running`, `canSteer` (`running && onSteer`), `steerPending`, `steerMenuOpen`.
- Slots: `steer` (the Send button while `canSteer`, named "Steer" or "Queue" by `steerMode`, `data-kind-button`), `steer-menu-trigger` (chevron, "More send options", a Menu trigger), `steer-menu` (two radio-less items, "Steer now" and "Queue for next turn", each with its shortcut from `formatShortcut`). Stop's `present` becomes `(pending || running) && canStop`; Send's 0.8 `present` is unchanged when `onSteer` isn't set.
- Keys: Enter (Token Input's submit) calls `steer(steerMode)` while `canSteer`; Mod+Enter (Alt+Enter under `submitOn: "mod-enter"`) the other mode, declared in the input slot's `keys`.
- API getters: `steer(mode?)` and `queue()`, offered while `canSteer` and the draft is submittable. Agent actions: `steer`, `queue` (the composer's mark gates both).
- Announcements: "Steer sent" or "Queued" on resolve; the draft keeps its text on reject, with Composer's existing error line.
- Queue: `onSend?(id, details)` (`"action"`, `createPendingAction` keyed by id): a pending item shows "Send now" (`send` slot, before Remove). Agent action `send(id)`. Web: `can-send`, event `queuesend`.
- Web: `can-steer`, event `steer` (`detail.value` the draft, `detail.mode`).

- [ ] **Step 1: Write the failing browser test** (five layers through the routine):
  - **Review Focus 1.** With `running` and `onSteer`, Send and Stop both show at the actions row's fixed width; Enter calls `onSteer` with `mode: "steer"`; Mod+Enter with `"queue"`; the chevron menu's "Queue for next turn" with `"queue"` by pointer and by keyboard.
  - A deferred steer locks Send and the keys until it resolves; resolving clears only the sent snapshot (text typed meanwhile stays); rejecting keeps the draft.
  - Composition (`compositionstart` … Enter … `compositionend`) sends nothing.
  - Without `running`, the 0.8 behavior holds: Stop replaces Send only while `pending`.
  - `expectAgentActions(page, "Composer", [..., "steer", "queue", "stop"])` while running; both render through the composer's `data-agent-confirm`.
  - Queue: "Send now" calls `onSend`, locks until the host removes or changes the item.
- [ ] **Step 2: Run** `KIND_LAYERS=react,web KIND_FIXTURE_PORT_BASE=7100 npx playwright test tests/browser/wave-7/composer-steer.spec.ts`. Expected: FAIL.
- [ ] **Step 3: Implement**, then routine steps 3–9. Docs: a "Steering" section and example on `composer.mdx` and a "Send now" section on `queue.mdx`; a "Steer a running turn" section in `skills/agent-ui/references/compose.md`. Glyph: Lucide `chevron-down` (already listed). Commit `feat(composer): steer and queue while a turn runs`.

---

### Task 3: Message delivery mark and retrying

Spec §4 "Message delivery mark", "Retrying"; gaps 2 and 5. Replaces fx-gui `components/stopgaps/{delivery-mark,retrying}.tsx`.

**UI SDK:** `announce`, `createFocusRecovery`.

**Files:**
- Modify: `src/core/message/message.ts`; Message's render files in all five layers; `src/styles/message.css`; the AI SDK adapter section of `packages/agent-ui/README.md` (AI SDK reports no retries or deliveries, spec §3.1)
- Test: `tests/browser/wave-7/message-delivery.spec.ts`

**Interfaces:**
- Options: `delivery?: "steered" | "queued"`; `onWithdraw?(details)` (`"action"`); `retry?: RetryState`.
- Slots: `delivery` (in the header, present with `delivery` on a user message: a mark, `aria-hidden`, and the words "Steered" or "Queued"; the root's `aria-describedby` includes it), `withdraw` (present while `delivery === "queued"` and `onWithdraw`; focus recovery to the editor's composer, else the message), and `retry` from `retryPart` (in the footer row where the outcome sits; absent while an outcome shows).
- API getters: `withdraw`. Agent action `withdraw`. Web: `can-withdraw`, event `withdraw`.
- Glyph: Lucide `corner-down-right` for Steered; Queued uses the pending status mark.

- [ ] **Step 1: Write the failing browser test:**
  - A user message with `delivery: "steered"` reads "Steered" in its header and description; `"queued"` reads "Queued" with Withdraw; Withdraw by keyboard calls `onWithdraw`, locks, and releases when `delivery` changes.
  - **Review Focus 3.** `retry: { attempt: 2, maxAttempts: 5, retryAt, reason: "Rate limited" }` on a streaming message shows "Retrying, attempt 2 of 5, in 4 sec · Rate limited" under the text, ticks to "in 3 sec" (the test advances the clock with `page.clock`), announces "Retrying, attempt 2" once and nothing per tick; the text above keeps its position (bounding box unchanged).
  - Server markup (`?ssr`) shows no seconds; hydration has no warning.
  - Budget: a countdown tick writes one text node in every layer.
- [ ] **Step 2: Run** the spec (port 7150). Expected: FAIL.
- [ ] **Step 3: Implement**, then routine steps 3–9. Docs: "Steered and queued messages" and "Retrying" sections and examples on `message.mdx`. Commit `feat(message): delivery mark and retrying`.

---

### Task 4: Terminal approval and Confirmation's Always allow

Spec §4 "Terminal approval and the shared approval part"; gap 3. Replaces fx-gui's Confirmation stacked above Terminal, and its "Always allow in this thread" host button.

**UI SDK:** as Confirmation (`createPendingAction`, Textarea, focus recovery).

**Files:**
- Modify: `src/core/{terminal/terminal.ts,confirmation/confirmation.ts,approval-part.ts}`; Terminal's and Confirmation's render files in all five layers, and only the approval props in Tool's (React, Web, Vue, Svelte, Solid); `src/styles/{terminal,confirmation}.css`
- Test: `tests/browser/wave-7/terminal-approval.spec.ts`

**Interfaces:**
- Confirmation: `onAlwaysAllow?: ConfirmationCallback`, `alwaysLabel?` (default "Always allow"); the decision gains `always?: true`. An `always` slot between Approve and Deny, present while set and the request is actionable; one lock with the others. Agent action `alwaysAllow`. Web: `can-always-allow`, event `alwaysallow`.
- `approvalPart` gains `onAlwaysAllow` and passes it through `approvalState`.
- Terminal spreads `approvalPart`: options `approval?`, `onApprove?`, `onDeny?`, `onAlwaysAllow?`, `approvalReason?`. The `approval` slot sits after the command line and before the output; status defaults to `awaiting-input` while the approval is actionable (before `exitCode`/output rules); the output part is absent while there's no output. Agent actions: Confirmation's, through its own entry ("Run <command>?").
- Tool's render files pass `onAlwaysAllow` (Vue, Svelte, Solid key by key; web `alwaysAllowHandler`).

- [ ] **Step 1: Write the failing browser test:**
  - **Review Focus 2.** A Terminal with `command: "npm test"` and a requested approval shows the command and Approve, Always allow, Deny, with status "awaiting input"; Approve calls `onApprove` and locks; the host's `responded` plus output shows the output after the outcome; nothing above the Terminal moves.
  - Deny with `approvalReason` opens the reason box, sends the reason, and keeps the command with "Denied: <reason>".
  - Always allow calls `onAlwaysAllow` with `always: true`; it's absent without the callback.
  - A Tool with `onAlwaysAllow` shows the same third choice.
  - Axe light and dark with the approval open; the Confirmation inside renders `data-agent-confirm`.
- [ ] **Step 2: Run** the spec (port 7200). Expected: FAIL.
- [ ] **Step 3: Implement**, then routine steps 3–9. Docs: "Approve a command" on `terminal.mdx`, "Always allow" on `confirmation.mdx` and `tool.mdx`; `skills/agent-ui/references/approvals.md` gains Terminal and Always allow (the host keeps the allow list). Commit `feat(terminal): approve a command in place`.

---

### Task 5: Tool retry and retrying

Spec §2.2 "tool failure + retry", §4 "Retrying"; gap 5.

**Files:**
- Modify: `src/core/tool/tool.ts` (not `approvalPart`); Tool's render files in all five layers except their approval props; `src/styles/tool.css`; `apps/docs/content/docs/components/tool.mdx` (the "Tool as the fallback" recipe, spec §2.2)
- Test: `tests/browser/wave-7/tool-retry.spec.ts`

**Interfaces:**
- Options: `retry?: RetryState` (default `call.retry`); `onRetry?(call, details)` (`"action"`, `createPendingAction` keyed by `toolCallId`, released when the status changes).
- Slots: `retry` from `retryPart` (beside the error part); `retry-button` in the error part, present while status `error` and `onRetry`, focus recovery to the trigger.
- API getter `retry`. Agent action `retry`. Web: `can-retry`, event `toolretry` (Message's `retry` event bubbles from inside a message).

- [ ] **Step 1: Write the failing browser test:** a failed call with `onRetry` shows Retry in its error part; Retry locks until the status changes; a running call with `retry` shows the retry line and announces once per attempt (as Task 3's checks); two Tools retry independently (base spec §4.1). `expectAgentActions(page, "search_docs", ["expand", "collapse", "retry"])` for the failed one.
- [ ] **Step 2: Run** the spec (port 7250). Expected: FAIL.
- [ ] **Step 3: Implement**, then routine steps 3–9. Docs: "Retry a failed call" and "Retrying" on `tool.mdx`, plus the fallback recipe (`renderers[call.name] ?? Tool`). Commit `feat(tool): retry a failed call`.

---

### Task 6: Diff

Spec §2.1 gap 4 decision, §4 "Diff". Replaces fx-gui `components/stopgaps/diff-view.tsx`.

**UI SDK:** `createVirtualizer` ("Rows of Any Height"), internal Scroll Area, `bindFindable` and `hiddenAttrs`, `createPendingAction`'s pattern, `createCopy`.

**Files:**
- Create: `packages/agent-ui/src/core/diff/{diff,rows,index}.ts`, render files in all five layers, `src/styles/diff.css`
- Modify: `packages/agent-ui/package.json` (`"diff": "9.0.0"`), `package-lock.json`, `THIRD_PARTY_NOTICES.md` (jsdiff, BSD-3-Clause, under the marker)
- Test: `packages/agent-ui/tests/core/diff-rows.test.mjs`, `tests/browser/wave-7/diff.spec.ts`, budget cases

**Interfaces:**
- `diffRows({ patch?, before?, after? })` (`rows.ts`, pure): jsdiff `parsePatch` or `structuredPatch(…, { context: 3 })` → `{ hunks, rows: DiffRow[], added, removed }`, where a row is `{ kind: "hunk" | "context" | "add" | "remove" | "collapsed", oldLine?, newLine?, text, words? }` and `words` come from `diffWordsWithSpace` over paired remove/add runs; unchanged runs over 6 lines become `collapsed` with their lines kept for find in page. Cached per input; a `patch` that extends the last one re-parses from its last complete hunk.
- Options: `file: DiffFile`, `patch?`, `before?`, `after?`, `highlight?` (Code Block's), `streaming?`, `onAccept?`, `onRevert?` (`"action"`, one lock), `onCopy?`, `agentConfirm?` (default `true`, marks the root while `onRevert` is set), `label?` (default the path), `motion`.
- Slots: `root` (`figure`), `header`, `path`, `stats` (`role="img"` named "12 added, 3 removed"; text "+12 −3"), `copy`, `accept`, `revert`, `viewport` (`focus: "tab-stop"`, virtualized past 400 rows), `table` (`role="table"`, `aria-rowcount`), `row` (`role="row"`, `data-kind`), `old-number` and `new-number` (`rowheader`), `sign` (visually the `+`/`−`, read as "added"/"removed"), `code`, `word` (`mark` for a changed word), `collapsed` (a button "Show N lines", findable).
- Agent actions: `accept`, `revert`, `expandAll`, `copy`. Web events `diffaccept`, `diffrevert`, `diffcopy`; `can-accept`, `can-revert`.
- Glyphs: Lucide `arrow-right` (rename), `copy`, `check` (Accept), `undo-2` (Revert), `chevrons-up-down` (Show lines).

- [ ] **Step 1: Write the failing tests:**
  - Unit: `diffRows` numbers lines across hunks, pairs word changes, collapses a 20-line unchanged run with 3 lines each side, reads a rename and an added file, and re-parses only the new hunk of an extended patch.
  - Browser: the stats read "12 added, 3 removed"; a screen reader row reads old number, new number, change and code; "Show 14 lines" expands by Enter and by find in page; Accept and Revert lock while pending; `revert` renders `data-agent-confirm`.
  - **Review Focus 4.** Budget: streaming one hunk onto a 40-line and a 2,000-line diff renders a fixed number of React components and web parts; the 2,000-line diff renders at most the viewport's rows plus overscan.
- [ ] **Step 2: Run** `npm run test:unit` and the spec (port 7300). Expected: FAIL.
- [ ] **Step 3: Implement**, then routine steps 3–9 (`uses: ["internal-scroll-area"]`, `group: "output"`). Docs: the page shows a `before`/`after` diff, a streamed `patch`, and the recipe of a Tool whose content is a Diff for an edit approval. Commit `feat(diff): add Diff`.

---

### Task 7: Step Group

Spec §2.2 "tool group", "subagent list", §4 "Step Group". Replaces fx-gui's use of Chain of Thought to fold a turn's tool calls.

**UI SDK:** as Step (`bindPanel`, `createRovingFocus` through StepList, `announce`).

**Files:**
- Create: `packages/agent-ui/src/core/step-group/{step-group,index}.ts`, render files in all five layers, `src/styles/step-group.css`
- Test: `tests/browser/wave-7/step-group.spec.ts`

**Interfaces:**
- Spreads `stepBase`. Options: `items: { id, status, group? }[]`, `labels?: Record<string, (count: number) => string>`, `label?`, `status?` (default `aggregateStatus(items)`), `onCancel?` (`"action"`), `locale?`.
- State: `title` (the summary: `labels` joined by `Intl.ListFormat`, else "N steps"), `running` count; `meta` reads "2 running" while any run, else the duration.
- Slots: the Step base's, with `children` holding the host's steps inside a StepList, and `cancel` ("Stop all", present while any item runs and `onCancel`).
- Agent actions: `expand`, `collapse`, `cancel`.

- [ ] **Step 1: Write the failing browser test:** with three Tools inside and `labels`, the title reads "Read 2 files and ran 1 command"; it's `running` while one runs and folds when all complete (auto close); an error keeps it open; a child Tool's approval inside it still works by keyboard; with Subagents inside, the title reads "3 agents" and Stop all calls `onCancel`. Arrow keys move between the children's triggers (StepList).
- [ ] **Step 2: Run** the spec (port 7350). Expected: FAIL.
- [ ] **Step 3: Implement**, then routine steps 3–9 (`group: "steps"`). Docs: "Tool group" and "Parallel subagents" examples. Commit `feat(step-group): add Step Group`.

---

### Task 8: Handoff

Spec §2.2 "handoff", §4 "Handoff". Depends on Task 4 (`approvalPart` with `onAlwaysAllow`).

**Files:**
- Create: `packages/agent-ui/src/core/handoff/{handoff,index}.ts`, render files in all five layers, `src/styles/handoff.css`
- Test: `tests/browser/wave-7/handoff.spec.ts`

**Interfaces:**
- Options: `from: AgentInfo | { kind: "person"; name: string }`, `to` (same), `reason?`, `status: "pending" | "accepted" | "declined" | "complete"`, the `approvalPart` options, `label?` (default "Handoff to <to>").
- Slots: `root` (`group`, named), `from-avatar` and `to-avatar` (bare UI SDK Avatar, `aria-hidden`), `text` ("Support handed off to Billing"), `reason` (`blockquote`), `status` (mark and words), `approval`.
- Announces "Handed off to <to>" once on `accepted`, "<to> declined" on `declined`, only after the instance saw `pending`. Agent actions: none of its own; its Confirmation's.
- Glyph: Lucide `arrow-right`.

- [ ] **Step 1: Write the failing browser test:** the text and status read in words; an approval inside approves and denies by keyboard; the announcement fires once on `accepted`; a handoff to a person shows the person's name in words and no avatar.
- [ ] **Step 2: Run** the spec (port 7400). Expected: FAIL.
- [ ] **Step 3: Implement**, then routine steps 3–9 (`uses: ["internal-avatar"]` if the layer has it, else the bare Avatar as Subagent does; `group: "steps"`). Commit `feat(handoff): add Handoff`.

---

### Task 9: 7a conformance, docs index and the 0.9.0 changeset

Spec §3.3, §7; D5, D9.

**Files:**
- Modify: `packages/agent-ui/tests/fixtures/{react,web,vue,svelte,solid}/cases/agent.*` (a `case=wave-7a` page: the Wave 1 page plus a running Composer with `onSteer`, a Queue with `onSend`, a queued user Message with `onWithdraw`, a retrying Message, a Terminal awaiting approval, a failed Tool with `onRetry`, a Diff, a Step Group and a Handoff awaiting approval; the bridge lists 100 components at most, so it doesn't extend the Wave 6 page); `apps/docs/content/docs/index.mdx`; `packages/agent-ui/README.md` (component list, the adapter note); `skills/agent-ui/SKILL.md` (count, description); `scripts/tests/docs.test.mjs` (visible pages)
- Create: `tests/browser/wave-7/{agent,aria-patterns}.spec.ts`, `.changeset/agent-ui-wave-7a.md`

- [ ] **Step 1: Write the tests**, every layer:
  - The snapshot lists every 7a component once by name; no composed Menu, Scroll Area or Avatar is an entry.
  - Only the Composer, Confirmations (inside Terminal, Tool and Handoff) and Diff (while `agentConfirm` and `onRevert`) render `data-agent-confirm` among 7a's.
  - Each 7a action but the bridge's `press` runs once through `act` and once through a person's input on a fresh page (`expectSameAsPerson`); callbacks get `details.source === "agent"`; on web every `can-*` attribute adds and removes its action.
  - `checkServer` for Diff, Step Group and Handoff; `checkPattern` for Diff (table) and Composer's steer menu (menu); Svelte's root `id` gap goes through `rootIdGap(testInfo)` as before.
- [ ] **Step 2: Run** `npx playwright test tests/browser/wave-7/agent.spec.ts tests/browser/wave-7/aria-patterns.spec.ts` (port 7450). Expected: PASS; fix the owning primitive for any failure, in a PR against `main`.
- [ ] **Step 3: Changeset** `.changeset/agent-ui-wave-7a.md`: `"@kind-ui/agent-ui": minor`, listing Diff, Step Group and Handoff; Composer's `running`, `onSteer`, `steerMode`; Queue's `onSend`; Message's `delivery`, `onWithdraw`, `retry`; Tool's `retry`, `onRetry`; Terminal's approval; Confirmation's `onAlwaysAllow`; the neutral `RetryState`, `DiffFile`, `Message.delivery`/`retry`, `ToolCall.retry`, and the terminal step's `approval`.
- [ ] **Step 4: Docs index** in the site's voice (`write-docs`), with "fx-gui swap" notes collected in the PR body (D8). Run `npm run build:docs`, then `npm run check` alone through a subagent (port 7490). Expected: PASS.
- [ ] **Step 5:** `unslop`, `expert-review`. Commit `docs: index Wave 7a and add the 0.9.0 changeset`, push, open the PR. Don't merge, publish or version.

---

### Task 10: Trace

Spec §2.2 "trace waterfall", "tool timeline", §5 "Trace".

**UI SDK:** Waterfall (`docs/components/waterfall.md`: "Nested Spans", "Zoom", "Large Traces", "Controller"), `createVirtualizer`, `visibleWaterfallRows`, `createWaterfallController`.

**Files:**
- Create: `packages/agent-ui/src/core/trace/{trace,spans,index}.ts`; `internal-waterfall` in all five layers (`src/<layer>/internal/waterfall.*`, a `withKindClass` wrapper as the other internals); render files in all five layers; `src/styles/trace.css`
- Test: `packages/agent-ui/tests/core/trace-spans.test.mjs`, `tests/browser/wave-7/trace.spec.ts`, budget cases

**Interfaces:**
- `traceSpans(steps: Step[], { origin? })` (pure): Steps with `startedAt` become spans in milliseconds from the earliest start (or `origin`), `children` nest, `kind` from the step kind; `waterfallItems(spans, now)` → `WaterfallData` (a running span ends at `now`).
- Options: `spans: TraceSpan[]`, `label` (default "Trace"), `value`/`defaultValue`/`onValueChange` (selected span), `expanded`/`defaultExpanded`/`onExpandedChange`, `range?`, `now?` (else a one-second `live` clock while any span runs), `locale?`, `motion`.
- Slots: the Waterfall root's wrapper, `header`, `axis`, `row` (with `value`), `name` (row header: kind glyph, status mark, label), `duration` (cell), `bar`, `details` (present while a span is selected: a `dl` of kind, status, start, duration and attributes), `details-close`.
- Agent actions: `select(id)`, `expand(id)`, `collapse(id)`; `agent.items` lists span ids (closed). Web events `spanselect`, `expandchange` (Waterfall fires its own `valuechange`).
- Glyphs: Lucide `bot` (agent spans), `message-square` (model spans), `wrench` (tool spans); other spans show only their status mark.

- [ ] **Step 1: Write the failing tests:** unit for `traceSpans` (nesting, ISO and number starts, running spans); browser: rows read name, duration and the bar's "starts at 120 ms, takes 340 ms"; Right expands, Left collapses; Enter selects and shows details; Escape on details returns focus to the row. **Review Focus 5.** Budget at 50 and 5,000 spans in a fixed 400 × 600 viewport with 28px rows.
- [ ] **Step 2: Run** (port 7500). Expected: FAIL.
- [ ] **Step 3: Implement**, then routine steps 3–9 (`uses: ["internal-waterfall"]`, `group: "ops"`). Commit `feat(trace): add Trace`.

---

### Task 11: Run Timeline

Spec §2.2 "timeline", "run activity", §5 "Run Timeline".

**UI SDK:** Timeline (`docs/components/timeline.md`: "Status", "Details", "Feed", "Controller"), `core/time.ts` (`timeLabel`, `todayKey`).

**Files:**
- Create: `packages/agent-ui/src/core/run-timeline/{run-timeline,index}.ts`; `internal-timeline` in all five layers; render files; `src/styles/run-timeline.css`
- Test: `tests/browser/wave-7/run-timeline.spec.ts`

**Interfaces:**
- Options: `events: RunEvent[]`, `label` (default "Activity"), `order` (default `"oldest-first"`), `feed?` (default `false`), `busy?`, `hasMore?`, `onLoadMore?`, `now?`, `locale?`, `timeZone?`, `motion`.
- Slots: `root` (the Timeline), `item` (keyed by id; `status="current"` on a running last event), `marker` (the status mark), `title`, `time` (`<time datetime>`, absolute on the server, relative after bind), `actor`, `description` (Markdown view), `end` (loading row or Retry).
- New events after the first frame play `"fade-up"` once. Agent actions: none of its own; `agent.items` lists event ids.

- [ ] **Step 1: Write the failing browser test:** a list of events named by their titles and described by time and description; Up and Down move; the running event is `aria-current="step"`; `feed` makes articles with Page Down; appending an event plays its entrance once and moves nothing above; hydration shows absolute dates, then relative.
- [ ] **Step 2: Run** (port 7550). Expected: FAIL.
- [ ] **Step 3: Implement**, then routine steps 3–9 (`uses: ["internal-timeline", "markdown"]`, `group: "ops"`). Commit `feat(run-timeline): add Run Timeline`.

---

### Task 12: Job Progress

Spec §2.2 "job progress", §5 "Job Progress".

**UI SDK:** Progress (`docs/components/progress.md`, indeterminate), Step base.

**Files:**
- Create: `packages/agent-ui/src/core/job-progress/{job-progress,index}.ts`; render files; `src/styles/job-progress.css`
- Test: `tests/browser/wave-7/job-progress.spec.ts`

**Interfaces:**
- Spreads `stepBase`. Options: `label`, `value?` (0 to 1; `undefined` indeterminate), `stage?`, `stageIndex?`, `stageCount?`, `startedAt?`, `etaSeconds?`, `onCancel?`, `onRetry?` (`"action"`, one lock), `now?`.
- Slots: Step base's, plus `progress` (outside the content; the bare Progress, labelled by the stage), `stage` ("3 of 7: Installing dependencies"), `cancel`, `retry`.
- `meta`: "2 min elapsed, about 1 min left". Agent actions: `expand`, `collapse`, `cancel`, `retry`.

- [ ] **Step 1: Write the failing browser test:** the progressbar reads its value and stage; indeterminate has no `aria-valuenow` and is still under reduced motion; Cancel locks and moves focus to the trigger when it leaves; completion announces once.
- [ ] **Step 2: Run** (port 7600). Expected: FAIL.
- [ ] **Step 3: Implement**, then routine steps 3–9 (`group: "steps"`). Commit `feat(job-progress): add Job Progress`.

---

### Task 13: Schedule Card

Spec §2.2 "schedule card", §5 "Schedule Card".

**UI SDK:** Switch (`docs/components/switch.md`, controller), `createCountdown`.

**Files:**
- Create: `packages/agent-ui/src/core/schedule-card/{schedule-card,index}.ts`; `internal-switch` in all five layers; render files; `src/styles/schedule-card.css`
- Test: `tests/browser/wave-7/schedule-card.spec.ts`

**Interfaces:**
- Options: `schedule: Schedule`, `onEnabledChange?(enabled, details)` (`createChange`), `onRunNow?` (`"action"`), `onEdit?` (`"callback"`), `agentConfirm?` (default `true`), `now?`, `locale?`, `timeZone?`.
- Slots: `root` (`group`, named by `schedule.label`), `title`, `description`, `next` ("Next run <time>", countdown under an hour), `last` (status mark, words, link), `enabled` (the Switch, "Enabled"), `run-now`, `edit`.
- Agent actions: `setEnabled(on)`, `runNow`, `edit`. The root renders `data-agent-confirm` while `agentConfirm`. Web events `enabledchange`, `runnow` (`can-run-now`), `scheduleedit` (`can-edit`).
- Glyphs: Lucide `calendar-clock`, `play`, `pencil`.

- [ ] **Step 1: Write the failing browser test:** the Switch toggles by Space and reports; a refused change writes back; Run now locks; the next run reads absolute on the server and relative after bind; `expectAgentActions(page, "Daily triage", ["setEnabled", "runNow", "edit"])` with the confirm mark.
- [ ] **Step 2: Run** (port 7650). Expected: FAIL.
- [ ] **Step 3: Implement**, then routine steps 3–9 (`uses: ["internal-switch"]`, `group: "ops"`). Commit `feat(schedule-card): add Schedule Card`.

---

### Task 14: Agent Card (Open)

Spec §2.2 "agent card", §5 "Agent Card". Skip this task if the user drops Agent Card (spec §10 Q2).

**Files:**
- Create: `packages/agent-ui/src/core/agent-card/{agent-card,index}.ts`; render files; `src/styles/agent-card.css`
- Test: `tests/browser/wave-7/agent-card.spec.ts`

**Interfaces:**
- Options: `agent: AgentInfo`, `status?`, `href?`, `level?` (default 3), `actionLabel?` (default "Open"), `onAction?` (`"callback"`).
- Slots: `root` (`article`, labelled by its name), `avatar` (bare UI SDK Avatar with `avatarInitials`), `name` (heading, a link with `href`), `model`, `description`, `capabilities` (a list of `data-kind-badge`), `status`, `action`.
- Agent action `run` while `onAction`. Web event `agentaction` (`can-run`).

- [ ] **Step 1: Write the failing browser test:** heading level, link name, badges as a list, status in words; `run` through `act` and by pointer.
- [ ] **Step 2: Run** (port 7700). Expected: FAIL.
- [ ] **Step 3: Implement**, then routine steps 3–9 (`group: "ops"`). Commit `feat(agent-card): add Agent Card`.

---

### Task 15: Usage Meter and Context Meter's breakdown

Spec §2.2 "cost meter", "context breakdown", §5 "Usage Meter and Context Meter's breakdown".

**UI SDK:** Meter, `createPopup` with `hoverPopupPreset` (through `meterBase`).

**Files:**
- Create: `packages/agent-ui/src/core/usage-meter/{usage-meter,index}.ts`; render files; `src/styles/usage-meter.css`
- Modify: `src/core/{context-meter/context-meter.ts,meter-base.ts}`; Context Meter's render files in all five layers; `src/styles/context-meter.css` (the shared `breakdown` styles move to a `meter-breakdown` block both import)
- Test: `tests/browser/wave-7/usage-meter.spec.ts` (Usage Meter and Context Meter's breakdown)

**Interfaces:**
- `meterBase` gains a `breakdown` slot family: `breakdown` (a stacked bar, `aria-hidden`, segments `--kind-usage-slice-<i>` from `--kind-chart-*` tokens if present, else the status tokens), `breakdown-row` (label, value, percent).
- Context Meter: `breakdown?: UsageSlice[]` (tokens).
- Usage Meter: `used`, `limit`, `unit?: "tokens" | "requests" | "currency"` (default `"currency"`), `currency?` (default `"USD"`), `period?`, `resetAt?`, `warnAt?` (default 0.8), `breakdown?`, `label` (default "Usage"), `open`/`defaultOpen`/`onOpenChange`, `locale?`, `motion`. The trigger is named "Usage, $3.20 of $5.00, 64%"; the level writes `data-level="normal" | "warning" | "error"`.
- Agent actions: `open`, `close` (and the bridge's `press`).

- [ ] **Step 1: Write the failing browser test:** the details list each slice with its percent; the stacked bar's segments sum to the used share; a Context Meter without `breakdown` is unchanged from 0.8 (parity); the Usage Meter's name and level change at `warnAt` and at the limit; hover and focus open as Context Meter's.
- [ ] **Step 2: Run** (port 7750). Expected: FAIL.
- [ ] **Step 3: Implement**, then routine steps 3–9 (`group: "ops"` for Usage Meter). Commit `feat(usage-meter): add Usage Meter and Context Meter's breakdown`.

---

### Task 16: Quota Notice

Spec §2.2 "quota banner", §5 "Quota Notice".

**UI SDK:** Meter, `announce`, through `noticeBase`.

**Files:**
- Create: `packages/agent-ui/src/core/quota-notice/{quota-notice,index}.ts`; render files; `src/styles/quota-notice.css`
- Test: `tests/browser/wave-7/quota-notice.spec.ts`

**Interfaces:**
- Spreads `noticeBase`. Options: `used`, `limit`, `unit?` ("requests"), `period?`, `resetAt?`, `warnAt?`, `variant?` (else derived), `label?` (else "You've used 80% of this month's requests"), `upgradeLabel?` (default "Upgrade"), `onUpgrade?` (`"callback"`), `onDismiss?` (Notice's), `now?`, `locale?`.
- Slots: Notice's, plus `meter` (bare Meter with its value in words), `reset` ("Resets in 3 days"), `upgrade`.
- Agent actions: `upgrade`, `dismiss`. Web event `upgrade` (`can-upgrade`).

- [ ] **Step 1: Write the failing browser test:** variant `warning` at 80%, `error` at 100%, each announced once; `used` changes within a variant announce nothing; Upgrade and Dismiss by keyboard; the reset countdown is never announced.
- [ ] **Step 2: Run** (port 7800). Expected: FAIL.
- [ ] **Step 3: Implement**, then routine steps 3–9 (`group: "indicators"`). Commit `feat(quota-notice): add Quota Notice`.

---

### Task 17: Activity Graph

Spec §2.2 "activity/heat graph", §5 "Activity Graph".

**UI SDK:** `createGridFocus` ("One Tab Stop in a Grid", "Cells That Can't Take Focus"), `@ui-sdk/core/date` (`dateFormatter`, arithmetic), `core/time.ts`.

**Files:**
- Create: `packages/agent-ui/src/core/activity-graph/{activity-graph,levels,index}.ts`; render files; `src/styles/activity-graph.css`
- Test: `packages/agent-ui/tests/core/activity-levels.test.mjs`, `tests/browser/wave-7/activity-graph.spec.ts`, budget case

**Interfaces:**
- `activityWeeks(days, { now, weeks, weekStart })` and `activityLevels(counts, levels)` (pure; quantiles over non-zero counts).
- Options: `days: ActivityDay[]`, `label` (default "Activity"), `unit?` (default "runs"), `weeks?` (53), `levels?` (4), `weekStart?` (from the locale's `Intl.Locale#getWeekInfo` when available, else Sunday), `now?`, `onSelect?(date, details)` (`"callback"`), `locale?`, `timeZone?`.
- Slots: `root`, `months` (column labels, `aria-hidden`), `weekdays` (row headers), `grid` (`role="grid"`, described by the summary), `row`, `cell` (`gridcell`, `data-level`, named "12 runs on Tuesday, November 3, 2026"; future days `disabled`), `legend` (`aria-hidden`) and `summary` (visually hidden).
- Agent action `select(date)`; `agent.items` lists the dates with counts. Web event `dayselect` (`can-select`).

- [ ] **Step 1: Write the failing tests:** unit for weeks and levels (a leap year, a week start of Monday); browser: one Tab stop, arrows move by day and week (mirrored under `dir="rtl"`), Home and End within a week, future days skipped, Enter selects; budget: moving between days writes a fixed number of attributes at 53 weeks.
- [ ] **Step 2: Run** (port 7850). Expected: FAIL.
- [ ] **Step 3: Implement**, then routine steps 3–9 (`group: "ops"`). Commit `feat(activity-graph): add Activity Graph`.

---

### Task 18: Thread List inbox

Spec §2.2 "background runs inbox", §5 "Thread List inbox".

**UI SDK:** as Thread List; Progress.

**Files:**
- Modify: `src/core/{thread-list/thread-list.ts,thread-groups.ts}`; Thread List's render files in all five layers; `src/styles/thread-list.css`
- Test: `tests/browser/wave-7/thread-list-inbox.spec.ts`; budget cases beside Thread List's

**Interfaces:**
- `threadGroups` gains `groupBy: "date" | "status"` with the status groups and labels of spec §5 (renamable through `labels`).
- Thread List options: `groupBy?` (default `"date"`), `onArchive?(id, details)` (`"action"`), `onReadChange?(id, read, details)` (`"callback"`).
- Rows: a `summary` line and a `progress` bar (bare Progress, `aria-hidden` beside "45% done" in the row's description) while running; every row tall (`--kind-thread-row-height-tall`) once any thread has a `summary`. The status mark covers `queued` and `complete`.
- Menu: Archive and Mark as read/unread, each present with its callback. Agent actions `archive(id)`, `markRead(id, read?)`. Web events `threadarchive` (`can-archive`), `readchange` (`can-mark-read`).

- [ ] **Step 1: Write the failing browser test:** `groupBy: "status"` orders Needs you, Running, Done (pinned first); a running row reads its progress; Archive leaves with focus moving to the next row; the date grouping is unchanged (Wave 6's specs pass); budget: updating one running thread's `progress` among 1,000 renders a fixed number of parts.
- [ ] **Step 2: Run** (port 7900). Expected: FAIL.
- [ ] **Step 3: Implement**, then routine steps 3–9. Docs: an "Inbox of background runs" section and example on `thread-list.mdx`. Commit `feat(thread-list): group by status for background runs`.

---

### Task 19: Flow Graph (Open)

Spec §2.2 "flow graph", §5 "Flow Graph". Skip this task if the user drops Flow Graph (spec §10 Q1).

**UI SDK:** `core.md` "Canvas" (`createViewport`: "Pan and Zoom", "Fit, Reveal and Zoom from Code"), "Spatial Focus" (`spatialMove`), `createRovingFocus`.

**Files:**
- Create: `packages/agent-ui/src/core/flow-graph/{flow-graph,layout,index}.ts`; render files; `src/styles/flow-graph.css`
- Modify: `packages/agent-ui/package.json` (`"@dagrejs/dagre": "3.1.4"`), lockfile, `THIRD_PARTY_NOTICES.md`
- Test: `packages/agent-ui/tests/core/flow-layout.test.mjs`, `tests/browser/wave-7/flow-graph.spec.ts`

**Interfaces:**
- `flowLayout(nodes, edges, { direction, nodeWidth, nodeHeight })` (pure, dagre): node positions and edge polylines, cached by ids and edges (status changes don't lay out again).
- Options: `nodes`, `edges`, `label` (default "Flow"), `direction?` (`"right"`), `value`/`defaultValue`/`onValueChange` (selected node), `motion`.
- State: `viewport` (`live`), `layout`, `value`.
- Slots: `root` (the frame: `createViewport` events, `tabindex` from the behavior), `world` (live transform), `edges` (one `aria-hidden` SVG), `nodes` (`role="group"`, named by `label`), `node` (a button keyed by id, roving with `move: spatialMove()`, named "<label>, <kind>, <status>", described by its edges in words), `controls` (Zoom in, Zoom out, Fit).
- Agent actions: `select(id)`, `fit`, `zoomIn`, `zoomOut`; `agent.items` lists node ids. Web event `nodeselect`.
- Glyphs: Lucide `zoom-in`, `zoom-out`, `maximize`.

- [ ] **Step 1: Write the failing tests:** unit for the layout cache; browser: Tab reaches one node; arrows move to the nearest node in that direction; focus reveals an off-screen node; +, − and 0 zoom from the frame; each node's description names its edges; reduced motion pans without easing.
- [ ] **Step 2: Run** (port 7950). Expected: FAIL.
- [ ] **Step 3: Implement**, then routine steps 3–9 (`group: "ops"`). Commit `feat(flow-graph): add Flow Graph`.

---

### Task 20: 7b conformance

As Task 9 Step 1–2, for 7b, against `wave-7b`.

**Files:**
- Modify: the agent fixture pages in all five layers (a `case=wave-7b` page: Trace, Run Timeline, Job Progress, Schedule Card, Agent Card, Usage Meter, a Context Meter with `breakdown`, Quota Notice, Activity Graph, a Thread List with `groupBy: "status"`, Flow Graph); `tests/browser/wave-7/{agent,aria-patterns}.spec.ts`; `ui-sdk-testing.test.mjs`

- [ ] **Step 1: Write the tests:** every 7b component once by name (no Waterfall, Timeline, Switch, Meter or Progress entry of its own); only Schedule Card (while `agentConfirm`) renders `data-agent-confirm` among 7b's; each action through `act` and a person; `checkPattern` for each pattern the installed kit has (treegrid for Trace, list and feed for Run Timeline, switch for Schedule Card, popover for Usage Meter); Activity Graph's grid and Flow Graph's spatial arrows through `checkDirection` under `dir="rtl"` and their own keyboard tests, as Wave 6 did for Thread List's grid.
- [ ] **Step 2: Run** (port 8000). Expected: PASS; fix the owner in a PR against `wave-7b`.
- [ ] **Step 3:** `unslop`, `expert-review`, `npm run check` alone (port 8040). Commit `test: add Wave 7b agent conformance`, open the PR against `wave-7b`. Don't merge.

---

### Task 21: Docs index, the 0.10.0 changeset and the release merge

D4, D5, D9.

**Files:**
- Create: `.changeset/agent-ui-wave-7b.md`
- Modify: `apps/docs/content/docs/index.mdx`, `packages/agent-ui/README.md`, `skills/agent-ui/SKILL.md` (count 68, or fewer if Open items drop), `skills/agent-ui/references/compose.md` (an "Agent ops" section: a run page with Run Timeline, Trace and Usage Meter), `scripts/tests/docs.test.mjs`; remove every `wave-7-task-<n>` marker (D4).

- [ ] **Step 1:** Wait until 0.9.0 has published (the coordinator says so). Merge `main` into `wave-7b`.
- [ ] **Step 2: Changeset** `"@kind-ui/agent-ui": minor`: the 7b components, Context Meter's `breakdown`, Thread List's `groupBy`, `onArchive`, `onReadChange`, the neutral `TraceSpan`, `RunEvent`, `AgentInfo`, `Schedule`, `UsageSlice`, `ActivityDay`, `FlowNode`, `FlowEdge`, and `Thread`'s new statuses, `progress` and `summary`.
- [ ] **Step 3: Docs index** (`write-docs`); `npm run build:docs`; `npm run check` alone (port 8090). Expected: PASS.
- [ ] **Step 4:** `unslop`, `expert-review`. Commit `docs: index Wave 7b and add the 0.10.0 changeset`, push, and open the PR `wave-7b` → `main`. Don't merge, publish or version.

---

## How this plan builds on UI SDK

| Requirement | Where |
| --- | --- |
| One `definePrimitive` per component, `createParts` per render file, in five layers | Guard in `npm run lint`, parity and hydration specs, every task |
| Traces are UI SDK Waterfall, virtualized as its "Large Traces" shows | Trace (Task 10) |
| Activity feeds are UI SDK Timeline, `feed` included | Run Timeline (Task 11) |
| Progress, meters and switches are UI SDK Progress, Meter and Switch | Tasks 12, 13, 15, 16, 18 |
| Grids with one Tab stop are `createGridFocus` | Activity Graph (Task 17) |
| Pan, zoom and spatial arrows are `createViewport` and `spatialMove` | Flow Graph (Task 19) |
| Menus are UI SDK Menu | Composer's steer menu (Task 2) |
| Pending locks follow `createPendingAction`; approvals are Confirmation | Tasks 2–8, 12, 13 |
| Virtualization is `createVirtualizer` | Diff (Task 6), Trace (Task 10) |
| Find in page reveals collapsed text through `bindFindable` | Diff (Task 6) |
| Every component is a live UI SDK primitive with its actions, and passes `@ui-sdk/core/testing` | `expectAgentActions` per task, Tasks 9 and 20 |
| Hand-written code only for spec §2 rows | None added (spec §3.3) |

## Self-Review Notes

- **Scope coverage (spec §2):** agent card (14), handoff (8), background runs inbox (18), schedule card (13), job progress (12), run activity and timeline (11), tool group and subagent list (7), tool timeline and trace waterfall (10), tool failure + retry (5), tool fallback (5, a recipe), flow graph (19), cost meter (15), context breakdown (15), quota banner (16), activity/heat graph (17). Gaps: steering (2), delivery mark (3), Terminal approval (4), diff (6), retrying (3, 5). Gaps 1, 2, 3 and 5 are Batch A, the first after groundwork.
- **Five layers:** every component task's routine step 3; parity, hydration and agent conformance in each layer (Tasks 9, 20).
- **Open items:** spec §10's six questions. Two tasks (14, 19) are skipped outright if dropped, and no other task depends on them.
- **Out of scope:** spec §6.
