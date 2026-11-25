---
name: agent-ui
description: Builds AI chat and agent interfaces with Agent UI (@kind-ui/agent-ui) in React, Vue, Svelte, Solid or Web Components. Covers choosing from its 56 components (conversation, message, composer and its controls, tool calls, approvals, reasoning, plans, developer output, thread list and sidebar), installing them from the @kind-ui shadcn registry, composing a chat, mapping AI SDK UIMessages with its adapter, exposing the page to agents with createAgent, asking a person before risky actions, and theming with its tokens. Use whenever a project has @kind-ui/agent-ui or @kind-ui components installed, or the user wants an AI chat, agent or tool-approval UI.
---

# Build with Agent UI

Agent UI is the parts of an AI interface: a conversation, messages, streaming Markdown, a composer, tool calls, reasoning, plans, approvals and what an agent hands back. You copy each styled component into the app with the shadcn CLI, and it imports its behavior from the `@kind-ui/agent-ui` package. It's built on [UI SDK](https://ui-sdk.dev/docs), so focus, keys, announcements and ARIA come with it, and an agent can read and use the same component a person sees.

## Read first

- `node_modules/@kind-ui/agent-ui/README.md`: the entries, the AI SDK adapter's mapping and the theme tokens, for the installed version.
- The component files the registry copied, usually `components/ui/<name>.tsx` (Vue `ui/vue/`, Svelte `ui/svelte/<name>/`, Solid `ui/solid/`, Web Components `ui/web/`), and the `AGENTS.md` beside them. Their exports are the parts you compose.
- `node_modules/@kind-ui/agent-ui/dist/core/<name>/<name>.d.ts` for a component's options (`<Name>Options`), with what each one does and its default. Dictation's folder is `dictation-button/`, Markdown's `markdown-view/`.
- The docs: `https://kindui.dev/docs/agent-ui/llms.txt` lists every page with the URL of its Markdown (a component's is `https://kindui.dev/llms.mdx/docs/agent-ui/components/<name>.md`). Read only the pages you need; each has a **Composition** tree of its parts and an **Agent** section.
- If the ui-sdk skill is installed (`node_modules/@ui-sdk/core/skills/ui-sdk/SKILL.md`), follow it for anything you build that Agent UI doesn't ship.

## Pick what you need

1. **Choose components:** [references/components.md](references/components.md) lists all 56 by job, with when to use each.
2. **Install them:** [references/install.md](references/install.md): the framework layer, `components.json`, `npx shadcn@latest add @kind-ui/<name>` and version floors.
3. **Compose the interface:** [references/compose.md](references/compose.md): a chat with a composer, tool calls with approval, the composer's controls and the sidebar shell.
4. **Connect the AI SDK:** [references/ai-sdk.md](references/ai-sdk.md): `fromUIMessages`, parts, tool states and streaming.
5. **Expose it to agents:** [references/agents.md](references/agents.md): `createAgent`, the `snapshot`, `act` and `query` tools (with `agentTools` for a model and `registerTools` for WebMCP), passing `signal` from the chat's Stop, and `data-agent-confirm`.
6. **Ask before risky actions:** [references/approvals.md](references/approvals.md): Tool approval, Confirmation, Plan, Approval Mode.
7. **Style it:** [references/design.md](references/design.md): tokens, shared controls, focus rings and what not to add.

A chat usually needs 1 to 4. Do 5 and 6 whenever the app lets an agent act on the page or a tool can change something.

## Rules for every task

- **Install, don't rewrite.** Add components with the shadcn CLI and compose their exported parts. Don't hand-write a component Agent UI ships, and don't rewrite a copied file's behavior.
- **Never hand-roll focus, keys or ARIA.** No `role=`, `tabIndex`, `onKeyDown` or `aria-*` state on a part to make it work: the component already does it. A missing behavior is a missing component or option; check [references/components.md](references/components.md) first.
- **Name every component.** Pass `aria-label` or `label` where the component takes one (`<Conversation aria-label="Chat">`, `<Sidebar label="Chats">`). People with screen readers and agents both find components by name.
- **Key rows by id.** Conversation rows take a stable `value` and their `index`; render parts keyed by `part.id`.
- **Never decide for the person.** Don't call `onApprove`, approve a tool call, accept a plan or switch to a risky approval mode in code on the user's behalf, and don't set `agentConfirm={false}` or an `allow` that returns `true` for confirm questions. See [references/approvals.md](references/approvals.md).
- **Style with tokens.** Change `--kind-*` tokens, not the copied components' classes. No focus ring on text fields, rings only for keyboard focus, and no sparkle icons anywhere.
- **Same props in every layer.** Vue, Svelte and Solid take React's part names and options, with controlled props spelled as each framework expects (`v-model:open`, `bind:open`, `open` with `onOpenChange`).

## When you're done

1. Typecheck the app (`npx tsc --noEmit -p <app config>`, `vue-tsc` or `svelte-check`).
2. Open it in a browser: send a message, stop one, approve and deny a tool call with the keyboard, and check light and dark.
3. If the app uses `createAgent`, read `agent.snapshot()` and check each component a person acts on is listed once, by a name a person would use. Content with no role (Markdown) and UI SDK parts inside a component (a scroll area, the composer's text and file inputs) are listed too, some unnamed; that's expected.
4. Report what you ran, what you couldn't check, and anything these references got wrong.
