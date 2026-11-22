# Svelte expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: 3ae1e327 (framework layers Task Svelte-8)

## Settled

- **React is the structural reference (framework layers plan D6):** parts, default children and classes match `src/react/`; renaming a part is a change to all five layers.
- **`withKindClass` wraps the component function with a props `Proxy`:** the registry ships one `kind-class.ts` per layer, which can't hold a `.svelte` file, and a proxy passes bindings, snippets and attachments through as the caller wrote them. Svelte 5 components are functions (`Component<Props>`), as `@ui-sdk/svelte`'s own generic part types declare.
- **`class` takes Svelte class values, not a state function:** `@ui-sdk/svelte` parts pass `class` through as an attribute. A state-dependent class keys on the part's `data-*` attributes, as every Kind class already does.
- **Composition is a `render` snippet:** `<StepListItem value={id}>{#snippet render({ props })}<StepTrigger {...props}>…</StepTrigger>{/snippet}</StepListItem>`.
- **A component with default children is `parts.ts`, one `.svelte` per drawing part, and `index.ts`** (Task Svelte-2): `parts.ts` holds the one `createParts` call every file of the folder shares, so nothing imports in a circle.
- **Root wrappers bind every controlled option** (`value = $bindable()`, then `bind:value` on `parts.Root`), so `bind:<key>` works on them as on a bare root (plan D5).
- **Sibling elements and blocks are written without whitespace where React's JSX has a line break** (Task Svelte-5): Svelte keeps a space there and JSX doesn't, so text and accessible names differ from React's; the line break moves inside the closing `>`.
- **Part state is read key by key:** snippet state is a `get`-only Proxy, so spreading it passes nothing.
- **Picker-based components share Picker's parts through `setPickerConfig`, and values core owns are bound to a setter that keeps nothing** (Task Svelte-3, AGENTS.md "Svelte composer controls").
- **Virtualized rows loop over indexes or ids, not row objects** (Task Svelte-6): a row that stays in view keeps its props when the virtualizer's `rows` change.
- **Every Svelte file, fixtures included, follows the sibling whitespace rule** (Task Svelte-8): text matches React's exactly but where a `@ui-sdk/svelte` template adds the space (below).
- **No component works around the root `id` gap** (Task Svelte-8): a component passes a host's `id` to its root part as React does, and every check the gap breaks skips through `tests/browser/svelte-root-id.ts` (below).
- **Picker's content binds only once its rows have** (Task Svelte-8): `PickerContent` hands UI SDK its element without the bind's attachment until `PickerRowsBound`, after the rows, has run its `$effect` and a `tick()`, so a sheet measures its full height before its opening motion and never resizes during it.
- **Svelte-only spec skips and comparisons land in the track's PR** (Task Svelte-8, as Svelte-2, 5 and 6 did, by the coordinator's call): each is gated to the Svelte layer, so D10's shared-file rule doesn't apply to them.
- **The agent pages mirror React's** (Task Svelte-8): `cases/agent.svelte` (`all`, `wave-2` … `wave-6`, Wave 6 in `cases/agent/Shell.svelte`), with the same ids, components and callbacks.
- Everything in AGENTS.md "UI SDK API notes".

## Known and open (don't report again, check whether fixed)

- **Passing `id` to a component's root unnames it in agent snapshots** (`@ui-sdk/svelte` 0.1.0-beta.1 keys the root by `id`; AGENTS.md "Svelte chat core"). It reaches components named by their root (Queue, Question, Suggestion, Feedback, Context Meter, Context Bar, File Tree, Generated Image, Selection, Thread List, Share Dialog). Every check it breaks, in the component specs and the Wave 2 to 4 agent specs, skips through `tests/browser/svelte-root-id.ts` (`rootIdGap`); delete that file and its callers together once UI SDK fixes it. Report upstream.
- **`ComposerTriggerMenu` mounts its Trigger Menu one effect late** to work around UI SDK connecting it before the Token Input's editor exists (AGENTS.md "Svelte chat core"). Remove it once UI SDK fixes the order. Report upstream.

- **UI SDK Slider renders its hidden form input after its root, not inside it as React's does** (`@ui-sdk/svelte` 0.1.0-beta.1, `slider/slider.svelte`). `internal-slider` isn't listed in the Svelte manifest until UI SDK matches React; no component composes it. Report upstream.
- **Wrappers join the manifest with the first component that composes them** (Task Svelte-1): by Task Svelte-7 every wrapper but `slider` (above) is listed. Their exports match React's.
- **Removing a part costs one mutation record per node of its block** (Task Svelte-7): `@ui-sdk/svelte`'s `schema-part.svelte` wraps each part's element in `{#if}` and component anchors, which Svelte removes one by one, so a leaving Conversation Search mark is about 9 records where React's is 1 (`conversationSearchType` budget: 451 writes against React's 151). Report upstream; the DOM work itself is small.
- **`@ui-sdk/svelte` runs a dropped Command row's item snippet once more after the row is gone** (Task Svelte-7), so `PickerItem` draws nothing for a row without state. Report upstream; remove the guard once fixed.
- **A sheet that resizes during its opening motion throws "Failed to set the 'startTime' property on 'Animation'"** (`@ui-sdk/core` `sheet-effects.js` `sync` sets `startTime` on scroll-driven animations too). Picker's content no longer resizes then (Settled above). Report upstream.
- **A UI SDK Svelte component keeps a local change to a prop that isn't bound**, so a controlled value needs a function binding. Report upstream if it's not the intended contract.
- **A part whose state changes rewrites its unchanged `style` attribute** when core or UI SDK also wrote inline styles to it (`@ui-sdk/svelte` 0.1.0-beta.1 `styleFor` against Svelte's `set_style`; AGENTS.md "Svelte step family"). The Tool budget allows the 10 extra writes on its first chunk, and Terminal's chunk 1. Report upstream.
- **`terminalChunk` can count one scroll's work twice** (Task Svelte-8): at 1,000 lines, the chunk that wraps the last line writes 4 nodes and reads layout 9 times, and the scroll it causes removes the first line in view with its 8 anchors (9 writes, 6 reads). That scroll usually lands in the next measurement and sometimes in the same two frames, so the budget is the sum (13 writes, 15 reads; React's is 6 and 17).
- **`@ui-sdk/svelte` templates keep a space React doesn't** (Task Svelte-8): after Menu's children and a Menu item's, before the hidden `<input>` of Radio, Checkbox, Switch, Segmented Control and File Input, and in Token Input, Command and Trigger Menu. Pages composing them differ from React's text by those spaces only. Report upstream.
- **A Segmented Control's hidden radio gets a `checked` attribute only when a person's press renders the item again** (`@ui-sdk/svelte` 0.1.0-beta.1); a controller write sets only the property. Wave 6's agent spec compares Share Dialog's visibility by the items' `aria-checked` on Svelte. Report upstream.
