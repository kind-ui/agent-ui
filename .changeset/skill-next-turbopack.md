---
"@kind-ui/agent-ui": patch
---

The agent-ui skill no longer tells Next.js apps to build with webpack: since 0.7.2 the registry's components import their siblings without `.js`, so Turbopack builds them as they are. It keeps a one-line note for items added before 0.7.2.
