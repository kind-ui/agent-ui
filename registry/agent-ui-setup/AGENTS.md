# Agent UI components

The `@kind-ui` components in this directory are built on [UI SDK](https://ui-sdk.dev/docs). Before you change or compose them, read:

1. `node_modules/@kind-ui/agent-ui/README.md`: the package's entries, theme tokens and styles.
2. The ui-sdk skill: `node_modules/@ui-sdk/core/skills/ui-sdk/SKILL.md`.
3. The index of the layer these components use, then the page of every UI SDK component you use:
   - React: `node_modules/@ui-sdk/react/docs/llms.txt`
   - Web Components (`web/`): `node_modules/@ui-sdk/web/docs/llms.txt`
   - Vue (`vue/`): `node_modules/@ui-sdk/vue/docs/llms.txt`
   - Svelte (`svelte/`): `node_modules/@ui-sdk/svelte/docs/llms.txt`
   - Solid (`solid/`): `node_modules/@ui-sdk/solid/docs/llms.txt`

Some of the Vue, Svelte and Solid docs show `@ui-sdk/react` imports; use the same entry from your layer's package. Vue files use the Composition API, Svelte files runes and snippets, and Solid files Solid 2 (`solid-js` and `@solidjs/web`, not Solid 1's `solid-js/web`). If your project has a skill for its framework, follow it too.

Focus, keyboard, popups, scroll following, announcements and ARIA come from UI SDK and the primitives in `@kind-ui/agent-ui/core`. Don't hand-write them in these files.
