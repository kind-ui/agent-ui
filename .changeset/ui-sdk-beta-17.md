---
"@kind-ui/agent-ui": minor
---

Upgrade every `@ui-sdk/*` dependency from `0.1.0-beta.1` to `0.1.0-beta.17`. `@ui-sdk/solid` now needs stable `solid-js` and `@solidjs/web` 2.0.

UI SDK's agent tools are much faster: an agent sends a whole task in one `act` call. The Agents page and the `agent-ui` skill now show how to wire up `snapshot`, `act` and `query`:

- `agentTools` for a model;
- `registerTools` for WebMCP;
- an `act` `signal` that the Composer's Stop aborts.

Agent snapshots are also leaner and safer:

- Attachments and Uploader let an agent name a file by its name or id, and refuse any other. Before, any step that named a component by its label failed on a page that rendered either one.
- Sidebar no longer copies the whole panel's text into its snapshot entry. Its panel part's `data-slot` is now `kind-sidebar-heading`.
- Checkpoint's dialog **Restore** and Thread List's dialog **Delete** carry `data-agent-confirm` only while their dialog is open. In Web Components, a closed mark would otherwise ask the person before every step on the component.
