---
"@kind-ui/agent-ui": patch
---

Text fields never show a focus ring, even when a page's own stylesheet sets a global `:focus-visible` outline: the composer's editor, the search fields, Thread List's rename field, Share Dialog's link and the reason boxes now keep only their caret. In forced colors they show where focus is, as Tailwind's `outline-hidden` does.
