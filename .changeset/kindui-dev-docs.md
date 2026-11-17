---
"@kind-ui/agent-ui": patch
---

The docs link between pages and import their examples with relative paths, so kindui.dev can render them from the release tag, and the release's namespace check treats a kindui.dev registry that isn't served yet as empty.
