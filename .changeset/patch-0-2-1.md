---
"@kind-ui/agent-ui": patch
---

- Every React render file starts with `"use client"`, so Next.js App Router server components can import them.
- The composer's attachments area expands and collapses instead of jumping open and shut.
- Removing the last attachment returns focus to the editor. Attachments takes a `focusFallback` option for where focus goes when no chip is left.
- Motion helper springs start at rest, so a reversed `expand` no longer overshoots.
