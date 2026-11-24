# Agents

Every Agent UI component registers with UI SDK's agent bridge, so an agent (an in-page assistant, a browser's agent through WebMCP, or a test) can read the components a person sees and use them. Agent UI ships no bridge of its own.

## Create the bridge

Create it once, before the page renders, from the layer's UI SDK package:

```ts
import { createAgent } from "@ui-sdk/react/agent"; // or @ui-sdk/web/agent, /vue/agent, /svelte/agent, /solid/agent

export const agent = createAgent({
  allow: ({ component, action, confirm }) => {
    if (confirm) return window.confirm(confirm);
    return true;
  },
});
```

In React, create it at module level (it's safe to import during server rendering) or in a `useState` initializer, not on every render. To reach it from tests or the console, assign it in an effect: `useEffect(() => { window.agent = agent; }, [])`.

## Read and act

```ts
const snapshot = agent.snapshot();
// [{ ref: "c11", component: "kind-confirmation", label: "Run delete_branch?", approvalState: "requested", actions: ["approve", "deny"] },
//  { ref: "c12", component: "kind-tool", label: "delete_branch", status: "awaiting-input", actions: ["expand", "collapse", "copyInput", "press"] }, …]

await agent.act({ steps: [{ ref: "Read the logs", action: "expand" }] });
```

- Each component is listed once, by its accessible name, with its state and the actions it offers right now. An agent names a component by `ref` or by label. The list also holds content without a role (each Markdown, unnamed) and UI SDK parts a component composes (the composer's `token-input` and `file-input`, a code block's `scroll-area`).
- Some actions are listed only while they can run: a Message offers `regenerate` only once it settled and you passed `onRegenerate`.
- The bridge adds a generic `press` to some components for buttons no action covers (a Tool's header); a component whose buttons all have actions, like Confirmation, lists only those.
- Each component page's **Agent** section lists what it reads and offers. The UI SDK docs for the bridge, WebMCP and `allow` are `node_modules/@ui-sdk/<layer>/docs/agents.md`.

## Agents take the same path as people

An agent's action runs the code a person's press runs: your callbacks get the same arguments with `details.source === "agent"`, a controlled component can refuse the change, and a pending action locks for agents and people alike. So:

- **Don't write agent-only handlers or a second state path.** Give the component its normal props and callbacks; the agent gets the same behavior.
- **Name what the agent should find.** `aria-label` or `label` on each component is its snapshot label. Two components with the same name are hard to tell apart.
- **Branch on `details.source` only to record who did it**, never to skip a check a person would get.
- **Don't hide a component from people to show it to agents**, or the reverse. `data-agent-hidden` is for UI SDK parts inside a component, which Agent UI already sets.

## Ask the person first

Some actions need a person even when an agent asks: sending from a Composer, accepting a Plan, stopping a Subagent, answering a Question, restoring a Checkpoint, changing an Approval Mode, starting Dictation, creating a share link, deleting a thread, and every Confirmation or Tool approval. Those components render `data-agent-confirm`, and the bridge passes a `confirm` question to `allow` for each of their actions.

- Return the person's answer to `confirm` questions. Never return `true` for them unconditionally.
- Leave `agentConfirm` on (its default). Turn it off only when your app asks the person another way before the action runs.
- Confirmation and a Tool's approval always need a person; they have no `agentConfirm` option.

See [approvals.md](approvals.md) for the decisions themselves.

## Test it

```ts
const tool = agent.snapshot().find((entry) => entry.label === "delete_branch");
expect(tool?.actions).toContain("expand");
```

Read the snapshot after the page renders. Check each component appears once, with the name a person would use, and run each action through `agent.act` the way a person would press it.
