---
"@kind-ui/agent-ui": minor
---

Wave 3: Confirmation, Question, Checkpoint, Model Selector, Reasoning Effort, Suggestion, Context Meter, Feedback, Notice and Guardrail Notice, in React and Web Components, with their `@kind-ui` registry items.

- Tool asks for approval through Confirmation: pass `onApprove` and `onDeny` (on Web Components, the `can-approve` and `can-deny` attributes and the `approve` and `deny` events) to offer **Approve** and **Deny**, and `approvalReason` for a reason box. Once the host records the decision, the tool keeps the outcome, like "Approved", not the buttons. Its approval part now sits after the content, so it shows while the tool is closed.

  **Breaking:** `ToolState.approval` is now the whole `Approval`, not its state, and `ToolState.approvalLabel` is gone (use `approvalLabel(state.approval)`). `ToolApproval` renders a Confirmation, and a render function passed to it gets the Confirmation's props, whose `label` reads "Run <name>?".
- Confirmation, Question, Checkpoint and Feedback lock on `createPendingAction` (exported since 0.2.1, and shared with Plan's Accept and Subagent's Stop): a press disables the choices at once, a rejection makes them available again with an error, and a late result for a replaced request changes nothing.
- Wave 3 callbacks get a `details` whose `source` says who acted, like `"mouse"`, `"keyboard"` or `"agent"`, after the value when they have one: `onApprove(decision, details)`, `onRestore(details)`. Notice's `onDismiss` takes no arguments.
- New `--kind-color-on-warning` token for marks on the warning fill, and `info` and `warning` status marks.
- Step, Task, Plan and Chain of Thought rows no longer play their transitions when the page loads on Web Components.
- The size check also budgets single exports of `./core`, so a component that stops tree-shaking fails it.
