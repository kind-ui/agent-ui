# Solid expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `2a99a303` (Task Solid-2)

## Settled

- **React is the structural reference** (framework layers plan D6): Solid files export React's part names and render its default children and classes; the parity test and spec compare them.
- **A Kind part is another Kind part's `render` target when it's created first inside that `render` with the part's props** (Task Solid-1): Solid's `render` is a function, so the wrapper can't look inside it as React's does with an element. `withKindClass` keeps the outer part's `data-slot` while it calls a Kind part's `render`; the first Kind part created then with that `data-slot` renders its bare UI SDK part. `render={KindButton}` and `render={(props) => <KindMenuTrigger {...props} />}` both work.
- **The fixture doesn't prebundle `@ui-sdk/solid`** (Task Solid-1): its entries ship JSX under the `solid` condition, which only the Solid plugin compiles; the optimizer's own JSX transform turned it into `React.createElement`. `@ui-sdk/core`'s entries are prebundled instead.
- **`tsconfig.solid.json` resolves modules as a bundler** (Task Solid-1): docs examples import `@/components/ui/solid/<name>` without an extension, as React's do, which NodeNext refuses; Solid's JSX is compiled by the consumer's bundler anyway.
- **Default children are `props.children ?? <Default />`** (Task Solid-2): one lazy read, built only when used; a part that reads `props.children` more than once reads it through a `createMemo`, since each read builds an element child again.
- **`MessageRegenerate` takes its button as a function child** (Task Solid-2): Solid can't clone an element child into `MenuTrigger`'s `render`, as React does; an element child still regenerates, without the menu.
- **Trigger Menu's editor attributes are missing at rest** (Task Solid-2): an `@ui-sdk/solid` gap, listed under `known` on `?c=composer&case=full` and recorded in AGENTS.md "UI SDK API notes".
- Everything in AGENTS.md "UI SDK API notes".

## Known and open (don't report again, check whether fixed)

- **`internal.spec.ts`'s composition test skips every layer but React**: it passes on Solid (checked by hand in Task Solid-1); turning it on is a shared spec change for its own PR.
- **`hydration.spec.ts` on Step can time out under heavy parallel load** (Task Solid-1): about 6 s alone, but the unbundled `@ui-sdk/solid` modules, a cold SSR render and two 4.8 s pulse waits push it past 30 s with a dozen workers. CI's retries absorb it; prebundling `@ui-sdk/solid` would need the optimizer to run Solid's JSX transform. Task Solid-2 dropped the fixture's case warmup, which held the first page 34 s; it now takes about 18 s cold.
