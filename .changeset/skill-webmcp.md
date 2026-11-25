---
"@kind-ui/agent-ui": patch
---

The agent-ui skill's agents reference has a WebMCP section: `registerTools` with an `allow` that leaves `data-agent-confirm` steps to the person, calling the tools from the AI SDK with `createMCPClient` and its WebMCP transport, and what to do in a browser without WebMCP.
