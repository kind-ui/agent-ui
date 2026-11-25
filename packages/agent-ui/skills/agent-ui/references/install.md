# Install

## Pick the layer

Every component comes in five layers that render the same parts, options, keys and agent actions. Use the one the app already uses:

| Layer | Needs | Item | Agent bridge |
| --- | --- | --- | --- |
| React | React 19, `@ui-sdk/react` | `<name>` | `@ui-sdk/react/agent` |
| Web Components | any page, `@ui-sdk/web` | `<name>-web` | `@ui-sdk/web/agent` |
| Vue | Vue 3.5 or later (Composition API), `@ui-sdk/vue` | `<name>-vue` | `@ui-sdk/vue/agent` |
| Svelte | Svelte 5.33 or later with runes, `@ui-sdk/svelte` | `<name>-svelte` | `@ui-sdk/svelte/agent` |
| Solid | Solid 2 (`solid-js` and `@solidjs/web`), `@ui-sdk/solid` | `<name>-solid` | `@ui-sdk/solid/agent` |

Every layer needs Tailwind CSS v4. Solid 1 isn't supported. React 18 isn't supported. The registry items name exact versions of `@kind-ui/agent-ui` and the `@ui-sdk/*` packages, which are released together, but the CLI writes them to `package.json` as caret ranges. Remove the `^` from those entries so a later install can't upgrade one without the others, and upgrade them together by adding the components again.

## Set up components.json

Add the registry to `components.json`:

```json
{
  "registries": {
    "@kind-ui": "https://kindui.dev/r/{name}.json"
  }
}
```

In a React app without a `components.json`, run `npx shadcn@latest init -d` first (`-d` takes the defaults instead of prompting). It also adds a `button` component and a class-based `.dark` theme; see [design.md](design.md#theme-with-tokens) for dark mode. A Vue, Svelte or Solid app built with Vite needs the whole file written by hand, since `init` sets up React:

```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": { "config": "", "css": "src/index.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "aliases": {
    "components": "@/components",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "utils": "@/lib/utils",
    "hooks": "@/hooks"
  },
  "registries": {
    "@kind-ui": "https://kindui.dev/r/{name}.json"
  }
}
```

Set `tailwind.css` to the app's stylesheet, and point `@/*` at `src/*` in `tsconfig.json`. Solid also compiles the copied JSX with its own runtime:

```json
{
  "compilerOptions": {
    "jsx": "preserve",
    "jsxImportSource": "@solidjs/web",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

## Add components

```bash
npx shadcn@latest add @kind-ui/conversation @kind-ui/message @kind-ui/markdown @kind-ui/composer
npx shadcn@latest add @kind-ui/conversation-vue @kind-ui/composer-vue
```

Pick names from [components.md](components.md). A component's own dependencies (Tool brings Markdown, Code Block and Confirmation) come with it. Imports are `@/components/ui/<name>` in React, `@/components/ui/vue/<name>`, `@/components/ui/svelte/<name>/index.js`, `@/components/ui/solid/<name>` and `@/components/ui/web/<name>`.

Every component depends on the `agent-ui-setup` item, so the first `add`:

- installs `@kind-ui/agent-ui` and `@ui-sdk/core` at their pinned versions,
- adds `@import "@kind-ui/agent-ui/styles.css";` to the stylesheet `components.json` names, after its other imports,
- writes an `AGENTS.md` beside the components for coding agents.

Check the stylesheet reads like this afterwards:

```css
@import "tailwindcss";
@import "@kind-ui/agent-ui/styles.css";
```

Tailwind finds the copied files itself. If they live outside the app that builds them (a shared `packages/ui`), add `@source "<path to them>";` to that stylesheet.

## Framework notes

- **Next.js:** components build with Next's defaults, Turbopack included. Every React component file starts with `"use client"`, so a server component can render one; a page with state or handlers needs `"use client"` itself. Items added before 0.7.2 import their siblings as `./name.js`, which Next can't resolve: add them again, or build with `--webpack` and set `resolve.extensionAlias` to `{ ".js": [".ts", ".tsx", ".js"] }`.
- **Vue with server rendering outside Nuxt:** render the root inside `<Suspense>`, on the server and in the browser, as Nuxt pages already do. Without it, parts bind during hydration and an Avatar whose image loaded early, or a measured Terminal, won't match its server markup:

  ```ts
  import { createSSRApp, h, Suspense } from "vue";
  import App from "./App.vue";

  export const createApp = () => createSSRApp({ render: () => h(Suspense, null, { default: () => h(App) }) });
  ```

- **Svelte:** components are folders; import their `index.js`. Pass state into snippets by name.
- **Solid:** use Solid 2 (`solid-js` and `@solidjs/web` 2.x), not Solid 1's `solid-js/web`.
- **Web Components:** each item registers `kind-<name>` elements in light DOM. Set objects as properties, plain values as attributes, and listen for the events the component page lists. A callback whose presence offers an action takes a `can-<action>` attribute instead (`can-regenerate`).

## Without the registry

The npm package alone has the primitives, types, adapter and styles, not the styled components:

```bash
npm install @kind-ui/agent-ui @ui-sdk/core
```

| Entry | Contents |
| --- | --- |
| `@kind-ui/agent-ui` | Types: `Message`, `Part`, `Step`, `ToolCall`, `Approval`, `Thread`, … |
| `@kind-ui/agent-ui/core` | The primitives, the Markdown engine, the motion helper and date helpers |
| `@kind-ui/agent-ui/adapters/ai-sdk` | AI SDK message mapping ([ai-sdk.md](ai-sdk.md)) |
| `@kind-ui/agent-ui/styles.css` | Component styles and theme tokens |
