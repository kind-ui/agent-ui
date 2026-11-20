# Registry

The styled React, Web Components, Vue, Svelte and Solid components ship as copy-in shadcn registry items (spec §9.2), served from `https://kindui.dev/r/` under the shared `@kind-ui` namespace (spec §9.6).

| File | Role |
| --- | --- |
| `catalog.mjs` | Every item: `<component>` (React), `<component>-web` (Web Components), hidden `internal-<name>` (with `-web` twins) and `agent-ui-setup`, then the `-vue`, `-svelte` and `-solid` items each `layers/<layer>.mjs` lists |
| `layers/` | Which components and internals the Vue, Svelte and Solid layers ship |
| `agent-ui-setup/AGENTS.md` | The note `agent-ui-setup` writes beside the components for coding agents |
| `consumers/react.tsx`, `consumers/web.ts` | The entries `check:registry-consumers` builds and renders every component with |
| `consumers/{vue,svelte,solid}/` | The other layers' consumer apps: `main.<ext>` mounts each `items/<name>.<ext>` in a `data-item` section; a component's file lands with its manifest line |

`npm run build:registry` (`scripts/build-registry.mjs`) checks the catalog, writes the shadcn `registry.json` to `artifacts/registry/`, and runs the pinned shadcn CLI's `registry validate` and `build`, writing `artifacts/registry/r/{registry.json,<name>.json}`. Item files are the render files themselves, by repository path, and the build fails when a payload's content differs from its source.

`npm run check:registry-consumers` (`scripts/check-registry-consumers.mjs`) needs the tarball from `npm run check:package`. It checks the built registry's integrity, then serves the registry and the tarball (as the `@kind-ui` npm scope) on a free port of `127.0.0.1`, runs `shadcn add @kind-ui/<item>` for every visible item in a clean Vite project per layer (React, Web Components, and Vue, Svelte or Solid once its manifest lists a component; `KIND_LAYERS` narrows them), builds and renders them in Chromium, and writes `artifacts/registry/consumer-evidence.json`.

## Installing

```json
{
  "registries": {
    "@kind-ui": "https://kindui.dev/r/{name}.json"
  }
}
```

With that in `components.json`, `npx shadcn@latest add @kind-ui/<name>` installs an item, for example `@kind-ui/composer` or `@kind-ui/composer-web`. Every component depends on `agent-ui-setup`, which installs `@kind-ui/agent-ui`, adds `@import "@kind-ui/agent-ui/styles.css";` to the stylesheet in `components.json`, and writes `AGENTS.md` into the `ui` directory.

The same CLI installs the Vue, Svelte and Solid items into a Vite app of that framework: write the `components.json` by hand (`shadcn init` only scaffolds React projects), with `tsx: true`, `rsc: false`, a `tailwind.css` stylesheet and `aliases.ui` pointing at the components folder (`@/components/ui`, which the app's `tsconfig.json` `paths` resolve). Files land unchanged under `ui/vue/`, `ui/svelte/<name>/` and `ui/solid/`.
