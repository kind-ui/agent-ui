---
"@kind-ui/agent-ui": patch
---

Registry items now import their sibling files without an extension (`./markdown` rather than `./markdown.js`), so a default Next.js app built with Turbopack can build components such as `composer`, `tool` and `markdown` once installed. The npm package is unchanged.
