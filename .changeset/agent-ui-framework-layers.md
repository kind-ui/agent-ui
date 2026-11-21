---
"@kind-ui/agent-ui": minor
---

Vue, Svelte and Solid layers: every component, and the internal wrappers they compose, now ships as `@kind-ui` registry items for three more frameworks beside React and Web Components, rendering the same primitives with the same parts, options, state, events, agent actions, accessibility, motion and tokens.

- Items are `<component>-vue`, `<component>-svelte` and `<component>-solid` (for example `@kind-ui/composer-vue`), each pinning `@kind-ui/agent-ui`, `@ui-sdk/core` and `@ui-sdk/vue`, `@ui-sdk/svelte` or `@ui-sdk/solid` at the same versions as the React and Web items. The pinned shadcn CLI installs them into a Vite app with a hand-written `components.json`; the docs show one.
- Framework floors are UI SDK's: Vue 3.5 (Composition API), Svelte 5.33 with runes, and Solid 2 (`solid-js` and `@solidjs/web`). Solid 1 isn't supported.
- Part and option names match React's. Controlled props and callbacks are spelled as each framework expects (`v-model:open` and `@open-change` in Vue, `bind:open` in Svelte, `open` and `onOpenChange` in Solid), composition goes through Vue's `#render` slot, Svelte's `render` snippet and Solid's `render` prop, and each docs page's API reference has a table of the spellings.
- Agents connect with `createAgent` from `@ui-sdk/vue/agent`, `@ui-sdk/svelte/agent` or `@ui-sdk/solid/agent`.
- The docs show every example in React, Vue, Svelte and Solid tabs, with install tabs for every layer and a new Agents page.
- The npm package's exports are unchanged, and it still depends on no framework: the new layers ship only through the registry.
