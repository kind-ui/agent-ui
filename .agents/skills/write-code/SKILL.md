---
name: write-code
description: Writes and edits @kind-ui/agent-ui code (core primitives, React and Web Components render files, styles, motion, the markdown engine, the AI SDK adapter, tests and scripts) by starting from the file that already does the same job, then checks it with the repo's checks and a cold read. Use whenever you write or change code in this repo, before you call the change done.
---

# Write agent-ui code

The bar: an expert in the layer reads the file and says "this is how I'd write it", and anyone else reads it top to bottom without stopping. Readable first, then fast, never clever.

## 1. Find the twin

Every piece of code here has a twin that already does it. Open it before you write a line, and copy its shape, names and order. Paths are under `packages/agent-ui/` unless they start at the root.

| You're writing | Start from |
| --- | --- |
| A core primitive | `src/core/step/step.ts` (slots with `role`/`press`, `bindPanel`, `announce`); `src/core/composer/composer.ts` for an `action` option and the explicit `ReturnType<typeof definePrimitive<…>>` annotation |
| A primitive over a list | `src/core/step/step-list.ts` (`createRovingFocus`, `createFocusRecovery`) |
| A React render file | `src/react/step.tsx`, on `createParts` |
| A Web Components render file | `src/web/step.ts`, on `createParts` with `{ tag, target, display: "contents" }` |
| An internal control | `src/react/internal/collapsible.tsx` and `src/web/internal/collapsible.ts` |
| Styles | `src/styles/step.css`, keyed on `data-slot` / `data-*`, values from `--kind-*` tokens |
| Motion | `src/core/motion/index.ts`; durations and easings come from `src/core/motion/tokens.ts` |
| Markdown | `src/core/markdown/engine.ts` and `split.ts` (glue over pinned OSS, never a hand parser) |
| Host data mapping | `src/adapters/ai-sdk/parts.ts` |
| A unit test | `tests/core/step-auto-open.test.mjs` |
| A browser spec and its fixtures | `tests/browser/wave-1/step.spec.ts`, `tests/fixtures/react/cases/step.tsx`, `tests/fixtures/web/cases/step.ts` |

If two twins disagree, one of them has the wrong shape. Say so instead of picking one. Copy a twin's shape, not its comments.

## 2. Load the layer

Read [AGENTS.md](../../../AGENTS.md) ("Build on UI SDK", "UI SDK API notes", the layer import rules) and the expert notes for every layer you touch: `.agents/experts/<layer>/expert.md` and its `decisions.md`. For a component, also follow the [`ui-sdk`](../ui-sdk/SKILL.md) skill and read the installed UI SDK docs (`node_modules/@ui-sdk/<framework>/docs/llms.txt` first). The installed docs describe the pinned version; trust them over memory.

## 3. Write it

- **Built on UI SDK.** Focus, keys, popups, dismissal, scroll following, announcements and ARIA come from slot declarations, UI SDK components and `@ui-sdk/core` behaviors. A render file that grows a listener, a focus call, a `tabIndex` or an ARIA attribute is in the wrong layer; `npm run lint` fails it.
- **One shape.** Primitive `kind-<name>`, React `<Name>` / `<Name><Part>`, web tags `kind-<name>` / `kind-<name>-<part>`. Same parts and options in both render layers.
- **Prefer OSS.** Use the pinned UI SDK, `motion` and markdown libraries before writing your own. A new runtime dependency is a spec change.
- **Names in full words** that say what a thing is. Booleans read as questions.
- **No comment by default.** Write one only when a reader would get the code wrong without it: a browser bug, a UI SDK quirk, a trade-off. One to three lines.
- **No defensive code for cases that can't happen.** The types rule them out.
- **No helper for one caller,** and no wrapper that only renames.
- **Named reexports only**, explicit `.js` suffixes, render layers import core only through `@kind-ui/agent-ui/core`.

## 4. Check it

Run the quick checks while you work and check exit codes, not output:

```sh
npm run lint
npm run typecheck
npm run test:unit          # when you touched core, types or the adapter
npm run test:scripts       # when you touched scripts/
npx playwright test tests/browser/wave-1/<name>.spec.ts   # only the spec your change reaches
```

Run `npm run check` (all of it, browser included) once before you push. When a check is slow, hand it to a subagent with only the command and the files it covers, and keep writing.

## 5. Read it cold

Read the whole diff as the layer's expert would, using the checklist in each `expert.md` you loaded, and as a teammate who has never seen it:

- Would an expert in this layer write it this way? If you can name a more idiomatic version, write that one.
- Is every name clear without its comment?
- Is anything duplicated that exists elsewhere, in this repo or in UI SDK?
- Does any function do two things, or any file hold two ideas?
- Any allocation on a streaming hot path, or a layout read after a write?

## 6. Unslop, then review

Run [`unslop`](../unslop/SKILL.md) on your diff, then [`expert-review`](../expert-review/SKILL.md). The change isn't ready to push until both have run.
