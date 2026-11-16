---
"@kind-ui/agent-ui": minor
---

Wave 2: Status, Reasoning, Tool, Chain of Thought, Task, Plan, Subagent and Queue, in React and Web Components, with their `@kind-ui` registry items.

- Reasoning, Tool, Chain of Thought, Task, Plan and Subagent share the Step base, so they open, close, announce and animate the way Step does.
- Queue reorders items with the pointer or the keyboard. The host owns the order: `onReorder(id, details)` gets the new position as `details.index` (on Web Components, the `reorder` event's `detail.value` and `detail.index`).
- Subagent's avatar shows `avatarInitials(name)` when it has no image.
- Attachments and Uploader animate removed items out, and focus moves to a neighbor while they leave.

**Breaking:** Step's `title` option is now `label` (the `label` attribute on Web Components), because `title` shows the browser's tooltip on a custom element. It still names the step in announcements.
