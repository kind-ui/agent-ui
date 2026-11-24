# Agent UI starter blocks: design

Status: proposed 2026-11-24, for review in the plan PR. Nothing is built yet.

## 1. What and why

A starter block is a shadcn `registry:block` that installs one complete, working agent screen with one command:

```bash
npx shadcn@latest add @kind-ui/coding-agent-starter
```

It ships the page, a sample data layer that runs with no API key, and an AI SDK route that runs with one. Each block's docs page shows it live, with an install command and an **Open in v0** link.

The components exist (56, in five layers). What a person can't see today is how they fit into a screen, and that's the question someone evaluating the library asks first. Three scripted showcases answer it now, as demos nobody installs. A block answers it as code they keep.

**Verdict: worth doing if blocks stay thin.** A block is composition plus a sample data layer, nothing else:

- no new component, no new primitive, no new token and no stylesheet;
- page layout only through Tailwind layout utilities (`grid`, `flex`, `gap-*`, `h-dvh`, `min-h-0`, `overflow-hidden`) whose values come from the existing `--kind-*` tokens where a value is needed;
- if a block needs a look or a behavior that isn't there, that's a component gap for a wave. The block waits or leaves it out; it never builds it inline.

`docs/design-principles.md` "When not to add" says pages and shells are the host's. A block isn't a component, so it doesn't break that rule: it's sample host code, copied once and then owned by the person who installed it. That's also why it can't grow into a framework: nothing in the package depends on it.

## 2. Scope

| Block | When | Composition |
| --- | --- | --- |
| `coding-agent-starter` | now | Conversation with Messages and streaming Markdown; Reasoning; Tool calls, one waiting on approval (Confirmation); `run_command` output in a Terminal; `run_tests` output in Test Results (failures open to their Stack Trace); `edit_files` output in a File Tree of changed files; Composer with Model Control, Approval Mode and Context Meter. |
| `general-agent-starter` | now | Sidebar with Thread List and Thread Search; Conversation with Day Separators, Messages and streaming Markdown; Composer with Attachments, Model Control and Approval Mode; Share Dialog; Connection Status. |
| `deep-research-starter` | after Wave 8 | Needs Wave 8's research report, web search results and link previews. |

**Deep research waits. Agreed.** With today's parts (Sources, Inline Citation, Plan, Task, Question, Document) it would be the general agent with citations and a plan card: nothing a person couldn't get from the two blocks above plus two component pages. Once Wave 8 lands, its block is a new task in a later plan; this spec reserves the name and nothing else.

**Components no block uses** (Transcript, Generated Image, Selection, Action, Question, Feedback, Suggestion, Checkpoint, Subagent, Queue, Plan, Guardrail Notice, Dictation, Uploader and others) stay on their own pages. A block isn't a catalog. Adding them to make a block "complete" is exactly the bloat §1 rules out.

## 3. Decisions

### D1. The showcases go

The three showcases (`showcase/{agent-activity,human-input,developer-output}`, 703 lines of examples) are scripted runs that nobody installs, and they overlap the blocks. Once both blocks land, the Showcase section, its pages, its examples and its `docs.test.mjs` section are removed, and **Blocks** takes its place in the nav. A block's docs page is its live preview: no separate showcase, no separate preview route.

What's lost is a "together" view of the components no block uses. Each still has its own page with examples, which is where someone looking for Transcript or Feedback goes anyway.

### D2. React only, and no other layer for now

Blocks ship for React (Next.js App Router) only. No Vue, Svelte, Solid or Web Components blocks now, and none planned:

- v0 runs React and Next only, so a second layer gets no v0 link.
- A block is app code: its route and page follow the meta-framework (Nuxt, SvelteKit, SolidStart). Each layer would need its own meta-framework consumer check and its own route conventions, about four times the upkeep for code that changes whenever a component's options do.
- The components already translate part for part, and the AI SDK chat guide already says so.

Revisit only when people ask for one layer's block, and then add that one.

### D3. Data: a mock transport by default, a real route with one line

Each block uses the AI SDK's `useChat` with a `transport`. Both data paths produce the same `UIMessage`s, so the page has one code path from messages to components.

- **Mock (default).** `mock.ts` exports `createMockTransport(options?: { delayMs?: number }): ChatTransport<UIMessage>` and the block's sample data (`initialMessages`, and for the general agent `threads`). `sendMessages` reads the last message and returns `simulateReadableStream({ chunks, chunkDelayInMs: delayMs })` (from `ai`) of `UIMessageChunk`s from a short script: reasoning, tool input, `tool-approval-request`, tool output, text. `reconnectToStream` returns `null`. A request whose last assistant message holds an approval response streams the continuation, so approving or denying works exactly as with a server (`sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses`). `delayMs` defaults to 30; tests pass 0. No timers outside the stream, no network.
- **Real.** `route.ts` is the AI SDK route: `streamText` with a gateway model id string, the block's tools defined with `tool()` and zod schemas (`needsApproval: true` on `run_command`), `stopWhen: stepCountIs(8)`, `toUIMessageStreamResponse()`. The tools' `execute` return sample output and are marked as the place to plug in real work: the block never runs a shell command for anyone.
- **The one change.** The page reads `const transport = createMockTransport();`. To go live, replace that line with `const transport = new DefaultChatTransport({ api: "/api/coding-agent" });` and set `AI_GATEWAY_API_KEY` (or swap the model string for any provider's model). The docs page shows that diff. No env flag: a flag that silently falls back to the mock would hide a misconfigured key.
- **Tool to component.** The page maps tool names to components: `run_command` → Tool whose content is a Terminal; `run_tests` → Tool whose content is Test Results; `edit_files` → a File Tree; any other tool → the default Tool. Tool's `ToolContent` takes children, so no component changes.
- **Host state in the general agent** (threads, the share link, the connection) is in-memory sample state in `mock.ts`, marked "replace with your database". Connection Status follows the window's `online`/`offline` events. The block ships no persistence and no auth.

### D4. Files and where they land

Source of truth: `apps/docs/examples/blocks/<block>/`. kindui.dev already pulls `apps/docs/examples` at each release tag, so the docs previews and the registry files are the same files, and the docs' portability test covers them.

| Source | Registry file type | Installs to |
| --- | --- | --- |
| `page.tsx` (server component, renders the block full height) | `registry:page` | `app/<block>/page.tsx` (`coding-agent`, `general-agent`) |
| `<block>.tsx` (`"use client"`, the composition) | `registry:component` | `@components/blocks/<block>/<block>.tsx` |
| `mock.ts` | `registry:lib` | `@components/blocks/<block>/mock.ts` |
| `route.ts` | `registry:page` | `app/api/<block>/route.ts` |

The route path is `/api/coding-agent` (`/api/general-agent`), not `/api/chat`, so a block never overwrites an app's existing chat route. `page.tsx` imports the composition as `@/components/blocks/<block>/<block>`; the docs app maps that alias to `examples/blocks/*`. Components import as `@/components/ui/<name>`, as everywhere else.

### D5. Registry shape

`registry/catalog.mjs` gains a `blocks` record beside `components`:

```js
const blocks = {
  "coding-agent-starter": {
    title: "Coding agent starter",
    description: "…",
    folder: "coding-agent",
    uses: ["conversation", "message", "markdown", "reasoning", "tool", "terminal", "test-results", "file-tree", "composer", "model-control", "approval-mode", "context-meter"],
  },
  "general-agent-starter": { … folder: "general-agent", uses: [ … ] },
};
```

Each becomes an item:

- `name` the key, `type: "registry:block"`, `title`, `description`;
- `registryDependencies`: `@kind-ui/agent-ui-setup` and `@kind-ui/<use>` for each `uses` entry (React items, no suffix);
- `dependencies`: `@kind-ui/agent-ui@<version>`, `@ui-sdk/core`, `@ui-sdk/react` (as the components), plus `ai@7.0.173`, `@ai-sdk/react@4.0.177` (the release whose `ai` dependency is exactly `7.0.173`) and `zod@4.6.7`;
- `files` as D4;
- `categories: ["block"]`, `meta: { layer: "react", block: true }` (the docs toolbar builds the v0 URL from the name, so the item doesn't carry it).

Blocks are visible items: `shadcn search @kind-ui` lists them. They're kept out of the lists that mean "a component" (the React item vs `src/react/*.tsx` comparison, install tabs, parity, layer manifests) by `meta.block`.

### D6. v0: a second, flattened payload per block

**What v0 takes**, from shadcn's "Open in v0" docs (ui.shadcn.com/docs/registry/open-in-v0): a public registry item URL opened as `https://v0.dev/chat/api/open?url=<item URL>`. It "does not support `cssVars`, `css`, `envVars`, namespaced registries, or advanced authentication methods". The example it links is a `registry:block`.

Our items use two of those: every component depends on `@kind-ui/agent-ui-setup` (namespaced), and setup adds the stylesheet through `css`. So the CLI item can't be what v0 opens.

**Decision:** `scripts/build-registry.mjs` writes a second payload per block, `r/v0/<block>.json`, from the same sources:

- every file of the block and of its `registryDependencies`, transitively (components and their internals, with `kind-class.ts`), inlined with the same targets the CLI writes (`@ui/<name>.tsx`, `@ui/internal/<name>.tsx`);
- `registryDependencies: []`, no `css`, no `cssVars`, no `envVars`;
- `dependencies`: the union of every inlined item's;
- the styles through code instead of `css`: the v0 payload's `page.tsx` starts with `import "@kind-ui/agent-ui/styles.css";` (the build prepends that one line; the CLI page doesn't have it, since setup already adds the stylesheet import and a second would compile the styles twice);
- the same `name`, `type`, `title` and `description`.

The docs button links `https://v0.dev/chat/api/open?url=https://kindui.dev/r/v0/<block>.json`. A test checks every v0 payload against these rules and the shadcn item schema, and that it covers the transitive files exactly.

**Prototype (2026-11-24, throwaway, nothing committed):**

1. `https://v0.dev/chat/api/open?url=https://kindui.dev/r/step.json` (and the `v0.app` host) returns `307` to `/chat/open?url=<encoded>`, which requires a Vercel sign-in. No account was available, so the import into v0 itself **was not observed**. Task 1 has a manual step for a maintainer who is signed in.
2. `https://kindui.dev/r/step.json` is public (`200`, `application/json`, `access-control-allow-origin: *`), so v0 can fetch our items.
3. `@kind-ui` is in shadcn's registry index (`ui.shadcn.com/r/registries.json`), so `npx shadcn@4.23.0 add https://kindui.dev/r/step.json` into a fresh Next 15 app with no `registries` config installed `step.tsx`, `AGENTS.md`, the three dependencies and the stylesheet import. (It wrote `@kind-ui/agent-ui@0.7.0` as `^0.7.0`.) That's the CLI path; v0's docs still say namespaces aren't supported there.
4. The v0 styling path: with the stylesheet import removed from `globals.css` and `import "@kind-ui/agent-ui/styles.css"` at the top of `app/page.tsx` instead, `next build` (Next 15.5, Tailwind 4.1, `@tailwindcss/postcss`) compiled Step's rules and emitted the tokens it uses (`--kind-color-fg`, `--kind-radius`, `--kind-duration-base`, `--kind-focus-ring`, `--kind-text-md`, each defined once). So a payload without `css` still gets our look in a standard Next + Tailwind 4 app.

Not verified: whether v0's generated project uses Tailwind 4 with `@tailwindcss/postcss` (the path above needs it), and how v0 handles a `registry:page` target. Task 1's manual step records both; if v0 rejects the page target, the payload moves the page into `registry:component` and v0 picks its own route.

### D7. Quality bar

The same bar as a component: `docs/design-principles.md`, the focus rules (rings only under `:focus-visible`, none on text fields), light and dark, 390 px, the streaming checklist in `AGENTS.md`. Screenshots are judged against the block's composition (the table in §2 and the layout in each task), never against outside products.

- **A flow per block,** `tests/browser/blocks/<block>.flow.ts`, exports `run(page: Page): Promise<void>`: the block's main path through the mock transport with `delayMs: 0`.
- **Fixture spec** `tests/browser/blocks/<block>.spec.ts` runs the flow on the React fixture (`?c=<block>`, one case file per block so parallel tasks don't share one), at 1280 and 390 px, light and dark, with axe and the forced-colors check. It joins `test:browser` and `affected-specs`.
- **Installed check:** `check:registry-consumers` gains a Next consumer, React only, blocks only: it runs `shadcn add @kind-ui/<block>` for each block against the locally served registry, `next build`s (which type-checks the route and page), `next start`s, and runs the same flow on `/coding-agent` and `/general-agent`. That's the proof that one command gives a working app.
- **Budgets:** none of their own. The components' budgets already hold, and a block adds no rendering of its own.

### D8. Docs and kindui.dev

- A **Blocks** section replaces Showcase in `apps/docs/content/docs/meta.json`: `blocks/index.mdx` (what a block is, the thin rule, the mock and real paths) and one page per block.
- A block page: a one-line summary; a toolbar with the install command (copy), **Open in v0** (a plain link, `target="_blank"`, `rel="noreferrer"`, text only, no third-party logo) and **View code**; the live block in an `<Example>` 720 px tall that renders the composition with the mock transport; `<ExampleCode>` tabs of its four files; "Go live" with the one-line diff and the env var; "What's inside" listing each component, linked to its page.
- The toolbar is one docs component, `apps/docs/components/block-toolbar.tsx`, taking `name`. It reads the v0 URL from `NEXT_PUBLIC_REGISTRY_ORIGIN` (default `https://kindui.dev`), so the docs never hardcode a host other than through the existing `/r/` rule.
- **kindui.dev** pulls `content` and `examples` at a release tag, so the Blocks pages and the block sources arrive with no change there. It already serves `/r/`; it serves `/r/v0/` from the same registry build. The registry's `pack-site`/`KINDUI_HOSTING` steps are unchanged except that the built `r/v0/` folder is included.

### D9. Slop check: what's cut

| Idea | Cut? | Why |
| --- | --- | --- |
| Blocks for Vue, Svelte, Solid, Web Components | **Cut** | D2: four times the upkeep, no v0. |
| A deep research block now | **Deferred** | Thin without Wave 8. |
| A full-screen preview route in the docs app | **Cut** | kindui.dev doesn't pull `app/`, and the docs Example plus v0 cover it; 390 px is tested in Playwright. |
| A scripted "Replay" player like the showcases | **Cut** | The mock streams when a person sends; reload restarts. |
| Thread persistence, auth, a database adapter | **Cut** | Host's job; the in-memory store says where to plug in. |
| A provider or model picker that changes the route | **Cut** | Model Control shows the choice; the route reads one model string. |
| Keeping the showcases beside the blocks | **Cut** | D1. |
| A v0 payload | **Kept** | The only way v0 opens a block (D6). Generated, not hand-written. |
| The Next consumer check | **Kept** | The only proof the installed block builds and runs in the framework it targets. |

## 4. Risks

- **v0 behavior not yet observed** (D6). If v0 can't render a payload, the blocks still ship for the CLI and the docs; the v0 link is dropped from the toolbar until it works. Task 1 finds this out before any block is written.
- **Copied code drifts.** A block uses component options that later change. Mitigation: the Next consumer check and the fixture spec run on every PR that touches a used component (`affected-specs` follows imports into `examples/blocks`), and blocks are versioned with the package.
- **AI SDK churn.** The route and transport pin `ai` and `@ai-sdk/react` exactly; upgrading them is its own PR, as UI SDK upgrades are.
