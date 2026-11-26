---
"@kind-ui/agent-ui": patch
---

Development builds no longer warn that a component's `agent.actions` names a method its api lacks (Conversation, Composer, Notice, Model Selector, Message, Tool and every other component with an action offered only while available). Conversation Search's `::highlight(kind-search)` and `::highlight(kind-search-current)` rules now come with the search instead of `styles.css`, so Tailwind before 4.3.5 (Next 16's starter) no longer warns that `highlight` isn't a valid pseudo-element. A page's own `::highlight()` rules still win.
