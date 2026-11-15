# Registry

The styled React and Web Components ship as copy-in shadcn registry items (spec §9.2), served from `https://kindui.dev/r/` under the shared `@kind-ui` namespace (spec §9.6).

| File | Role |
| --- | --- |
| `catalog.mjs` | Every item: `<component>` (React), `<component>-web` (Web Components), hidden `internal-<name>` (with `-web` twins) and `agent-ui-setup` |
| `agent-ui-setup/AGENTS.md` | The note `agent-ui-setup` writes beside the components for coding agents |
| `consumers/react.tsx`, `consumers/web.ts` | The entries `check:registry-consumers` builds and renders every component with |

`npm run build:registry` (`scripts/build-registry.mjs`) checks the catalog, writes the shadcn `registry.json` to `artifacts/registry/`, and runs the pinned shadcn CLI's `registry validate` and `build`, writing `artifacts/registry/r/{registry.json,<name>.json}`. Item files are the render files themselves, by repository path, and the build fails when a payload's content differs from its source.

`npm run check:registry-consumers` (`scripts/check-registry-consumers.mjs`) needs the tarball from `npm run check:package`. It checks the built registry's integrity, then serves the registry and the tarball (as the `@kind-ui` npm scope) on `127.0.0.1:4320`, runs `shadcn add @kind-ui/<item>` for every visible item in a clean Vite React and a clean Vite Web Components project, builds and renders them in Chromium, and writes `artifacts/registry/consumer-evidence.json`.

## Installing

```json
{
  "registries": {
    "@kind-ui": "https://kindui.dev/r/{name}.json"
  }
}
```

With that in `components.json`, `npx shadcn@latest add @kind-ui/<name>` installs an item, for example `@kind-ui/composer` or `@kind-ui/composer-web`. Every component depends on `agent-ui-setup`, which installs `@kind-ui/agent-ui`, adds `@import "@kind-ui/agent-ui/styles.css";` to the stylesheet in `components.json`, and writes `AGENTS.md` into the `ui` directory.
