# AGENTS.md

Routing map for agents and contributors working in kind-ui/agent-ui. This repository contains only `@kind-ui/agent-ui`, its docs site, its registry, and its checks.

- Spec (binding): [`docs/superpowers/specs/2026-11-14-agent-ui-design.md`](docs/superpowers/specs/2026-11-14-agent-ui-design.md)
- Wave 1 plan: [`docs/superpowers/plans/2026-11-14-agent-ui-wave-1.md`](docs/superpowers/plans/2026-11-14-agent-ui-wave-1.md)

## Build on UI SDK

Every component is built on [UI SDK](https://ui-sdk.dev/docs), not around it. From spec §2 "Building on UI SDK":

> - Every public component and every internal general component is a `definePrimitive` definition, or a ready-made UI SDK component. Every React and Web Components render file renders through `createParts` (React and Web Components) or wraps a ready-made UI SDK component.
> - Focus management, keyboard navigation, popups, dismissal, selection, scroll following, live announcements, and ARIA roles and states come from UI SDK: slot `role`/`focus`/`press`/`keys` declarations, UI SDK components, and `@ui-sdk/core` behaviors (for example `createRovingFocus`, `createStickToBottom`, `announce`). Hand-written versions of these are not allowed.
> - Code written outside UI SDK is limited to the exceptions below. Each exception sits in a primitive's `api`, a slot's `on` handler, or a framework-free module in `core`, never in a render layer.
> - A new exception requires a spec change that adds a row to this table.

**Before writing or changing a component, read:**

1. The `ui-sdk` skill: `.agents/skills/ui-sdk/SKILL.md` (installed with `npx skills add`; the same skill ships at `node_modules/@ui-sdk/core/skills/ui-sdk/SKILL.md`). Follow it.
2. `node_modules/@ui-sdk/<framework>/docs/llms.txt`, where `<framework>` is `react` or `web`. It is the index; read it first.
3. To build a new component, search `node_modules/@ui-sdk/<framework>/docs/core.md` by heading for the behaviors you need, and read `docs/rendering.md` next to it.
4. The docs page of every UI SDK component you compose, for example `docs/components/collapsible.md`.

The installed docs describe the exact pinned version. Where the spec or plan names a UI SDK API whose signature differs, follow the installed docs and record the difference under "UI SDK API notes" below.

**Enforcement:** `npm run lint` runs `scripts/check-ui-sdk-usage.mjs`, which fails when:

- a `src/core/<component>/<component>.ts` (other than `motion/` and `markdown/`) does not export exactly one `definePrimitive` result as `<camelCase>Primitive`;
- a `src/react/**/*.tsx` or `src/web/**/*.ts` render file neither calls `createParts` nor wraps a `@ui-sdk/react/<name>` / `@ui-sdk/web/<name>` component;
- a render file hand-writes focus, keyboard, scroll, or ARIA code (`addEventListener`, `onKeyDown`, `tabIndex`, `.focus(`, `scrollTo`, `role=`, …);
- a core file does so without an entry in `scripts/ui-sdk-exceptions.json`, whose values must be exact "Exception" cells from the spec §2 table.

**Versions:** `@ui-sdk/core`, `@ui-sdk/react`, and `@ui-sdk/web` are pinned to one exact version. Upgrading any of them is a separate PR with its own changeset and a full `npm run check`.

## Skills and experts

Project skills live in `.agents/skills/` (`.claude/skills` links to it); [its README](.agents/skills/README.md) says when to use each. Write with [`write-code`](.agents/skills/write-code/SKILL.md), finish with [`unslop`](.agents/skills/unslop/SKILL.md), then run [`expert-review`](.agents/skills/expert-review/SKILL.md). Layer experts (core, react, web, styles, markdown) live in `.agents/experts/`; `node scripts/expert-scope.mjs --base <ref>` shows which ones a diff reaches. Third-party attribution lives only in `THIRD_PARTY_NOTICES.md`.

## Verification policy

- **Quick checks while you work:** `npm run lint` and `npm run typecheck`, plus the unit tests or the one browser spec your change reaches. Run `npm run check` (browser suites included) once before you push.
- **Testing never slows implementation.** Build first, then test. Hand slow test work (full browser runs, flaky-test hunts, screenshot sets) to a subagent with only the command and the files it covers.
- **Before every push:** run `unslop` and `expert-review` on the diff.
- **Browser verification:** a PR reports what was checked in a real browser: keyboard, focus, reduced motion (`prefers-reduced-motion` and the `motion` option), and light and dark. Component PRs include light and dark screenshots, taken with nothing focused unless they show focus. Axe passing does not establish animation quality; check motion by eye and say what was not checked.

### Streaming UX acceptance checklist

Every component that shows streamed content passes these before its PR is ready:

- [ ] **Live edge:** it follows the newest content while the reader is at the end, and releases control the moment the reader scrolls away.
- [ ] **Mount-only pop-in:** a new row animates in once, when it mounts; updates to an existing row never replay the entrance.
- [ ] **No layout shift:** streaming text, status changes and late metadata do not move content above or beside them.
- [ ] **Compact completion:** tool and diff results collapse to a compact summary when they complete.
- [ ] **Approvals keep their outcome:** a resolved approval shows what was decided, not the buttons it had.

## UI SDK API notes

Differences between the plan's named APIs and the pinned UI SDK version. Tasks 2 and later fill this in.

- Pinned version: `0.1.0-beta.1`.
- `definePrimitive` is imported from `@ui-sdk/core`; `createParts` from `@ui-sdk/react/primitive` (React) and `@ui-sdk/web` (Web Components). Ready-made components import from `@ui-sdk/react/<name>` and `@ui-sdk/web/<name>`.
- **Web `createParts` (verified in Task 2):** `createParts(primitive, { root: string | RootOptions, <slot>: string | PartOptions }): Parts`. It registers each tag once and returns the element classes (`Root`, then each slot in PascalCase). A plain string maps a slot to a custom element that *is* the part. The plan's `{ root: "form", … }` tag map does not translate directly, because web tags must be custom element names. To keep native elements, map each slot to `{ tag, target, display: "contents" }`. `target` binds the slot's behavior and attributes to a native child: `wrappedChild("form")`, `wrappedChild("textarea")`, or `wrappedButton`. The custom element is a layout-free wrapper in light DOM, and Tailwind classes go on the native child. Parts find their root by walking up the DOM.
- **Option kind `"action"`:** in React the option is a function whose return value the primitive receives. On web it is a DOM event named after the option without `on` (`onSubmit` fires `submit` on the root element), and listeners call `event.detail.waitUntil(promise)`. Either way, the primitive gets a thenable to track pending state.
- **Declaration emit (TS2742):** an exported `definePrimitive(...)` result has an inferred type that references `SlotProps`, which no public `@ui-sdk/core` entry exports. Annotate it explicitly as `ReturnType<typeof definePrimitive<Options, State, Api, Record<SlotNames, SlotDefinition<State, Api, BaseSlotProps, Record<never, never>>>>>`. `BaseSlotProps` comes from `@ui-sdk/core/renderer`. `src/core/composer/composer.ts` shows the pattern.
- **`exactOptionalPropertyTypes`:** the type `definePrimitive` returns (`options: … | undefined`) is not assignable to UI SDK's own `Primitive` (`options?: …`) when this flag is on. `tsconfig.checks.json`, which covers the render layers, fixtures, and browser specs, turns the flag off. Core keeps it on.
- **Neutral types (Task 3):** `src/types/` models host data only (messages, parts, steps, tool calls, approvals). No UI SDK type describes this data, so nothing is reused from `@ui-sdk/*` there, and the `types` layer imports no runtime module. Component state and actions reuse UI SDK types in `core`.
- **Web root state and api:** a web root follows `@ui-sdk/web`'s own roots: `state` maps each controlled value to a live property through the primitive's getter and setter (`isOpen`/`setOpen`, `getValue`/`setValue`), and `api` lists the methods `element.api` exposes.
- **Agent bridge:** `createAgent` comes from `@ui-sdk/react/agent` or `@ui-sdk/web/agent`. A `definePrimitive` primitive's snapshot entry has `component` set to the primitive `name`, `label` set to the root's accessible name, the state keys listed in `controlled`, and `pending`.
- **AI SDK adapter (Task 4):** `adapters/ai-sdk` is not a UI SDK component, so the guard does not scan it. It imports `ai` with `import type` only. Differences between `ai@7.0.173` and spec §4.3 are recorded in `packages/agent-ui/README.md` under "Tested AI SDK version". `fromUIMessages` applies the chat status to the last message (any role), because with `submitted` the last message is the user's.
- **Motion helper (Task 5):** `motion@14.14.0` is exact-pinned. UI SDK `animateIn` / `animateOut` are CSS-driven: they only set `data-starting-style` / `data-ending-style` / `inert` and wait on `el.getAnimations()`, so `src/core/motion/` animates values with motion's `animate` and calls them for presence. `animateOut` finishes synchronously when no animation is running, so the helper always passes explicit `[from, to]` keyframes (current computed values when continuing, numeric strings parsed to numbers); motion then starts its WAAPI animation synchronously and `animateOut` waits for it. `@ui-sdk/core` does not export its `prefersReducedMotion`, so the helper reads `matchMedia` itself. An `enter` during `exit` rejects the exit promise with an `AbortError` (the element stays). Presets animate `transform` (which motion keeps on the compositor) and `layout` drives the separate `translate` and `scale` properties from a motion value, because motion replaces a running animation of the same property: a layout run is tracked apart and never stops an enter or exit. An interrupted run is cancelled with its values held inline, since motion's `stop()` commits them a frame later over the next run, and a finished run resolves in motion's render step so cleanup lands after motion's final write. `expand` animates from and to the `height` that `box-sizing` needs. `"dot-flow"` loops over `[data-dot]` children; reduced motion and `layout` under reduced motion apply the final state at once. The guard needs no `ui-sdk-exceptions.json` entry for `motion/`.
- **Internal components (Task 6):** React wrappers in `src/react/internal/` are the `@ui-sdk/react/<name>` parts passed through `withKindClass` (`kind-class.ts`), which puts Kind classes before the caller's `className` (string or state function) and passes every other prop through. Parts that render no element (`Menu`, `TokenInput`, `TriggerMenu`) are reexported as is. A wrapper whose `render` is another Kind wrapper renders that target's bare UI SDK part, so the element gets the outer wrapper's base classes once. The plan's `kind-internal-<name>` web tags cannot re-tag UI SDK elements: `@ui-sdk/web` parts find their owner with a fixed `ui-<name>` tag selector, and the core primitives alone lack the web glue (`list.js`, `popup.js`), so `createParts` cannot rebuild them. Instead, each `src/web/internal/<name>.ts` imports `@ui-sdk/web/<name>` (the entry registers the `ui-*` elements on import; there is no `define…Elements` export) and `defineInternal<Name>()` registers a `display: contents` host `kind-internal-<name>` whose Tailwind classes style the `ui-*` parts inside it through `[&_[data-slot=<slot>]]:` variants. Markup is `<kind-internal-menu><ui-menu>…</ui-menu></kind-internal-menu>`. The guard accepts a bare `import "@ui-sdk/web/<name>"` as wrapping a component. Internal wrappers do not animate; primitives that compose them use the motion helper.
- **Token Input whitespace:** the editor needs `whitespace-pre-wrap`, which token hosts inherit, so whitespace in a web `<template>` breaks the token onto its own line. The editor sets `whitespace-nowrap` on `[data-slot=token-input-host]`.
- **Markdown engine (Task 7):** `src/core/markdown/` is glue over pinned OSS, not a hand-written parser. `split.ts` splits blocks with `marked@18.2.0` `Lexer#blockTokens`, `space` tokens folded into the block before, a block final once it ends in `\n\n` with two blocks after it, and only the text after the final blocks lexed again. The HTML-tag and `$$` merging are left out (raw HTML renders as text, no math). Documents with link definitions stay one block, so `mdast-util-definitions` can resolve references; the lexer's `tokens.links` decides, so definition syntax inside code doesn't count. Footnotes split like other blocks: a `Tokenizer` override keeps marked from taking `[^x]: word` as a link definition, and a footnote's indented continuation joins its block. A reference renders as its own text whether or not its definition shares the parse, unless `(url)` follows it, which then renders as a link. `remend@1.4.0` repairs only the streaming last block (`katex: false`, `linkMode: "text-only"`); it does not close code fences, and none is needed because micromark runs an open fence to the end. URLs go through `micromark-util-sanitize-uri`'s `sanitizeUri(url, /^(https?|mailto)$/i)`: a URL with a leading space fails closed instead of being trimmed. Parsing uses `fromMarkdown` with `micromark-extension-gfm` + `mdast-util-gfm`; parse results are cached by block text with trailing newlines removed, so a block that just ended is not parsed again. Only `createMarkdownEngine`, `MarkdownBlock`, `MarkdownEngine`, and `MdNode` are public; `splitBlocks`, `repairTail`, `sanitizeUrl`, and `toMdNode` from the plan are internal or replaced by the libraries. A 20-character chunk can finish more than one block, so the acceptance test bounds parses by the blocks that were not final, not by 2. No highlighter ships (spec §6), so shiki is not added.
- **Step (Task 8):** `stepPrimitive` owns its trigger (`role: "button"`, `press`) and content slots and binds the content with `bindPanel` (`isFindable: true`, `hiddenAttrs(open || exiting, true)`), the same behaviors UI SDK Collapsible is built from. The render layers do not wrap the internal Collapsible: Collapsible would own `open` and the trigger element, and the skill forbids binding a second primitive's slot to an element one of UI SDK's already binds. `bindPanel` covers find in page, so `bindFindable` is not called separately. Panel motion is CSS on `bindPanel`'s `data-starting-style` / `data-ending-style` and `--kind-step-content-height`, keyed on `data-motion` and `prefers-reduced-motion` (height only at full motion; reduced is a 120 ms fade; `none` has no transition). The JS motion helper is not used here, because its `animateIn` / `animateOut` would drive presence a second time. `announce` takes `{ priority: "polite" }`, not a positional priority. Change details have no `"pointer"` or `"auto"` source: auto opens and closes report `reason: "auto"` with `source: "programmatic"`, and other changes carry UI SDK's sources (`mouse`, `keyboard`, `agent`, …). The agent bridge adds its generic `press` action to any component holding a button, so a step lists `expand`, `collapse`, and `press`.
- **StepList roving focus:** `focus: "roving"` on a slot does not write `tabindex`; the item's `attrs` returns `tabindex: part.api.roving.tabIndex(state, part)` as in UI SDK's rating guide, and the guard accepts a core `tabindex` only in that form. A trigger joins its list through `render` composition, as UI SDK's `ToolbarButton render={<MenuTrigger />}` does: React `<StepListItem value={id} render={<StepTrigger />}>`; web `<kind-step-list-item value="…"><kind-step-trigger><button>`. On web the list item targets the nested `button`, and the button keeps the trigger's `data-slot`. `createFocusRecovery` runs after the removed item has left `roving.items()`, so the list keeps the previous item order to pick the next sibling.
- **Motion tokens:** durations and easings live in `src/core/motion/tokens.ts`, which the motion helper imports. CSS reads the same values from `--kind-duration-*` / `--kind-ease*` in `agent-ui.css`, because a stylesheet cannot import TypeScript and the package has no CSS build step; `tests/core/motion.test.mjs` fails when the two differ. Loop timings (spin, pulse, shimmer, dot flow) are not tokens.
- **Step status glyphs:** the check, ✕ and minus are SVG paths used as CSS `mask` images on the icon's `::after`, so both render layers show the same centered glyph without extra markup. The running spinner is a full faint track plus an arc on `::before`. `data-motion` is on the trigger, icon and title too, so `motion="reduced" | "none"` stops the chevron, spinner and shimmer.
- **Shared styles:** Step styles live in `src/styles/step.css` (Conversation's in `conversation.css`) (imported by `agent-ui.css`), keyed on `data-slot` / `data-status` and `--kind-*` tokens inside `@layer components`, so both render layers render identically and a React `className` still wins. `agent-ui.css` holds provisional `--kind-*` tokens (light and `prefers-color-scheme: dark`) and the `kind-shimmer` / `kind-spin` / `kind-pulse` keyframes until Task 14. Fixture stylesheets import `agent-ui.css`.
- **Conversation (Task 9):** `conversationPrimitive` owns its `viewport` slot and binds `createStickToBottom` (and `createVirtualizer` with `virtualize`) to it; the render layers don't wrap the internal Scroll Area, whose viewport UI SDK already binds and whose `stickToEnd` would be a second follower on the same scroller (same reasoning as Step and Collapsible). The viewport declares `focus: "tab-stop"` with `tabindex: "0"`, as UI SDK's docs do for a focusable frame, so the keyboard can scroll a log with nothing focusable in it; the guard accepts one `tabindex: "0"` per `focus: "tab-stop"` in a core file. `nextFollowState` takes `{ type: "following" }` events, fed from `createStickToBottom`'s `following`, rather than the plan's `atBottom`: `following` is what the stick releases and resumes, while `atBottom` only says where the view is. Extra public pieces the plan left out: a `row` slot (`value`, `index`) that plays the mount-only entrance once per new index with the motion helper and is measured when virtualized, an `onRowsChange` callback (web: `rowschange`, `detail.value`) and the content part's `rows` state for rendering virtualized rows, and a `motion` option. The jump control's text (`"Jump to latest"` / `"N new messages"`) is written by its `bind`, so both layers render it from one place; its `aria-label` starts with "Jump to latest", `announce` reads the count, and `aria-live="off"` keeps the log from reading the button again. Edge fades are a CSS scroll timeline (`@supports (animation-timeline: scroll())`) over `mask-image`, so they need no script and don't fade an edge with nothing past it.
- **`tests/types/no-ai`:** `ai` is hoisted at the root, and a `paths` entry pointing at a missing file falls back to `node_modules`. The project maps `ai` to an empty stub (`ai-absent.d.ts`) instead. Types from `ai` need `skipLibCheck` (on in `tsconfig.base.json`), because `ai`'s own declarations fail under `exactOptionalPropertyTypes`. `no-ai` itself turns `skipLibCheck` off: each adapter `import type … from "ai"` carries a JSDoc `/** @ts-ignore */`, which, unlike a `//` comment, survives into the emitted `.d.ts`, so without `ai` those types are `any` instead of an error.

## Root scripts

| Script | Runs |
| --- | --- |
| `npm run build` | `tsc -b packages/agent-ui` |
| `npm run lint` / `npm run format` | `biome check . && node scripts/check-ui-sdk-usage.mjs` / `biome check --write .` |
| `npm run typecheck` | `build`, then `tsc` over render layers and fixtures (`tsconfig.checks.json`) and consumer type tests (`tests/types/{nodenext,with-ai,no-ai}/`) |
| `npm run test:unit` | `build`, then `node --test` over `packages/agent-ui/tests/core/` (tests import `@kind-ui/agent-ui` by name, which resolves to `dist`) |
| `npm run test:scripts` | `node --test` over `scripts/tests/` (tooling and guard tests) |
| `npm run test:browser` | `playwright test` (accepts `--project` and `--shard`) |
| `npm run check:package` / `build:registry` / `check:registry-consumers` | packed-package gate / registry build / registry consumer installs |
| `npm run check:fast` | `lint`, `typecheck`, `test:scripts`, `test:unit` |
| `npm run check:packed` | `check:package`, `build:registry`, `check:registry-consumers` |
| `npm run check` | `check:fast`, `check:packed`, `test:browser` |
| `npm run dev:docs` / `build:docs` | docs site dev server / production build |
| `npm run changeset` | add a changeset |

Composite scripts go through `scripts/run-checks.mjs`. A stage whose script or config file does not exist yet prints `skipped: <stage>`. Every new check script joins `npm run check`.

## Layer import rules (spec §2)

| Layer | Path | May import | Must not import |
| --- | --- | --- | --- |
| `types` | `packages/agent-ui/src/types/` | nothing | any runtime module |
| `core` | `packages/agent-ui/src/core/` | `types`, `@ui-sdk/core`, `motion`, the markdown libraries (spec §6) | React, other UI frameworks, `ai`, Tailwind |
| `adapters/ai-sdk` | `packages/agent-ui/src/adapters/ai-sdk/` | `types`, `ai` types | `core`, React, `@ui-sdk/*` |
| `react` | `packages/agent-ui/src/react/` | `@kind-ui/agent-ui/core`, `@ui-sdk/react` | `ai`, `web` |
| `web` | `packages/agent-ui/src/web/` | `@kind-ui/agent-ui/core`, `@ui-sdk/web` | React, `ai` |

Render layers import core only through `@kind-ui/agent-ui/core`, never a relative path, so the registry can copy them byte-for-byte.

## Conventions

- TypeScript is strict with NodeNext modules, explicit `.js` import suffixes, and named reexports only (no `export *`).
- Primitive names are `kind-<component>`. Web Component tags are `kind-<component>` and `kind-<component>-<part>`, rendered into light DOM.
- Styling is Tailwind v4 utilities keyed on `data-*` attributes; data-driven values use `--kind-*` CSS variables.
- Tests use fixtures and explicitly resolved deferred promises only: no live services, timing sleeps, or model calls.
- `@kind-ui/agent-ui` stays `"private": true` at `0.0.0`. Nothing publishes without a maintainer's explicit authorization.
