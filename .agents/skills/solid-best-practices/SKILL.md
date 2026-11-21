---
name: solid-best-practices
description: Solid 2 rules for writing and reviewing Solid components and render files (solid-js and @solidjs/web 2.x). Use whenever you write, change or review a .tsx file under src/solid, a Solid fixture or a Solid docs example. Solid 1 habits (createResource, Suspense, splitProps, onMount, solid-js/web) are wrong here.
---

# Solid 2

`@ui-sdk/solid` needs Solid 2 (`solid-js` and `@solidjs/web` 2.x, below 3); Solid 1 isn't supported. Much Solid advice online is Solid 1. When it and this page disagree, this page and Solid's own migration guide (`documentation/solid-2.0/MIGRATION.md` in solidjs/solid) win.

## The model

- A component body runs once. Anything that changes over time is read inside JSX, a memo, an effect's compute function or an event handler, never at the top of the body. Solid 2 warns about a top-level reactive read in development; fix the read, don't silence it with `untrack`.
- Props are a live proxy. Read `props.value` where it's used. Never destructure props, in the parameter list or the body.
- Call a signal to read it: `open()`, not `open`.
- Setters are batched: a write isn't visible to reads until the microtask flush. Don't write and then read back in the same handler; use the value you wrote. `flush()` is for tests and rare imperative code only.
- Don't write signals inside a memo or an effect's compute function; Solid 2 throws in development. Derive with `createMemo`, write in handlers.

## Imports and types

- The DOM runtime is `@solidjs/web` (`render`, `hydrate`, `renderToString`, `Portal`, `Dynamic`, JSX types). `solid-js/web` and `solid-js/store` don't exist; stores come from `solid-js`.
- `tsconfig` for Solid files: `"jsx": "preserve"`, `"jsxImportSource": "@solidjs/web"`. Keep it apart from the React config: one TypeScript project can't hold two JSX runtimes.
- Types: `JSX` and `ComponentProps` from `@solidjs/web`; `Component` and `Element` from `solid-js`.

## Renamed and removed APIs

| Solid 1 | Solid 2 |
| --- | --- |
| `splitProps(props, ["a", "b"])` | `omit(props, "a", "b")` |
| `mergeProps(a, b)` | `merge(a, b)` |
| `onMount(fn)` | `onSettled(fn)`, which may return a cleanup |
| `createEffect(() => { … })` | `createEffect(() => read(), (value) => { …; return cleanup })` |
| `createMemo(fn, initial)` | `createMemo(fn)`; the compute gets `prev`, `undefined` at first |
| `<Index each>` | `<For each keyed={false}>`, whose children get an item accessor and a stable index |
| `<Suspense>`, `<ErrorBoundary>` | `<Loading>`, `<Errored>` |
| `createResource` | an async `createMemo` read under `<Loading>`; `isPending(() => expr)` for refetches |
| `unwrap(store)` | `snapshot(store)` |
| `use:` directives, `/*@once*/`, `class:`/`style:` namespaces | `ref` directive factories, plain reactive JSX, `class`/`style` objects |

A ref callback has no owner, so `onCleanup` inside it does nothing; register cleanup in the component body (`onSettled`) instead.

## Lists and conditions

- `<For each={rows()}>` passes each raw item and keys by identity. Give rows stable objects, or their DOM is rebuilt.
- Conditions go through `<Show>` and `<Switch>`/`<Match>`, which keep the branch's DOM while the condition holds.

## In this repository

- Every render file in `src/solid/` calls `createParts` from `@ui-sdk/solid/primitive` or wraps a `@ui-sdk/solid/<name>` part, and imports core only through `@kind-ui/agent-ui/core`. Behavior lives in core: no listeners, focus calls, `tabindex` or ARIA attributes in a render file.
- Composition uses UI SDK's `render` prop: `render={(props, state) => <a {...props} />}`, or a component. A part's state reaches its children as a function child: `{(state) => …}`.
- Pass a part's props through untouched (`{...props}`), and merge a caller's `class` with Kind classes through the internal wrapper, never by replacing it.
- Server render: `renderToString` markup must hydrate without a mismatch. Don't read `window`, `matchMedia` or layout during render; core reads them in a slot's `bind`.
- Check a change with the Solid fixture and the browser spec it reaches, as the React and Web Components layers do.
