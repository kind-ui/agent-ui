---
name: fumadocs
description: Edits the agent-ui docs site in apps/docs (Fumadocs on Next.js, static export), including adding or updating a component page, its live example and its generated API tables, wiring Fumadocs features with its CLIs, and upgrading Fumadocs. Use whenever you touch apps/docs or a component's public options. For the words, use the write-docs skill.
---

# Fumadocs

`apps/docs` is a Fumadocs app on Next.js with `output: "export"`, scaffolded with `create-fumadocs-app` (`+next+fuma-docs-mdx+static`, Orama search). Fumadocs changes often, so check its docs before you write anything from memory:

- `https://www.fumadocs.dev/llms.txt` lists every page; `https://www.fumadocs.dev/docs/next/llms.txt` the Next.js ones. Add `.md` to any docs URL for its Markdown.
- The Fumadocs MCP server (`.mcp.json`, `.vscode/mcp.json`): `list_pages`, `get_page`, `search`.

## Layout

| Path | Holds |
| --- | --- |
| `content/docs/**/*.mdx`, `meta.json` | Pages and the sidebar order |
| `examples/<name>/basic.tsx` | Each component's live example, in React |
| `lib/source.ts` | The `fumadocs-mdx/macro` collection, the loader and the `llms()` routes |
| `source.config.ts` | Global MDX options: `remarkAutoTypeTable` from `fumadocs-typescript` |
| `components/mdx.tsx`, `components/example.tsx` | MDX components, and the Preview / Code frame with its `caption` |
| `cli.json` | `@fumadocs/cli` config |

`@/components/ui/*` resolves to `packages/agent-ui/src/react/*`, the files the registry ships, so examples import them the way a shadcn consumer does. Those files import `./name.js` for `name.tsx`, which Turbopack can't resolve, so the site runs on webpack (`--webpack`) with `resolve.extensionAlias`.

## Add or update a component page

Copy `content/docs/components/step.mdx` and its example, and write the words with the [`write-docs`](../write-docs/SKILL.md) skill. The page is: frontmatter `title` and `description` → an opening paragraph → `<Example caption="…">` holding the live component and `<include cwd lang="tsx">` of the same file → `## Installation` (`bash tab="React"` and `tab="Web Components"` blocks) → `## Composition` when it has parts → `## Usage` → `## API Reference` → `### Agent` → a `<Caption>` with the "Runs in React and Web Components." line. Add the page to `components/meta.json`. `npm run test:scripts` checks the sections.

- **Examples** are React only. The render files are client modules already, so an example starts with `"use client"` only when it holds state or handlers; the others stay server components.
- **API tables** are `<auto-type-table path="…" name="…" />`, generated at build time from the core `<Name>Options`, and `type='Pick<NameApi, "action" | …>'` for the agent actions. `path` is relative to the MDX file. Write the docs as TSDoc on those types (`@default`, `@internal` to hide a field). A wrong `path` or `name` fails the build. `source.config.ts` spells out string unions and shows short types as written.
- Web Components share the props: each is a kebab-case attribute and each callback a lowercase event, which the page's last line says.
- Never name an `internal-` registry item on a page.

## Use the CLIs, not hand-written code

Run them from `apps/docs` with `npx @fumadocs/cli@<pinned>`:

- `feature <id>` wires a feature (`llms`, `search`, `og`, `feedback`, …). `llms` is already wired.
- `add <component>` installs a Fumadocs UI component's source into `components/fumadocs/`.
- `customise` swaps a layout part for an editable copy.

Prefer Fumadocs UI's own components (`fumadocs-ui/components/*`) and MDX features (`<include>`, `tab=` code blocks, `Callout`, `Cards`) over custom ones.

## Static export

A static build has no server. The search index is exported from `app/api/search/route.ts` and searched in the browser. Page Markdown is served as files under `/llms.mdx/…`, so `llms()` uses `renderUrl` and page actions link there. There's no MCP server, Ask AI or `proxy.ts`. `NEXT_PUBLIC_DOCS_ORIGIN` and `NEXT_PUBLIC_DOCS_BASE_PATH` set where the site is hosted; anything fetched by hand (the Markdown URL, the search index) adds `basePath`.

## Check it

`npm run build:docs` builds the package, then the site (Next.js type-checks it). `npm run dev:docs` serves it with hot reload.

## Upgrade

Bump `fumadocs-core`, `fumadocs-ui`, `fumadocs-mdx`, `fumadocs-typescript` and `@fumadocs/cli` together, to the versions one release pins, and read `https://www.fumadocs.dev/docs/next/upgrade.md` first. Pins are exact.
