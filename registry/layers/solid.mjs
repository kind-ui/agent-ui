// What the Solid layer ships and tests (framework layers plan D10). The registry catalog, the Playwright
// projects, `scripts/affected-specs.mjs`, the parity test and the docs tabs read it, so a component exists in
// this layer only once it is listed here.
export default {
  // Registry names of the visible components this layer renders, as in `registry/catalog.mjs`.
  components: [
    "step",

    "markdown",
    "code-block",
    "markdown-table",
    "conversation",
    "message",
    "composer",
    "attachments",
    "suggestion",
    "feedback",
    "confirmation",
    "question",
    "checkpoint",

    "picker",
    "settings-menu",
    "model-selector",
    "add-menu",
    "approval-mode",
    "model-control",
    "reasoning-effort",
    "context-bar",
    "context-meter",
    "dictation",

    "guardrail-notice",
    "loader",
    "notice",
    "status",
    "streaming-text",
    "thinking-indicator",
    "typing-indicator",
    "uploader",

    "reasoning",
    "tool",
    "chain-of-thought",
    "task",
    "plan",
    "subagent",
    "queue",

    "sources",
    "inline-citation",
    "document",
    "generated-image",
    "file-tree",
    "terminal",
    "stack-trace",
    "test-results",
    "transcript",
    "selection",
    "action",

    "thread-list",
    "thread-search",
    "sidebar",
    "day-separator",
    "connection-status",
    "share-dialog",
    "conversation-search",

    // Wave 7 markers (AGENTS.md "Wave 7 shared-file markers"): each task adds its components right below its own line.

    // wave-7-task-2: Composer steering and Queue's Send now

    // wave-7-task-3: Message delivery mark and retrying

    // wave-7-task-4: Terminal approval and Confirmation's Always allow

    // wave-7-task-5: Tool retry and retrying

    // wave-7-task-6: Diff

    // wave-7-task-7: Step Group

    // wave-7-task-8: Handoff

    // wave-7-task-10: Trace

    // wave-7-task-11: Run Timeline

    // wave-7-task-12: Job Progress

    // wave-7-task-13: Schedule Card

    // wave-7-task-14: Agent Card

    // wave-7-task-15: Usage Meter and Context Meter's breakdown
    "usage-meter",

    // wave-7-task-16: Quota Notice

    // wave-7-task-17: Activity Graph

    // wave-7-task-18: Thread List inbox

    // wave-7-task-19: Flow Graph
  ],
  // Internal wrapper names, without the `internal-` prefix.
  internals: [
    "avatar",
    "button",
    "collapsible",
    "command",
    "file-input",
    "menu",
    "progress",
    "scroll-area",
    "slider",
    "switch",
    "toggle",
    "token-input",
    "trigger-menu",

    "alert-dialog",
    "carousel",
    "checkbox",
    "radio",
    "textarea",
    "toolbar",
    "tooltip",

    "segmented-control",

    "tree",

    "drawer",
    "resizable",

    // Wave 7 markers (AGENTS.md "Wave 7 shared-file markers"): each task adds its internals right below its own line.

    // wave-7-task-2: Composer steering and Queue's Send now

    // wave-7-task-3: Message delivery mark and retrying

    // wave-7-task-4: Terminal approval and Confirmation's Always allow

    // wave-7-task-5: Tool retry and retrying

    // wave-7-task-6: Diff

    // wave-7-task-7: Step Group

    // wave-7-task-8: Handoff

    // wave-7-task-10: Trace

    // wave-7-task-11: Run Timeline

    // wave-7-task-12: Job Progress

    // wave-7-task-13: Schedule Card

    // wave-7-task-14: Agent Card

    // wave-7-task-15: Usage Meter and Context Meter's breakdown

    // wave-7-task-16: Quota Notice

    // wave-7-task-17: Activity Graph

    // wave-7-task-18: Thread List inbox

    // wave-7-task-19: Flow Graph
  ],
  // Spec files the layer's projects run, relative to `tests/browser/`.
  specs: [
    "wave-1/step.spec.ts",
    "wave-1/internal.spec.ts",
    "wave-1/focus-ring.spec.ts",
    "parity.spec.ts",
    "hydration.spec.ts",

    "wave-1/markdown.spec.ts",
    "wave-1/budgets.spec.ts",
    "wave-1/conversation.spec.ts",
    "wave-1/message.spec.ts",
    "wave-1/composer.spec.ts",
    "wave-3/suggestion.spec.ts",
    "wave-3/feedback.spec.ts",
    "wave-3/confirmation.spec.ts",
    "wave-3/question.spec.ts",
    "wave-3/checkpoint.spec.ts",

    "wave-5/picker.spec.ts",
    "wave-5/settings-menu.spec.ts",
    "wave-5/add-menu.spec.ts",
    "wave-5/approval-mode.spec.ts",
    "wave-5/model-control.spec.ts",
    "wave-5/context-bar.spec.ts",
    "wave-5/dictation.spec.ts",
    "wave-5/composed-events.spec.ts",
    "wave-3/reasoning-effort.spec.ts",
    "wave-3/context-meter.spec.ts",
    "wave-3/model-selector.spec.ts",

    "wave-1/indicators.spec.ts",
    "wave-1/uploader.spec.ts",
    "wave-2/status.spec.ts",
    "wave-3/notice.spec.ts",
    "wave-3/guardrail-notice.spec.ts",

    "wave-2/reasoning.spec.ts",
    "wave-2/tool.spec.ts",
    "wave-2/chain-of-thought.spec.ts",
    "wave-2/task.spec.ts",
    "wave-2/plan.spec.ts",
    "wave-2/subagent.spec.ts",
    "wave-2/queue.spec.ts",

    "wave-4/sources.spec.ts",
    "wave-4/inline-citation.spec.ts",
    "wave-4/document.spec.ts",
    "wave-4/generated-image.spec.ts",
    "wave-4/file-tree.spec.ts",
    "wave-4/terminal.spec.ts",
    "wave-4/stack-trace.spec.ts",
    "wave-4/test-results.spec.ts",
    "wave-4/transcript.spec.ts",
    "wave-4/selection.spec.ts",
    "wave-4/action.spec.ts",

    "wave-6/thread-list.spec.ts",
    "wave-6/thread-search.spec.ts",
    "wave-6/sidebar.spec.ts",
    "wave-6/day-separator.spec.ts",
    "wave-6/connection-status.spec.ts",
    "wave-6/share-dialog.spec.ts",
    "wave-6/conversation-search.spec.ts",

    "wave-1/agent.spec.ts",
    "wave-2/agent.spec.ts",
    "wave-3/agent.spec.ts",
    "wave-4/agent.spec.ts",
    "wave-5/agent.spec.ts",
    "wave-6/agent.spec.ts",
    "wave-5/aria-patterns.spec.ts",
    "wave-6/aria-patterns.spec.ts",
    "wave-5/composer-compact.spec.ts",
    "wave-1/controls.spec.ts",
    "wave-1/motion.spec.ts",
    "wave-1/theme.spec.ts",
    "wave-1/status-mark.spec.ts",
    "wave-1/forced-colors.spec.ts",

    // Wave 7 markers (AGENTS.md "Wave 7 shared-file markers"): each task adds its specs right below its own line.

    // wave-7-task-2: Composer steering and Queue's Send now

    // wave-7-task-3: Message delivery mark and retrying

    // wave-7-task-4: Terminal approval and Confirmation's Always allow

    // wave-7-task-5: Tool retry and retrying

    // wave-7-task-6: Diff

    // wave-7-task-7: Step Group

    // wave-7-task-8: Handoff

    // wave-7-task-10: Trace

    // wave-7-task-11: Run Timeline

    // wave-7-task-12: Job Progress

    // wave-7-task-13: Schedule Card

    // wave-7-task-14: Agent Card

    // wave-7-task-15: Usage Meter and Context Meter's breakdown
    "wave-7/usage-meter.spec.ts",

    // wave-7-task-16: Quota Notice

    // wave-7-task-17: Activity Graph

    // wave-7-task-18: Thread List inbox

    // wave-7-task-19: Flow Graph
  ],
};
