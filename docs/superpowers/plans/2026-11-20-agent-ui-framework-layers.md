# `@kind-ui/agent-ui` Framework Layers (0.7) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task by task. Steps use checkbox (`- [ ]`) syntax for tracking. Each task is one session and one PR. After the shared groundwork, the Vue, Svelte and Solid tracks run in parallel and never touch each other's files: see "Parallel batches".

**Goal:** Ship native Vue, Svelte and Solid render layers for every shipped component (56 components and the 24 internal wrappers they compose), with the same parts, options, state, events, agent actions, accessibility, motion and tokens as the React and Web Components layers, as registry items, tested by the same browser specs, with framework tabs on every docs example and the 0.7.0 changeset.

**Architecture:** Nothing about behavior changes. Every component is already one framework-free `definePrimitive` in `packages/agent-ui/src/core/`, and UI SDK ships a `createParts` for each framework: `@ui-sdk/vue/primitive`, `@ui-sdk/svelte/primitive` and `@ui-sdk/solid/primitive`. Each new layer is a set of thin render files that call `createParts` on the existing primitive (or wrap a `@ui-sdk/<framework>/<name>` part), add the same Tailwind classes, and render the same default children the React layer renders. A bug a new layer finds is fixed once, in core, and React and Web are tested again.

**Tech Stack:** `@ui-sdk/core`, `@ui-sdk/react` and `@ui-sdk/web` stay at `0.1.0-beta.1`; `@ui-sdk/vue`, `@ui-sdk/svelte` and `@ui-sdk/solid` join them at `0.1.0-beta.1` (devDependencies, exact). Framework toolchains, exact-pinned devDependencies: `vue` 3.5.46, `vue-tsc` 3.3.14, `@vitejs/plugin-vue` 6.0.11; `svelte` 5.59.1, `svelte-check` 4.7.8, `@sveltejs/vite-plugin-svelte` 7.3.1; `solid-js` 2.0.3, `@solidjs/web` 2.0.3, `@solidjs/vite-plugin` 3.0.1. Each supports the repository's Vite 8.3.8. No runtime dependency joins `@kind-ui/agent-ui`.

**Spec:** `docs/superpowers/specs/2026-11-14-agent-ui-design.md`: §2 (layers, "Building on UI SDK"), §3 (exports), §6 "Agent actions", §7 "Framework layers (0.7)", §8, §9.2, §9.5, §10. This plan's PR writes D1–D16 into the spec. Also read `AGENTS.md` ("UI SDK API notes", Verification policy, the streaming UX checklist), `.agents/experts/*/decisions.md` and the Wave 6 plan for the routine this one keeps.

**Skills:** each track reads `ui-sdk` and `node_modules/@ui-sdk/<framework>/docs/llms.txt` first (then `core.md` by heading, `rendering.md`, `custom-parts.md`, `parts-and-composition.md`, `state-and-events.md` and `server-rendering.md` beside it), then its one framework skill: [`vue-best-practices`](../../../.agents/skills/vue-best-practices/SKILL.md), [`svelte-core-bestpractices`](../../../.agents/skills/svelte-core-bestpractices/SKILL.md) or [`solid-best-practices`](../../../.agents/skills/solid-best-practices/SKILL.md). This PR installs them (D15).

## Decisions

Proposed and decided 2026-11-20. The user pre-approved the framework layers work, so every decision that would have been open was made by the coordinator on the recommended option and is marked **Decided (coordinator, pre-approved)**. The rest follow from earlier waves' rules.

- **D1. Scope: every shipped component, in three frameworks, with no new behavior.** The 56 visible registry components and the 24 `internal-<name>` wrappers they use get Vue, Svelte and Solid render files. React and Web Components files don't change, except where a track finds a core bug (fixed in core, both old layers tested again in that PR). No new component, option or action joins in this plan. Nuxt, SvelteKit and SolidStart specifics (modules, `load` functions, server functions) are out of scope; each layer server-renders through its framework's own renderer (D11).

- **D2. Distribution: registry items only, as React and Web are. Decided (coordinator, pre-approved).** Spec §3 already ships the styled React and Web Components layers only through the registry, and keeps the npm package framework-free (no React peer, `@ui-sdk/react` and `@ui-sdk/web` not dependencies). The new layers follow that model. The three options weighed:

  | Option | For | Against |
  | --- | --- | --- |
  | **Registry items only (chosen)** | Same model as React and Web: one package version, one copy of core, files copied byte for byte into the consumer, who owns and restyles them. The package build stays `tsc` plus a CSS copy: no SFC or Svelte compiler, no `solid` export condition, no dual DOM/SSR builds. No peer dependency churn for people who don't use a framework. | No `import { Step } from "@kind-ui/agent-ui/vue"`; a consumer runs `shadcn add`. Fixes reach consumers by re-adding items, as they already do for React. |
  | Entry points `./vue`, `./svelte`, `./solid` with optional peers | One `npm install`; upgrades by version bump. | Breaks §3's framework-free package and its "no React peer" rule for three frameworks at once; needs `@sveltejs/package` (ships `.svelte` source under a `svelte` condition), a Vue SFC or render-function build, and Solid's preserved-JSX `solid` condition plus compiled DOM and server builds; `attw`/`publint` and the packed-consumer check grow three toolchains; React and Web would then be the odd ones out. |
  | Separate packages (`@kind-ui/agent-ui-vue`, …) | Clean peers per package. | Three more release pipelines, trusted publishers and changelogs, version skew against core, and the same build cost as entry points. |

  If a later wave wants npm entry points for every layer at once (React and Web included), that is its own plan; nothing here blocks it, since render files already import core only through `@kind-ui/agent-ui/core`.

- **D3. Framework floors are UI SDK's: Vue 3.5, Svelte 5.33 with runes, Solid 2. Decided (coordinator, pre-approved).** `@ui-sdk/solid` supports only Solid 2 (`solid-js` and `@solidjs/web` `>=2.0.0-rc.14 <3`), so Solid 1 apps are not supported, and the docs say so. Svelte files use runes only (no `export let`, no `$:`, no `on:` directives); Vue files use the Composition API only. The repository pins the toolchain versions in the Tech Stack line; registry items declare `@ui-sdk/<framework>` at the exact core pin and leave the framework itself to the consumer.

- **D4. One file shape per framework, copied byte for byte. Decided (coordinator, pre-approved).**
  - **Vue:** `packages/agent-ui/src/vue/<name>.ts`, one file per component like React's: `createParts` from `@ui-sdk/vue/primitive`, plus a `defineComponent({ setup(props, { slots, attrs }) { return () => h(…) } })` for each part that renders default children. Render functions, not SFCs: `@ui-sdk/vue` itself ships render-function components, our parts mostly forward slots and a `#render` slot, and a `.ts` file typechecks with `vue-tsc` and copies into any Vue setup without the consumer's SFC compiler settings mattering. Composition API inside `setup` keeps `vue-best-practices`' rules ("Render Functions" in its references). SFCs are used for fixtures and docs examples, where they're the idiomatic thing a reader copies.
  - **Svelte:** `packages/agent-ui/src/svelte/<name>/`, a folder per component, since Svelte has one component per file: `index.ts` (the `createParts` call from `@ui-sdk/svelte/primitive`, and exports) and one `<Part>.svelte` per part that renders default children, written with runes and snippets (`{#snippet render({ props })}`, `{@render children?.(state)}`).
  - **Solid:** `packages/agent-ui/src/solid/<name>.tsx`, one file per component: `createParts` from `@ui-sdk/solid/primitive`, JSX compiled by the consumer (`jsx: "preserve"`, `jsxImportSource: "@solidjs/web"`). A `tsconfig.solid.json` checks it, apart from the React `tsconfig.checks.json`, since one TypeScript project can't hold two JSX runtimes.
  - **Internal wrappers:** `src/<framework>/internal/<name>.*` pass UI SDK parts through a `kind-class.*` helper (the React `withKindClass` pattern: Kind classes before the caller's `class`, which may be a string or a state function).

- **D5. Same names and API, in each framework's idiom.** Part names match React exactly (`Step`, `StepTrigger`, `StepContent`, …), as do option names, defaults and state keys. Each `createParts` maps them the way the framework expects, and render files never rename: controlled options get Vue's `v-model:<key>` and `@<key>-change`, Svelte's `bind:<key>` and `on<Key>Change`, Solid's `<key>` and `on<Key>Change`; a part's state reaches its children through Vue's scoped default slot (`v-slot="{ state }"`), a Svelte `children` snippet (`{#snippet children(state)}`) or a Solid function child (`{(state) => …}`); composition goes through Vue's `#render` slot, Svelte's `render` snippet or Solid's `render` prop, never `as` or `asChild`. Classes go in `class`. Action options (`kind: "action"`) are functions returning a promise in all three, as in React. Where a framework can't express a React name (a Svelte snippet named `children` beside a `children` option), the track records the difference in "UI SDK API notes" and the docs' naming note, and nothing else changes.

- **D6. Parity is tested, not reviewed.** The core primitive is the contract; the React file is the structural reference (which parts exist, which default children each renders, which internal wrapper it composes). Two checks make that mechanical:
  - `scripts/tests/parity.test.mjs` (Task 1) reads each layer's exported names and fails when a ported component's parts differ from React's (`StepTrigger` in React must exist as `StepTrigger` in each layer that lists the component).
  - `tests/browser/parity.spec.ts` (Task 1) loads each ported case in React and in the layer under test, and compares a normalized tree of the root's subtree: element names (custom element wrappers dropped), `role`, every `aria-*` and `data-*` attribute but generated ids (compared by reference instead: an `aria-controls` must point at the element that matches), and text; at rest and after the case's `parity` interaction, which each shared case file in `tests/fixtures/shared/` may export (a key, a press). Tailwind class lists are compared too, sorted, so styling parity is checked for free.

- **D7. Registry: the same shadcn catalog, three more suffixes. Decided (coordinator, pre-approved).** Items are `<component>-vue`, `<component>-svelte` and `<component>-solid`, hidden `internal-<name>-vue` (…), `registry:ui`, with `registryDependencies` in the same `@kind-ui` namespace and `agent-ui-setup` as today. Targets are `@ui/vue/<file>`, `@ui/svelte/<name>/<file>` and `@ui/solid/<file>`, so each layer's relative imports keep working, as `@ui/web/` does. `dependencies` pin `@kind-ui/agent-ui`, `@ui-sdk/core` and `@ui-sdk/<framework>`. The shadcn item schema is framework-neutral (files with targets), so the pinned `shadcn` CLI installs them into a Vite Vue, Svelte or Solid app with a `components.json`; Task 1 proves it in `check:registry-consumers` before any track starts. If the CLI refuses a non-React consumer, the fallback is the same JSON through the Vue and Svelte ports of that CLI (`shadcn-vue add <url>`, `shadcn-svelte add <url>`, which read the same item schema) and, for Solid, the shadcn CLI with a hand-written `components.json`; Task 1 records which in "UI SDK API notes" and spec §9.2. The catalog reads which components a layer has from `registry/layers/<layer>.mjs` (D10), so an item exists only once its files do.

- **D8. Browser specs run unchanged against every layer.** Specs already drive the DOM and pick the layer from the Playwright project name (`tests/browser/layer.ts`). Projects become `wave-<n>-<layer>` for `react`, `web`, `vue`, `svelte` and `solid` (plus `wave-<n>-react-strict`; StrictMode stays React-only). A new layer's project runs only the specs its manifest lists (D10), whatever directory they're in (`tests/browser/parity.spec.ts` and `hydration.spec.ts` sit at the root), so a half-ported layer is green. Passing a file on the command line doesn't widen a project's `testMatch`, so `scripts/tests/layers.test.mjs` (Task 1) checks that every spec a manifest lists exists and that `playwright test --list --project=<project>` lists exactly those. `budgets.spec.ts` joins a manifest with the first task that measures a case, and skips each case whose component the manifest doesn't list. `wave-1/light-dom.spec.ts` stays Web-only. `layerOf` returns all five layers, and Task 1 rewrites its 70 call sites in 44 specs to say what they mean: `isWebElements(testInfo)` (custom element markup and attributes) or `layerOf(testInfo) === "react"` (React-only facts: render counts, StrictMode), so the default branch is never silently React's. Agent conformance (`expectSameAsPerson`, `expectAgentActions`), axe in light and dark, reduced motion, `checkPattern`/`checkDirection` and the leaving-row helpers run in every layer; `checkServer` runs on core primitives and needs nothing new.

- **D9. Fixtures: one Vite server per layer, a manifest decides what runs.** `packages/agent-ui/tests/fixtures/<layer>/` holds `index.html`, `main.ts`, `vite.config.mjs`, `styles.css` (importing `agent-ui.css` as the others do) and `cases/<name>.{vue,svelte,tsx}`, reusing `fixtures/shared/<name>.ts` for data. The fixture identity probe (`identity.mjs`) covers six servers (React, Web, React strict, Vue, Svelte, Solid at base + 0…5); `KIND_LAYERS=vue` (comma-separated) starts and probes only the servers and projects a run needs, so a Vue session never starts a Svelte server.

- **D10. Tracks never touch each other's files; shared files get per-task markers.** Each layer has a manifest, `registry/layers/<layer>.mjs`: `components`, `internals` and `specs`, the spec files the layer's projects run, each added by the task that makes it pass (specs group components, as `wave-1/indicators.spec.ts` and `controls.spec.ts` do, so they can't be derived from component names). The registry catalog, Playwright projects, `scripts/affected-specs.mjs`, the parity test and the docs tabs all read it. Task 1 creates the three manifests with one marker comment per track task (`framework-vue-2: chat core`, …), as Wave 6 did, and the same per-task markers in `AGENTS.md` "UI SDK API notes", `THIRD_PARTY_NOTICES.md` (glyphs, if any) and `.changeset/` (none: only Task 2 writes the changeset). A track task appends only under its own marker and only in its own layer's directories: `src/<layer>/`, `tests/fixtures/<layer>/`, `tests/browser/budgets/<layer>.ts`, `apps/docs/examples/*/*.<layer extension>`, `.agents/experts/<layer>/`. Two kinds of change cross tracks and never land inside a track PR: a core fix and a change to a shared fixture (`tests/fixtures/shared/`, a spec, `agent-conformance.ts`). The track that needs one opens a small PR of its own against the plan's base branch, the coordinator merges it, and every track merges that base in before it continues, so all three always test against one core. Task 1 adds a `parity` interaction to every shared case file up front, so tracks rarely need one.

- **D11. Server rendering is checked per layer.** UI SDK server-renders in each framework (`docs/server-rendering.md`). Task 1 adds a fixture `?ssr` mode: the fixture's Vite middleware renders the case through the layer's `server.ts` (`vue/server-renderer`'s `renderToString`, `svelte/server`'s `render`, `@solidjs/web`'s `renderToString`) and the page hydrates it. Today's shared fixture helpers touch `window` and `location` while their modules load, so Task 1 first makes them server-safe: each case becomes a factory that takes the request's `URLSearchParams`, and browser-only instrumentation (the agent host on `window`, budget counters) moves into the client entry. Each track's conformance task runs `tests/browser/hydration.spec.ts` over every case: no hydration mismatch warning, and the hydrated tree equals the client-rendered one under D6's normalization.

- **D12. Count budgets keep layer-agnostic counters.** `budgets.spec.ts` counts DOM writes, layout reads and Markdown parses in every layer. Component renders stay React's (`renders`); Vue counts component updates through `__VUE_DEVTOOLS_GLOBAL_HOOK__` (`component:updated`, development builds), as `renders`; Svelte and Solid have no component re-render, so their budgets are writes, layout reads and parses only. Each layer's numbers live in its own file, `tests/browser/budgets/<layer>.ts`, which `budgets.spec.ts` reads by project, so tracks never edit the same table. Each track measures its numbers on Linux CI (fixed row heights, viewport sizes and panel widths, nothing that depends on fonts) and adds them under its task's marker there. A layer's writes may not exceed React's by more than the parts it adds.

- **D13. Docs: framework tabs on every example, React stays the live preview. Decided (coordinator, pre-approved).** Every example gets Vue, Svelte and Solid code tabs beside React, from files beside the React one: `apps/docs/examples/<name>/basic.vue`, `basic.svelte` and `basic.solid.tsx`. The docs site is Next.js with webpack, so mounting three more frameworks inside it for previews would mean three more compilers in one build; the preview stays React, and D6's parity spec guarantees the other layers render the same tree. Task 1 replaces each page's `<include cwd lang="tsx">` with a server component, `<ExampleCode example="<name>/basic" />`, that reads whichever framework files exist at build time and renders them as one persisted tab group (`groupId: "framework"`), so tracks only add files and never edit a page. Installation tabs come from the manifests through `<Install name="<name>" />`. One API reference serves every layer, with a short per-framework naming note (D5) under it. Examples type-check: `vue-tsc` over `examples/**/*.vue`, `svelte-check` over `examples/**/*.svelte`, `tsc -p tsconfig.solid.json` over `examples/**/*.solid.tsx`; the Next build ignores all three. `scripts/tests/docs.test.mjs` lets examples import `vue`, `svelte`, `solid-js` and `@solidjs/web` beside today's list, and pages still link by relative path.

- **D14. Agents in the new layers.** Hosts create the bridge with `createAgent` from `@ui-sdk/vue/agent`, `@ui-sdk/svelte/agent` or `@ui-sdk/solid/agent`, as they do from React and Web today; Kind ships none. A layer's snapshot of the agent page must list every component once, by the same name and actions as React's; `data-agent-confirm` marks the same components.

- **D15. One skill per framework.**
  - Vue: `vue-best-practices` from vuejs-ai/skills (MIT), the upstream that JetBrains/skills syncs from (its `SYNC.md` names it). The upstream copy is newer than JetBrains' March sync, by the same authors under the same license.
  - Svelte: `svelte-core-bestpractices` from sveltejs/ai-tools (MIT), the Svelte team's own.
  - Solid: `solid-best-practices`, written here from Solid's 2.0 migration guide (solidjs/solid, MIT). agents-inc/skills' `web-framework-solidjs` is MIT and could be redistributed, but it teaches Solid 1 (`createResource`, `Suspense`, `splitProps`, `onMount`, `solid-js/web`), which `@ui-sdk/solid` doesn't support; vendoring it would teach the wrong API.

  The first two are installed with `npx skills add … --copy` (`skills-lock.json`), the third is ours; all three are routed from `AGENTS.md` and `.agents/skills/README.md`, with attribution only in `THIRD_PARTY_NOTICES.md`.

- **D16. No showcase; 0.7.0 is a minor. Decided (coordinator, pre-approved).** The layers add no component a showcase would show, and the showcases' scripted runs stay React. Task 2's changeset is `minor` for 0.7.0: the npm package gains no export, but registry items pin the package version, so the release that ships the new items is one version.

## Global Constraints

- **Build on UI SDK (spec §2):** every render file calls `createParts` from `@ui-sdk/<framework>/primitive` or wraps a `@ui-sdk/<framework>/<name>` part, and imports core only through `@kind-ui/agent-ui/core`. Render files add no listeners, focus calls, `tabindex`, scroll calls or ARIA attributes; `scripts/check-ui-sdk-usage.mjs` (Task 1) scans `src/vue/**/*.ts`, `src/svelte/**/*.{ts,svelte}` and `src/solid/**/*.tsx` for each framework's spelling of them (`@keydown`/`onKeydown` in render functions, `onkeydown=`/`{@attach}` that focuses in Svelte, `onKeyDown`/`ref` focus in Solid, `tabindex`, `.focus(`, `scrollTo`, `role=`, `aria-` writes). Core changes only for bugs; a change to a core file runs React's and Web's specs for that component too.
- **Parity (D5, D6):** same part names, options, defaults, state keys, slots, `data-*` attributes, classes, default children, events, agent actions and `data-agent-confirm`. A React-only workaround in "UI SDK API notes" (`memo`'d rows, `keepMounted` menu content, the microtask before `enterRow`) is checked for each layer and either matched or noted as unneeded, with the reason.
- **Framework rules:** each track follows its skill. Vue: no Options API, no `reactive` wrapping of core state (UI SDK owns it), props never mutated, `shallowRef` for host data passed through. Svelte: runes only, snippets not slots, callback props not `createEventDispatcher`, `$state.raw` for host arrays. Solid: never destructure props, read reactive values only in JSX, memos, effects and handlers, `omit`/`merge` not `splitProps`/`mergeProps`.
- **Accessibility, motion and tokens** are core's and the stylesheets', so they match by construction; the track proves it with axe in light and dark, the reduced-motion spec cases, and the status-mark and forced-colors specs on its project.
- **Tests stay lean and never slow implementation:** build first, then test. A batch task runs the existing specs of its components on its layer, plus the parity spec; it writes no new spec unless its layer needs a layer-specific fact checked. Fixtures and explicitly resolved deferred promises only; fixed ISO dates with `now` passed in; `timeZone: "UTC"`.
- **Ports:** every Playwright run in a session sets `KIND_FIXTURE_PORT_BASE` and `KIND_LAYERS`. Task 1 uses `5100` with every layer. Track task *n* uses `5200 + 10n` (Vue), `5300 + 10n` (Svelte) or `5400 + 10n` (Solid), with `KIND_LAYERS=react,<layer>` (React is the parity reference). Task 2 uses `5500` with every layer. Up to twelve sessions run at once on one machine. Task 1 also moves `check:registry-consumers` off its fixed port 4320 onto an ephemeral one (URLs derived from the bound address), and `check:docs` already takes any free port, so a whole `npm run check` is safe in parallel sessions.
- **Session routine:** read the skill chain first; port the shared pieces a batch needs (wrappers are already there from the track's groundwork), then hand components to parallel subagents, one per component, with the React file, its Web file, the core primitive and this plan's D4–D6 as context. The owner writes the manifest, the marker sections and the docs examples' list once. `npm run check` runs alone, through one subagent, never beside another Playwright run in the same session.
- **Size:** render layers don't ship in the npm package, so `size-budget.json` doesn't change unless a core fix moves `./core`.
- **Docs:** examples by relative path, links with `./x.mdx`; `scripts/tests/docs.test.mjs` enforces both.
- **Publication:** nothing publishes, versions or deploys.
- **Commits** carry `Co-authored-by: Copilot App <223556219+Copilot@users.noreply.github.com>`.
- **References:** name only what the code builds on. Third-party attribution goes only in `THIRD_PARTY_NOTICES.md`. No sparkle, anywhere (`scripts/tests/no-sparkle.test.mjs`).

## Review Focus

1. **Parity, mechanically:** the parity test lists the same parts per component in all five layers, and the parity spec finds no difference between React and each layer at rest and after each case's interaction. Every track.
2. **Server markup:** every case server-renders and hydrates without a mismatch in each layer, including dates (D13 of Wave 6), Context Bar's measured chips and File Tree's rows. Vue-8, Svelte-8, Solid-8.
3. **Streaming cost:** a streamed token into a 500-row Conversation, a Markdown append and a Terminal line stay within D12's counters in each layer, and Svelte and Solid write no more DOM than Web does. Each track's chat core and developer output tasks.
4. **Composed UI SDK components:** Composer's Token Input and Trigger Menu, Picker's Command, the menus' Menu, Sidebar's Resizable and Drawer, File Tree's Tree and Inline Citation's Carousel receive their props and controllers from `api.partState` and hear their events in each framework exactly as React's do, with no listener in a render file. Every track's batches 2, 3, 6 and 7.
5. **Registry consumers:** `shadcn add @kind-ui/<item>-<layer>` installs byte-identical files into a clean Vite app per framework, which builds and renders every visible item. Task 1 (the shape), each track's conformance task (every item).
6. **Framework idiom:** a Vue reader sees `v-model:open` and `#render`, a Svelte reader `bind:open` and snippets, a Solid reader `render={(props) => …}`, in the docs tabs and the copied files, with nothing written as a React port.

---

## File Map

```text
.agents/skills/{vue-best-practices,svelte-core-bestpractices,solid-best-practices}/   (this PR)
.agents/experts/{vue,svelte,solid}/{expert,decisions}.md    .claude/agents/{vue,svelte,solid}-expert.md   (track groundwork)
registry/layers/{vue,svelte,solid}.mjs                       (Task 1: manifests with per-task markers)
registry/catalog.mjs  scripts/build-registry.mjs  scripts/check-registry-consumers.mjs  registry/consumers/{vue,svelte,solid}/…
scripts/check-ui-sdk-usage.mjs  scripts/expert-scope.mjs  scripts/affected-specs.mjs  scripts/tests/{parity,registry,docs,ui-sdk-usage}.test.mjs
playwright.config.mjs  tests/browser/{layer,parity.spec,hydration.spec,hydration}.ts  tests/browser/wave-*/…  (layer branches, Task 1)
packages/agent-ui/tests/fixtures/{vue,svelte,solid}/{index.html,main.ts,server.ts,vite.config.mjs,styles.css,cases/…}
packages/agent-ui/src/vue/<name>.ts            packages/agent-ui/src/vue/internal/<name>.ts      packages/agent-ui/src/vue/internal/kind-class.ts
packages/agent-ui/src/svelte/<name>/{index.ts,<Part>.svelte}   packages/agent-ui/src/svelte/internal/<name>/…   packages/agent-ui/src/svelte/internal/kind-class.ts
packages/agent-ui/src/solid/<name>.tsx         packages/agent-ui/src/solid/internal/<name>.tsx  packages/agent-ui/src/solid/internal/kind-class.ts
tsconfig.checks.json  tsconfig.vue.json  tsconfig.svelte.json  tsconfig.solid.json  package.json (typecheck, devDependencies)
apps/docs/components/{example-code,install}.tsx  apps/docs/content/docs/components/*.mdx (Task 1 only)  apps/docs/examples/<name>/basic.{vue,svelte,solid.tsx}
AGENTS.md  docs/superpowers/specs/2026-11-14-agent-ui-design.md  .changeset/agent-ui-framework-layers.md (Task 2)
```

## Component batches

The design batches, with Step pulled into each track's groundwork as its reference component, so that groundwork exercises a panel, a roving list and a status mark end to end. Every batch's internal wrappers are already ported by its track's groundwork, so batches depend on each other only through components they render.

| Batch | Components | Renders components from |
| --- | --- | --- |
| 1. Groundwork reference | Step (`Step`, `StepList`, …) and all 24 internal wrappers | nothing |
| 2. Chat core | Conversation, Message, Markdown, Code Block, Markdown Table, Streaming Text, Composer, Attachments, Suggestion, Feedback, Confirmation, Question, Checkpoint (13) | nothing outside the batch |
| 3. Composer controls | Picker, Model Selector, Add Menu, Settings Menu, Approval Mode, Model Control, Reasoning Effort, Context Bar, Context Meter, Dictation (10) | nothing outside the batch |
| 4. Indicators, notices and files | Loader, Thinking Indicator, Typing Indicator, Status, Notice, Guardrail Notice, Uploader (7) | nothing outside the batch |
| 5. Step family | Reasoning, Tool, Chain of Thought, Task, Plan, Subagent, Queue (7) | Markdown, Code Block, Confirmation (batch 2) |
| 6. Developer output | Sources, Inline Citation, Document, Generated Image, File Tree, Terminal, Stack Trace, Test Results, Transcript, Selection, Action (11) | Markdown, Code Block (batch 2) |
| 7. Wave 6 shell | Thread List, Thread Search, Sidebar, Day Separator, Connection Status, Share Dialog, Conversation Search (7) | Picker (batch 3); Conversation, Markdown and Composer in its fixtures (batch 2) |

1 + 13 + 10 + 7 + 7 + 11 + 7 = 56 components.

## Parallel batches

| Batch | Tasks | Starts after | Files they share |
| --- | --- | --- | --- |
| 0 | 1 (shared groundwork) | this plan | none: it lands alone |
| A | Vue-1, Svelte-1, Solid-1 (track groundwork) | Task 1 merged | only their own marker in `AGENTS.md`; everything else is per layer |
| B | Vue-2, -3, -4; Svelte-2, -3, -4; Solid-2, -3, -4 | their track's groundwork merged | within a track: the layer's manifest, under per-task markers |
| C | Vue-5, -6; Svelte-5, -6; Solid-5, -6 | their track's task 2 merged | as B |
| C′ | Vue-7, Svelte-7, Solid-7 | their track's tasks 2 and 3 merged | as B |
| D | Vue-8, Svelte-8, Solid-8 (track conformance) | every task of the track merged | the layer's agent fixture page |
| E | 2 (docs index, cross-framework summary, 0.7.0 changeset) | Vue-8, Svelte-8 and Solid-8 merged | docs index, README, changeset |

Each track is a stacked wave: its tasks open PRs on the track's groundwork branch and land there in batch order, and the track lands on `main` once its conformance task passes. Up to nine batch sessions run at once (three per track). If fewer can run, start each track's task 2 (chat core) first, since batches 5 and 6 wait on it, then task 3; task 7 waits on both.

## Component task routine

Tasks *Track*-2 to *Track*-7 each finish with these steps after their components' specs pass on their layer. A task lists only what differs.

- [ ] **Manifest:** add the batch's components and the spec files the task names under the task's marker in `registry/layers/<layer>.mjs`. Run `node --test scripts/tests/registry.test.mjs scripts/tests/parity.test.mjs`. Expected: PASS.
- [ ] **Docs examples:** add `apps/docs/examples/<name>/basic.<ext>` for each component, the same example as `basic.tsx` in the framework's idiom (D5), with every page's other examples too (`apps/docs/examples/<name>/*.tsx`). An example that renders another batch's component (Composer's full composer renders the composer controls) lands with whichever of the two tasks merges second, which says so in its PR. Run `node --test scripts/tests/docs.test.mjs`, the layer's example typecheck and `npm run build:docs`. Expected: PASS.
- [ ] **Screenshots:** light and dark screenshots of the layer's fixture for each component beside React's, nothing focused, at 1280 px and 390 px, into `artifacts/screenshots/<layer>/<name>-{light,dark,narrow}.png`; attach a contact sheet to the PR with the `github-pr-media` skill. Differences the parity spec didn't catch are bugs.
- [ ] **Finish:** run `unslop` on the diff, then `expert-review` (the layer's expert and `core` if core changed), and fix its findings. Run `npm run check` once, alone, through a subagent, with this task's `KIND_FIXTURE_PORT_BASE` and `KIND_LAYERS`. Expected: PASS. Add any UI SDK difference to `AGENTS.md` "UI SDK API notes" under the task's marker, one bullet named after the batch.
- [ ] **Commit and PR:** commit `feat(<layer>): <batch>`, push, and open the PR on the track's branch. The PR reports what was checked by hand in a real browser (keyboard, focus, the sheet or drawer at 390 px with touch, reduced motion through the media query and the `motion` option, light and dark) and what wasn't.

---

### Task 1: Shared groundwork

Spec §2, §9.2, §9.5, §10; D2, D4–D13, D15.

**Files:**
- Modify: `package.json` (devDependencies from the Tech Stack line; `typecheck` gains `vue-tsc -p tsconfig.vue.json`, `svelte-check --tsconfig tsconfig.svelte.json` and `tsc -p tsconfig.solid.json`) and `scripts/run-checks.mjs`, whose hard-coded `typecheck` stages `check` and `check:fast` run, so the three new checks are required; `packages/agent-ui/package.json` (devDependencies `@ui-sdk/vue`, `@ui-sdk/svelte`, `@ui-sdk/solid`, which `scripts/tests/manifest.test.mjs` checks against the core pin as it does React's and Web's); `tsconfig.checks.json` (excludes `src/{vue,svelte,solid}/`, `tests/fixtures/{vue,svelte,solid}/` and `apps/docs/examples/**/*.{vue,svelte,solid.tsx}`, each of which only its framework's project includes, with its own `@/components/ui/<layer>/*` path alias); `biome.json` (Svelte and Vue files: format only what Biome supports, leave `.svelte` to `svelte-check`)
- Create: `tsconfig.{vue,svelte,solid}.json`, `registry/layers/{vue,svelte,solid}.mjs` (empty lists, one marker per track task), `packages/agent-ui/src/{vue,svelte,solid}/.gitkeep`
- Modify: `registry/catalog.mjs` and `scripts/build-registry.mjs` (layers from the manifests: suffix, file list per component, target prefix), `scripts/check-registry-consumers.mjs` (a Vite consumer per framework, run only for layers with items), `registry/consumers/{vue,svelte,solid}/…`
- Modify: `scripts/check-registry-consumers.mjs` (an ephemeral port instead of 4320); `packages/agent-ui/tests/fixtures/shared/*.ts` and both existing `main` entries (case factories with no module-load `window` or `location` reads, a `parity` interaction per case, D6 and D11)
- Modify: `scripts/check-ui-sdk-usage.mjs` and `scripts/tests/ui-sdk-usage.test.mjs` (D4 file shapes and each framework's forbidden spellings), `scripts/expert-scope.mjs` (vue, svelte and solid experts, matched by `src/<layer>/` and `tests/fixtures/<layer>/`), `scripts/affected-specs.mjs` (follows imports from `.vue`, `.svelte` and `.solid.tsx` files and the manifests)
- Modify: `playwright.config.mjs` (six servers, `KIND_LAYERS`, `wave-<n>-<layer>` projects whose `testMatch` comes from the manifest), `packages/agent-ui/tests/fixtures/identity.mjs`, `tests/browser/layer.ts` (`layerOf` returns five layers; `isWebElements`), every spec that calls `layerOf` (D8)
- Create: `packages/agent-ui/tests/fixtures/{vue,svelte,solid}/{index.html,main.ts,server.ts,vite.config.mjs,styles.css}` (a case loader that shows "No case" for a case the layer lacks), the `?ssr` middleware shared by the three configs (`packages/agent-ui/tests/fixtures/ssr.mjs`), `tests/browser/hydration.ts`, `tests/browser/hydration.spec.ts`, `tests/browser/parity.spec.ts`, `scripts/tests/{parity,layers}.test.mjs`
- Modify: `tests/browser/wave-1/budgets.spec.ts` (the Vue update counter; budgets read per layer from `tests/browser/budgets/<layer>.ts`, React's and Web's moved there unchanged, D12); create `tests/browser/budgets/{vue,svelte,solid}.ts` with one marker per track task
- Modify: `apps/docs/components/example.tsx`, create `apps/docs/components/{example-code,install,framework-names}.tsx`; every page in `apps/docs/content/docs/` that includes an example, showcase pages too (`<include cwd lang="tsx">` → `<ExampleCode example="…" />`, the bash tabs → `<Install name="…" />`, and `<FrameworkNames />` under each API reference, which prints the component's controlled options and callbacks in each framework's spelling from its `<Name>Options` type, D5); `apps/docs/tsconfig.json` and `next.config.mjs` (ignore `.vue`, `.svelte`, `.solid.tsx`); `scripts/tests/docs.test.mjs`
- Modify: `AGENTS.md` (markers under "UI SDK API notes": `framework-vue-1:` … `framework-solid-8:`; the root scripts table; `test:browser` projects), `.github/workflows/ci.yml` only if a new toolchain needs a cache key

**Interfaces:**
- `registry/layers/<layer>.mjs`: `export default { components: string[], internals: string[], specs: string[] }`, each list with per-task markers (D10).
- `layerOf(testInfo): "react" | "web" | "vue" | "svelte" | "solid"`; `isWebElements(testInfo): boolean`.
- Fixture `server.ts`: `renderCase(name: string, search: URLSearchParams): Promise<{ head: string; html: string }>`; `main.ts` hydrates when the page has `data-ssr`.
- `<ExampleCode example="step/basic" />`: reads `examples/step/basic.tsx`, `.vue`, `.svelte` and `.solid.tsx` that exist, renders them as tabs (React, Vue, Svelte, Solid) in one persisted group; `<Install name="step" />`: one tab per layer whose manifest lists the component.

- [ ] **Step 1: Write the failing tests.** `parity.test.mjs` over a throwaway `src/vue/step.ts` that misses `StepMeta` (then delete the file); `ui-sdk-usage.test.mjs` cases for a Vue render function with `onKeydown`, a `.svelte` file with `onkeydown=`, a Solid file with `tabIndex`; `docs.test.mjs` asserting every component page uses `<ExampleCode>` and `<Install>`; `registry.test.mjs` asserting a manifest's component yields `-vue` items with `@ui/vue/` targets.
- [ ] **Step 2: Run** `npm run test:scripts`. Expected: the new tests FAIL.
- [ ] **Step 3: Implement** the files above. Keep every existing project's name and behavior: `KIND_LAYERS` unset means every layer, and with no components in the new manifests their projects run nothing.
- [ ] **Step 4: Prove the registry path (D7).** With a throwaway `step` item for each layer built from a minimal render file, run `check:registry-consumers` for the three new consumers. Record which CLI installed each in "UI SDK API notes" (`framework-groundwork` bullet) and spec §9.2, then remove the throwaway files.
- [ ] **Step 5: Run** `npm run check` alone, through a subagent, with `KIND_FIXTURE_PORT_BASE=5100`. Expected: PASS, with React and Web results unchanged.
- [ ] **Step 6:** Run `unslop` and `expert-review`. Commit `build: framework layers groundwork`, push, open the PR on this plan's branch.

---

### Track tasks

The three tracks are the same eight tasks over different files. Each task below is written once with `<layer>` (`vue`, `svelte` or `solid`), `<Layer>` (Vue, Svelte, Solid) and `<ext>` (`ts`, `svelte` folder, `tsx`); a session runs one track's task, for example "Task Svelte-3".

### Task <Layer>-1: <Layer> groundwork, internal wrappers and Step

Spec §2; D3–D6, D11, D14. Port range `5210` / `5310` / `5410`.

**UI SDK:** `node_modules/@ui-sdk/<layer>/docs/llms.txt`, `rendering.md`, `custom-parts.md`, `parts-and-composition.md`, `state-and-events.md`, `styling-and-animation.md`, `server-rendering.md`, `agents.md`, and the component page of each of the 24 internal wrappers' UI SDK components.

**Files:**
- Create: `packages/agent-ui/src/<layer>/internal/kind-class.*` and the 24 wrappers (`alert-dialog`, `avatar`, `button`, `carousel`, `checkbox`, `collapsible`, `command`, `drawer`, `file-input`, `menu`, `progress`, `radio`, `resizable`, `scroll-area`, `segmented-control`, `slider`, `switch`, `textarea`, `toggle`, `token-input`, `toolbar`, `tooltip`, `tree`, `trigger-menu`), each the React wrapper's classes and parts; `src/<layer>/step.*`
- Create: `packages/agent-ui/tests/fixtures/<layer>/cases/{step,internal}.*` (every variant `internal.spec.ts` loads), `.agents/experts/<layer>/{expert,decisions}.md`, `.claude/agents/<layer>-expert.md`
- Modify: `registry/layers/<layer>.mjs` (`step`, every internal, and `wave-1/step.spec.ts` and `wave-1/internal.spec.ts`, under the task's marker); `AGENTS.md` (the task's marker)

**Interfaces:**
- Wrappers export the same names as React's (`KindMenu`, `KindMenuItem`, …), so batch tasks port component files line for line.
- `kind-class.*` matches React's `withKindClass` exactly, not just class concatenation: a wrapper whose `render` is another Kind wrapper renders that target's bare UI SDK part, so the element gets the outer wrapper's base classes once. `internal.spec.ts`'s composition test, React-only today, runs on the layer.
- The expert follows `.agents/experts/react/expert.md`'s shape: what it knows (D4, D5, the framework skill's rules), a review checklist (idiom, parity with React, server render, the guard's rules), `decisions.md` with "Settled" and "Known and open".

- [ ] **Step 1: Write the failing test.** Add `step` and the internals to the manifest; run `npx playwright test --project="wave-1-<layer>" tests/browser/wave-1/step.spec.ts tests/browser/wave-1/internal.spec.ts tests/browser/parity.spec.ts` and `node --test scripts/tests/parity.test.mjs`. Expected: FAIL.
- [ ] **Step 2: Implement** the wrappers, Step and the case. The wrappers are checked through Step and through `?c=internal` pages the parity spec compares with React's; each wrapper's own spec arrives with the first component that composes it.
- [ ] **Step 3: Run** the same, plus `npm run lint && npm run typecheck` and `hydration.spec.ts` for Step. Expected: PASS.
- [ ] **Step 4: Component task routine** (Step's docs example only). Commit `feat(<layer>): groundwork, internal wrappers and Step`, open the PR on the plan's branch; it becomes the track's base.

### Task <Layer>-2: Chat core

D5, D6, D12. Port `5220` / `5320` / `5420`. Components: Conversation, Message, Markdown, Code Block, Markdown Table, Streaming Text, Composer, Attachments, Suggestion, Feedback, Confirmation, Question, Checkpoint.

**Read first:** "UI SDK API notes" bullets for Tasks 9–13 of Wave 1, Wave 3 Tasks 3, 4, 5, 7 and 9, Wave 5 Tasks 7, 13, 14 and 17, Wave 6 Tasks 9–11, and each component's React and Web files. The React-only notes to check here: memoized Conversation rows and Markdown blocks keyed by index (a streamed token must update one row), `enterRow`'s microtask, the Composer's Token Input controller and `api.partState` identity, `keepMounted` regenerate menu content, Dictation inside the Composer.

- [ ] **Step 1: Write the failing test.** Add the batch to the manifest; run the batch's specs (`tests/browser/wave-1/{conversation,message,markdown,composer}.spec.ts`, which also cover Code Block, Markdown Table, Streaming Text, Attachments and Message's and Conversation's Wave 6 parts, and `wave-3/{suggestion,feedback,confirmation,question,checkpoint}.spec.ts`) and `parity.spec.ts` on the layer's projects. Expected: FAIL.
- [ ] **Step 2: Implement.** Port Markdown, Code Block and Markdown Table first (other batches wait on them), then Conversation and Message, then the rest in parallel subagents.
- [ ] **Step 3: Run** the same, plus the budgets spec's Conversation, Markdown and Message cases on the layer (D12: measure, then add the layer's numbers to `tests/browser/budgets/<layer>.ts` under the task's marker). Expected: PASS.
- [ ] **Step 4: Component task routine.** Commit `feat(<layer>): chat core`.

### Task <Layer>-3: Composer controls

Port `5230` / `5330` / `5430`. Components: Picker, Model Selector, Add Menu, Settings Menu, Approval Mode, Model Control, Reasoning Effort, Context Bar, Context Meter, Dictation.

**Read first:** "UI SDK API notes" for Wave 3 Tasks 6 and 8, Wave 4 Task 12b, Wave 5 Tasks 1–6, 9–11 (`menuBase`, `pickerBase`, `settingsBase`, Picker's sheet viewport, Context Bar's measuring, Dictation's live levels). The React `pickerParts(parts)` helper becomes the layer's own helper over its `createParts`, in the layer's `picker.*`, as React's `picker.tsx` does.

- [ ] **Step 1:** Add the batch to the manifest; run `tests/browser/wave-3/{reasoning-effort,context-meter,model-selector}.spec.ts`, `wave-5/{picker,add-menu,settings-menu,approval-mode,model-control,context-bar,dictation,composed-events}.spec.ts` (`composer-compact.spec.ts` needs Task <Layer>-2's Composer too, so it joins in Task <Layer>-8) and `parity.spec.ts` on the layer. Expected: FAIL.
- [ ] **Step 2: Implement**, Picker and Settings Menu first (Model Selector, Thread Search and Model Control spread them).
- [ ] **Step 3: Run** the same, plus the budgets spec's Context Bar case on the layer. Expected: PASS, with menus presenting as sheets at 390 px with touch.
- [ ] **Step 4: Component task routine.** Commit `feat(<layer>): composer controls`.

### Task <Layer>-4: Indicators, notices and files

Port `5240` / `5340` / `5440`. Components: Loader, Thinking Indicator, Typing Indicator, Status, Notice, Guardrail Notice, Uploader.

**Read first:** "UI SDK API notes" for Wave 1 Task 12, Wave 2 Task 9, Wave 3 Task 10.

- [ ] **Step 1:** Add the batch to the manifest; run `tests/browser/wave-1/{indicators,uploader}.spec.ts`, `wave-2/status.spec.ts`, `wave-3/{notice,guardrail-notice}.spec.ts` and `parity.spec.ts` on the layer. Expected: FAIL.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Run** the same. Expected: PASS, with the dot-flow loop and leaving rows (`tests/browser/leaving.ts`) behaving as in React under each `motion` value.
- [ ] **Step 4: Component task routine.** Commit `feat(<layer>): indicators, notices and files`.

### Task <Layer>-5: Step family

Port `5250` / `5350` / `5450`. Components: Reasoning, Tool, Chain of Thought, Task, Plan, Subagent, Queue. Needs Task <Layer>-2 (Markdown, Code Block, Confirmation).

**Read first:** "UI SDK API notes" for Wave 2 Tasks 1–9 (`stepBase`, `itemList`, Queue's reorder and leaving rows, Subagent's nested children).

- [ ] **Step 1:** Add the batch to the manifest; run `tests/browser/wave-2/{reasoning,tool,chain-of-thought,task,plan,subagent,queue}.spec.ts` and `parity.spec.ts` on the layer. Expected: FAIL.
- [ ] **Step 2: Implement.**
- [ ] **Step 3: Run** the same, plus the budgets spec's Tool case on the layer. Expected: PASS.
- [ ] **Step 4: Component task routine.** Commit `feat(<layer>): step family`.

### Task <Layer>-6: Developer output

Port `5260` / `5360` / `5460`. Components: Sources, Inline Citation, Document, Generated Image, File Tree, Terminal, Stack Trace, Test Results, Transcript, Selection, Action. Needs Task <Layer>-2.

**Read first:** "UI SDK API notes" for Wave 4 Tasks 1–11 (virtualized Terminal and Transcript rows, the Tree's controller and redraws, Inline Citation's Carousel rendered as `span`s inside a paragraph, Selection's toolbar layer).

- [ ] **Step 1:** Add the batch to the manifest; run `tests/browser/wave-4/*.spec.ts` but `agent.spec.ts`, and `parity.spec.ts`, on the layer. Expected: FAIL.
- [ ] **Step 2: Implement.** Terminal's and Transcript's lines must update one row per chunk (Solid `For` over stable row objects, Svelte keyed `{#each}`, Vue keyed rows with no parent re-render).
- [ ] **Step 3: Run** the same, plus the budgets spec's Terminal and Transcript cases on the layer. Expected: PASS.
- [ ] **Step 4: Component task routine.** Commit `feat(<layer>): developer output`.

### Task <Layer>-7: Wave 6 shell

Port `5270` / `5370` / `5470`. Components: Thread List, Thread Search, Sidebar, Day Separator, Connection Status, Share Dialog, Conversation Search. Needs Tasks <Layer>-2 (Conversation, Markdown and Composer in its fixtures) and <Layer>-3 (Picker).

**Read first:** "UI SDK API notes" for Wave 6 Tasks 2–11 (Thread List's grid over a virtualizer and one row menu, Sidebar's Resizable and Drawer without remounting the inset, Conversation Search's highlights).

- [ ] **Step 1:** Add the batch to the manifest; run `tests/browser/wave-6/*.spec.ts` but `agent.spec.ts` and `aria-patterns.spec.ts`, and `parity.spec.ts`, on the layer. Expected: FAIL.
- [ ] **Step 2: Implement.** Sidebar keeps the inset's page mounted across the breakpoint, as React's does.
- [ ] **Step 3: Run** the same, plus the budgets spec's Thread List and Conversation Search cases on the layer. Expected: PASS.
- [ ] **Step 4: Component task routine.** Commit `feat(<layer>): Wave 6 shell`.

### Task <Layer>-8: <Layer> conformance

Spec §6 "Agent actions", §10; D8, D11, D14. Port `5280` / `5380` / `5480`.

**Files:**
- Create: `packages/agent-ui/tests/fixtures/<layer>/cases/agent.*` (the `case=all` and `case=wave-2` … `case=wave-6` pages, mirroring React's), any case the earlier tasks left out
- Modify: `registry/layers/<layer>.mjs` (`specs`: every wave's `agent.spec.ts`, both `aria-patterns.spec.ts`, `wave-5/composer-compact.spec.ts`, and `wave-1/{controls,motion,theme,status-mark,forced-colors}.spec.ts`, which reach components from every batch, and `hydration.spec.ts`), `.agents/experts/<layer>/decisions.md`, `AGENTS.md` (the task's marker)

- [ ] **Step 1: Write the tests** by adding the specs to the manifest:
  - Every wave's agent spec on the layer: each component once by the same name and actions as React's, `data-agent-confirm` on the same components, every action's agent path equal to the person path (`expectSameAsPerson`).
  - Both aria-patterns specs (`checkPattern`, `checkDirection` under `dir="rtl"`), with any accepted problem in `known` beside a `decisions.md` entry.
  - `wave-1/{controls,motion,theme,status-mark,forced-colors}.spec.ts` on the layer: shared controls, the motion helper's presets, both themes, every status mark consumer and forced colors.
  - `wave-5/composer-compact.spec.ts`: the Composer with its controls, Context Bar and Dictation.
  - `wave-1/budgets.spec.ts` with every case each batch measured (D12).
  - The hydration spec over every case (D11).
  - The parity spec over every case.
  - `check:registry-consumers` installs every visible `-<layer>` item into the layer's consumer, which builds and renders them.
- [ ] **Step 2: Run** them. Expected: PASS; fix the owning render file (or core, with React and Web tested again) for any failure.
- [ ] **Step 3:** Move the expert's settled items to "Settled", run `unslop` and `expert-review`, then `npm run check` alone with this task's port base and `KIND_LAYERS=react,web,<layer>`. Commit `test(<layer>): conformance`, open the PR on the track's branch; once it merges, open the track's PR to `main`.

---

### Task 2: Docs index, cross-framework summary and the 0.7.0 changeset

Spec §9.1, §9.5; D13, D14, D16. Port `5500`, every layer.

**Files:**
- Create: `.changeset/agent-ui-framework-layers.md`
- Modify: `apps/docs/content/docs/index.mdx` and the installation page (framework choice, `components.json` for non-React apps per D7's finding), the agent page (`createAgent` from each layer's `agent` entry), `packages/agent-ui/README.md`, `registry/agent-ui-setup/AGENTS.md` (each layer's `llms.txt` and skill), `scripts/tests/docs.test.mjs`, `AGENTS.md` (remove the `framework-*` markers; the conformance summary)

**Interfaces:**
- `.changeset/agent-ui-framework-layers.md`: `"@kind-ui/agent-ui": minor`, naming the three layers, their registry suffixes, the framework floors (D3) and that the npm package's exports are unchanged.
- `AGENTS.md` gains a "Framework layers" bullet in "UI SDK API notes": the cross-framework summary, a table of each layer's specs run, budgets met and known differences, from the three conformance tasks.

- [ ] **Step 1: Write the failing test.** `docs.test.mjs`: every component page shows four framework tabs and four install tabs; the docs index names the five layers.
- [ ] **Step 2: Run** `node --test scripts/tests/docs.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement**, in the site's voice (`write-docs`).
- [ ] **Step 4: Run** `npm run build:docs`, then `npm run check` alone, through a subagent. Expected: PASS: every layer's projects, the parity and hydration specs, and `check:registry-consumers` for five consumers.
- [ ] **Step 5:** Run `unslop` and `expert-review`. Commit `docs: index the framework layers and add the 0.7.0 changeset`, push, open the PR. Don't publish, version or deploy.

---

## How this plan builds on UI SDK

| Requirement | Where |
| --- | --- |
| One `definePrimitive` per component, already in core | Unchanged; every layer renders the same primitive |
| Every render file calls `createParts` from `@ui-sdk/<framework>/primitive` or wraps a `@ui-sdk/<framework>/<name>` part | D4, the guard (Task 1) |
| Controlled values, events, state to children and `render` composition are each framework's `createParts` conventions | D5 |
| Composed UI SDK components (Command, Menu, Tree, Resizable, Drawer, Carousel, Token Input, …) come from `@ui-sdk/<framework>` | The internal wrappers (Task <Layer>-1) |
| Server rendering follows UI SDK's `server-rendering.md` per framework | D11 |
| Agents use `createAgent` from `@ui-sdk/<framework>/agent`; `@ui-sdk/core/testing` checks patterns | D14, Task <Layer>-8 |
| Hand-written code only for spec §2 rows, all of which live in core | No new row |

## Self-Review Notes

- **Scope coverage (D1):** 56 components in batches 1–7 (the table sums to 56) and 24 internal wrappers in each track's task 1, for three layers.
- **The user's asks:** skills (D15, this PR); packaging with the tradeoff (D2); registry (D7); parity of parts, state, events, agent actions, accessibility, motion and tokens (D5, D6, D14, Global Constraints); Playwright projects, conformance, axe in light and dark, pattern checks, Linux CI budgets and private ports (D8, D9, D12, Ports); docs tabs with relative links (D13); groundwork, batches as the design batches, conformance and a 0.7.0 changeset (tasks); spec, AGENTS.md and expert decisions (this PR); one track per framework with its own ports, per-track markers and no shared files (D10, Parallel batches).
- **Decided by the coordinator (pre-approved):** D2, D3, D4, D7, D13, D16.
- **Review (rubber duck, before the PR):** fixed the batch dependency graph (task 7 needs 2 and 3; cross-batch specs and examples land with the later task), the runner's hard-coded typecheck stages, the React project's reach into Solid files, the registry consumer's fixed port, manifest-driven project matching and its discovery check, server-safe shared fixtures, core and shared-fixture changes going through one base PR, the internal wrapper fixtures and composition semantics, and showcase pages and naming notes.
- **Risks:** `@ui-sdk/<framework>` is as young as the rest of UI SDK and these layers are its first heavy use outside React and Web; a gap a track finds is reported upstream and recorded in "UI SDK API notes", with a core-side fix only when the behavior is ours. Solid 2 is new, so Solid-1-era answers online are wrong (D15's skill exists for this).
- **Out of scope:** npm entry points for any layer (D2); Nuxt, SvelteKit and SolidStart integrations; live Vue, Svelte or Solid previews on the docs site (D13); showcases (D16); a Solid 1 layer.
