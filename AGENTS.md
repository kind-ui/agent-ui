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

## UI SDK API notes

Differences between the plan's named APIs and the pinned UI SDK version. Tasks 2 and later fill this in.

- Pinned version: `0.1.0-beta.1`.
- `definePrimitive` is imported from `@ui-sdk/core`; `createParts` from `@ui-sdk/react/primitive` (React) and `@ui-sdk/web` (Web Components). Ready-made components import from `@ui-sdk/react/<name>` and `@ui-sdk/web/<name>`.

## Root scripts

| Script | Runs |
| --- | --- |
| `npm run build` | `tsc -b packages/agent-ui` |
| `npm run lint` / `npm run format` | `biome check . && node scripts/check-ui-sdk-usage.mjs` / `biome check --write .` |
| `npm run typecheck` | `build`, then `tsc` over type tests, fixtures, docs, and tooling |
| `npm run test:unit` | `node --test` over `packages/agent-ui/tests/core/` |
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
| `core` | `packages/agent-ui/src/core/` | `types`, `@ui-sdk/core`, `motion`, mdast/micromark | React, other UI frameworks, `ai`, Tailwind |
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
