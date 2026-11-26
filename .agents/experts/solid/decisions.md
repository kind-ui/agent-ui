# Solid expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: 8aee26be

## Settled

- **React is the structural reference** (framework layers plan D6): Solid files export React's part names and render its default children and classes; the parity test and spec compare them.
- **A Kind part is another Kind part's `render` target when it's created first inside that `render` with the part's props** (Task Solid-1): Solid's `render` is a function, so the wrapper can't look inside it as React's does with an element. `withKindClass` keeps the outer part's `data-slot` while it calls a Kind part's `render`; the first Kind part created then with that `data-slot` renders its bare UI SDK part. `render={KindButton}` and `render={(props) => <KindMenuTrigger {...props} />}` both work.
- **The fixture doesn't prebundle `@ui-sdk/solid`** (Task Solid-1): its entries ship JSX under the `solid` condition, which only the Solid plugin compiles; the optimizer's own JSX transform turned it into `React.createElement`. `@ui-sdk/core`'s entries are prebundled instead.
- **`tsconfig.solid.json` resolves modules as a bundler** (Task Solid-1): docs examples import `@/components/ui/solid/<name>` without an extension, as React's do, which NodeNext refuses; Solid's JSX is compiled by the consumer's bundler anyway.
- **Default children are `props.children ?? <Default />`** (Task Solid-2): one lazy read, built only when used; a part that reads `props.children` more than once reads it through a `createMemo`, since each read builds an element child again.
- **`MessageRegenerate` takes its button as a function child** (Task Solid-2): Solid can't clone an element child into `MenuTrigger`'s `render`, as React does; an element child still regenerates, without the menu.
- **`ComposerTriggerMenu` creates its menu once the editor has attached** (Task Solid-8): an `@ui-sdk/solid` gap left the editor's `aria-autocomplete` and `aria-haspopup` unwritten at rest (Task Solid-2); a menu created once the editor has attached writes them, as React's does. AGENTS.md "UI SDK API notes". Still open in `0.1.0-beta.17`: without it, `parity.spec.ts` on `?c=composer&case=full` misses both attributes.
- **Picker content binds as UI SDK hands it over** (`0.1.0-beta.17`): Task Solid-8 bound it after its rows (`afterChildren`), since a sheet that resized while opening threw from `@ui-sdk/core`; core fixed that in `0.1.0-beta.6`, and `picker.spec.ts`, Model Selector's and Thread Search's specs pass without it.
- **Step family default parts are built per instance, not shared** (Task Solid-5): React's module-level `DEFAULT_PARTS` exists to skip re-rendering wrappers per chunk, which Solid never does; item lists are `<For>` keyed by id.
- **Virtualized rows are keyed `<For>` lists over the primitive's row objects** (Task Solid-6): Terminal by `row.index`, Transcript by `row.key`, Test Results by item value, so a chunk, a word or a test updates one row; React's `memo`'d rows are unneeded.
- **Transcript's played word writes `data-current` twice** (Task Solid-6): an `@ui-sdk/solid` gap (`directNames` ignored), recorded in AGENTS.md "UI SDK API notes" and in `budgets/solid.ts`. Still open in `0.1.0-beta.17` (4 writes against React's 2).
- **Solid hydration is reliable with the Playwright warm-up** (Task Solid-8): Step's hydration test took 4.7 to 5.2 s across 5 repeats at 8 workers, and the whole hydration spec passes at 4 and 8 workers.
- Everything in AGENTS.md "UI SDK API notes".

## Known and open (don't report again, check whether fixed)

- **`CommandPage` warns `STRICT_READ_UNTRACKED` while server rendering** (`@ui-sdk/solid` `command.jsx:198`, its `PageContext` value reads `props.value`): still logged in `0.1.0-beta.17`, harmless. `MenuContent`'s `SERVER_WRITE` is gone.
- **Part state is a keyless proxy** (`slotState` in `use-primitive.jsx` has no `ownKeys`): still so in `0.1.0-beta.17`, so `menuProps` and `menuTriggerProps` stay.
- **`internal.spec.ts`'s composition test skips every layer but React**: it passes on Solid (checked by hand in Task Solid-1); turning it on is a shared spec change for its own PR.
