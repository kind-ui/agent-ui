# Vue expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: `8bcbf59` (Task Vue-1)

## Settled

- Everything in AGENTS.md "UI SDK API notes", and the framework layers plan's D3 to D6 (render-function `.ts` files, React's part names, `#render` composition, Composition API only).
- **A Kind wrapper's `class` can't be a function of the part's state (Task Vue-1):** Vue binds `class` as a string, an array or an object, and `@ui-sdk/vue` passes it to the element unchanged (`styling-and-animation.md`). React's `className` function becomes a `data-*` selector or a `#render` slot.
- **Fixtures match React's attributes, not Vue's defaults (Task Vue-1):** where React writes a boolean JSX attribute as `"true"` (`<span data-menu-text>`), the Vue case writes the same. Text split into nodes differently isn't a difference: `tests/browser/tree.ts` joins adjacent text nodes in every layer.
- **`tsconfig.vue.json` resolves like a Vite app (Bundler), not NodeNext (Task Vue-1):** docs examples import `@/components/ui/vue/<name>` without an extension, as React's do, and render files keep their `.js` suffixes, which Bundler accepts too.
- **Part state is read key by key (Task Vue-3):** `@ui-sdk/vue`'s slot `state` is a get-only tracking proxy, so a spread copies nothing; render files read each key (`menuProps`, `menuTriggerProps`).
- **Presence-offered callbacks are function props (Task Vue-3):** `createParts` always sets a callback to an emitter, so an option core reads with `typeof options.onX === "function"` is re-declared `"action"` on a derived primitive in its render file (`picker.ts`); `@x` still binds it.

## Known and open (don't report again, check whether fixed)

- **A server-rendered `KindAvatar` whose image loads before hydration warns "Hydration node mismatch" (Task Vue-1):** the `<img>` (a `data:` URL in `?c=internal&case=avatar`) has loaded by the time Vue hydrates, so UI SDK's Avatar is `loaded` and its client render drops the `AvatarFallback` the server rendered. UI SDK's; report upstream. `hydration.spec.ts` joins the manifest in Task Vue-8.
- **`internal.spec.ts`'s composition test ("a Kind part rendered as a toolbar button gets one class list") skips every layer but React:** the spec is shared, so Vue's run waits for a shared change; `parity.spec.ts` on `?c=internal&case=toolbar-menu` compares the trigger's sorted class list with React's and passes.
- **A template `ref` on a part inside a `#render` slot stays `null` (Task Vue-1):** the slot's `props` carry the part's own `ref`, and `v-bind="props"` replaces the caller's, for bare UI SDK parts as for Kind ones. UI SDK's; report upstream.
