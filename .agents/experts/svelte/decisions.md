# Svelte expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: framework layers Task Svelte-1

## Settled

- **React is the structural reference (framework layers plan D6):** parts, default children and classes match `src/react/`; renaming a part is a change to all five layers.
- **`withKindClass` wraps the component function with a props `Proxy`:** the registry ships one `kind-class.ts` per layer, which can't hold a `.svelte` file, and a proxy passes bindings, snippets and attachments through as the caller wrote them. Svelte 5 components are functions (`Component<Props>`), as `@ui-sdk/svelte`'s own generic part types declare.
- **`class` takes Svelte class values, not a state function:** `@ui-sdk/svelte` parts pass `class` through as an attribute. A state-dependent class keys on the part's `data-*` attributes, as every Kind class already does.
- **Composition is a `render` snippet:** `<StepListItem value={id}>{#snippet render({ props })}<StepTrigger {...props}>…</StepTrigger>{/snippet}</StepListItem>`.
- **Roots and parts with default children are `.svelte` files; a root wrapper binds each controlled option** (`$bindable()` passed on with `bind:`), and Picker-based components share Picker's parts through `setPickerConfig` (Task Svelte-3).
- **Part state is read key by key, and values core owns are bound to a setter that keeps nothing** (AGENTS.md "Svelte composer controls"): the workarounds for the two `@ui-sdk/svelte` gaps below.
- Everything in AGENTS.md "UI SDK API notes".

## Known and open (don't report again, check whether fixed)

- **UI SDK Slider renders its hidden form input after its root, not inside it as React's does** (`@ui-sdk/svelte` 0.1.0-beta.1, `slider/slider.svelte`). `internal-slider` isn't listed in the Svelte manifest until UI SDK matches React; no component composes it. Report upstream.
- **Eleven wrappers exist but aren't listed in the manifest yet** (Task Svelte-1): the ten checked only on a component's parity page (alert-dialog, carousel, checkbox, drawer, radio, resizable, segmented-control, textarea, tooltip, tree) join with that component, and `toolbar` with the first component that composes it, since `check:registry-consumers` then needs a rendered toolbar button. Their exports match React's.
- **`@ui-sdk/svelte` part state is a get-only `Proxy` with no own keys**, so it can't be spread (Task Svelte-3). Report upstream.
- **A UI SDK Svelte component keeps a local change to a prop that isn't bound**, so a controlled value needs a function binding. Report upstream if it's not the intended contract.
- **A root given an `id` keys its part by it, and the agent bridge then names the component by another part** (Context Meter, Context Bar put the `id` on the element instead). Report upstream.
- **`@ui-sdk/svelte`'s `.d.ts` use extensionless relative imports**, so its part types are `any` under NodeNext. Report upstream.
