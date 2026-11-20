# Vue expert: decisions

What is already decided, and what is known and open. The expert never re-raises a **Settled** item as a finding.

Last reviewed: Task Vue-1 (framework layers plan)

## Settled

- Everything in AGENTS.md "UI SDK API notes", and the framework layers plan's D3 to D6 (render-function `.ts` files, React's part names, `#render` composition, Composition API only).
- **A Kind wrapper's `class` can't be a function of the part's state (Task Vue-1):** Vue binds `class` as a string, an array or an object, and `@ui-sdk/vue` passes it to the element unchanged (`styling-and-animation.md`). React's `className` function becomes a `data-*` selector or a `#render` slot.
- **Fixtures match React's DOM, not Vue's defaults (Task Vue-1):** where React writes a boolean JSX attribute as `"true"` (`<span data-menu-text>`) or splits text around an expression into two nodes, the Vue case writes the same, so the parity spec compares components rather than JSX.
- **`tsconfig.vue.json` resolves like a Vite app (Bundler), not NodeNext (Task Vue-1):** docs examples import `@/components/ui/vue/<name>` without an extension, as React's do, and render files keep their `.js` suffixes, which Bundler accepts too.

## Known and open (don't report again, check whether fixed)

- **A server-rendered `KindAvatar` whose image loads before hydration warns "Hydration node mismatch" (Task Vue-1):** the `<img>` (a `data:` URL in `?c=internal&case=avatar`) has loaded by the time Vue hydrates, so UI SDK's Avatar is `loaded` and its client render drops the `AvatarFallback` the server rendered. UI SDK's; report upstream. `hydration.spec.ts` joins the manifest in Task Vue-8.
- **`internal.spec.ts`'s composition test ("a Kind part rendered as a toolbar button gets one class list") skips every layer but React:** the spec is shared, so Vue's run waits for a shared change; `parity.spec.ts` on `?c=internal&case=toolbar-menu` compares the trigger's sorted class list with React's and passes.
