# Svelte expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: f92b42e5 (framework layers Task Svelte-2)

## Settled

- **React is the structural reference (framework layers plan D6):** parts, default children and classes match `src/react/`; renaming a part is a change to all five layers.
- **`withKindClass` wraps the component function with a props `Proxy`:** the registry ships one `kind-class.ts` per layer, which can't hold a `.svelte` file, and a proxy passes bindings, snippets and attachments through as the caller wrote them. Svelte 5 components are functions (`Component<Props>`), as `@ui-sdk/svelte`'s own generic part types declare.
- **`class` takes Svelte class values, not a state function:** `@ui-sdk/svelte` parts pass `class` through as an attribute. A state-dependent class keys on the part's `data-*` attributes, as every Kind class already does.
- **Composition is a `render` snippet:** `<StepListItem value={id}>{#snippet render({ props })}<StepTrigger {...props}>…</StepTrigger>{/snippet}</StepListItem>`.
- **A component with default children is `parts.ts`, one `.svelte` per drawing part, and `index.ts`** (Task Svelte-2): `parts.ts` holds the one `createParts` call every file of the folder shares, so nothing imports in a circle.
- **Root wrappers bind every controlled option** (`value = $bindable()`, then `bind:value` on `parts.Root`), so `bind:<key>` works on them as on a bare root (plan D5).
- **Sibling elements and blocks are written without whitespace where React's JSX has a line break** (Task Svelte-5): Svelte keeps a space there and JSX doesn't, so text and accessible names differ from React's; the line break moves inside the closing `>`.
- **Part state is read key by key:** snippet state is a `get`-only Proxy, so spreading it passes nothing.
- Everything in AGENTS.md "UI SDK API notes".

## Known and open (don't report again, check whether fixed)

- **Passing `id` to a component's root unnames it in agent snapshots** (`@ui-sdk/svelte` 0.1.0-beta.1 keys the root by `id`; AGENTS.md "Svelte chat core"). Four agent cases skip on Svelte until UI SDK fixes it. Report upstream.
- **`ComposerTriggerMenu` mounts its Trigger Menu one effect late** to work around UI SDK connecting it before the Token Input's editor exists (AGENTS.md "Svelte chat core"). Remove it once UI SDK fixes the order. Report upstream.

- **UI SDK Slider renders its hidden form input after its root, not inside it as React's does** (`@ui-sdk/svelte` 0.1.0-beta.1, `slider/slider.svelte`). `internal-slider` isn't listed in the Svelte manifest until UI SDK matches React; no component composes it. Report upstream.
- **Eleven wrappers exist but aren't listed in the manifest yet** (Task Svelte-1): the ten checked only on a component's parity page (alert-dialog, carousel, checkbox, drawer, radio, resizable, segmented-control, textarea, tooltip, tree) join with that component, and `toolbar` with the first component that composes it, since `check:registry-consumers` then needs a rendered toolbar button. Their exports match React's.
- **A part whose state changes rewrites its unchanged `style` attribute** when core or UI SDK also wrote inline styles to it (`@ui-sdk/svelte` 0.1.0-beta.1 `styleFor` against Svelte's `set_style`; AGENTS.md "Svelte step family"). The Tool budget allows the 10 extra writes on its first chunk. Report upstream.
- **Components ported before Task Svelte-5 (other than Code Block and Confirmation) still keep a space between siblings** that React's JSX drops, which `parity.spec.ts` can't see (it collapses whitespace). Fix them with the rule above.
