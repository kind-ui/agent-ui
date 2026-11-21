// What the Svelte layer ships and tests (framework layers plan D10). The registry catalog, the Playwright
// projects, `scripts/affected-specs.mjs`, the parity test and the docs tabs read it, so a component exists in
// this layer only once it is listed here. Each track task adds its lines under its own marker, then one blank
// line, and never edits another task's lines.
// biome-ignore format: the blank line under each marker keeps two tasks' lines apart, so git merges them cleanly
export default {
  // Registry names of the visible components this layer renders, as in `registry/catalog.mjs`.
  components: [
    // framework-svelte-1: groundwork, internal wrappers and Step

    "step",

    // framework-svelte-2: chat core

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

    // framework-svelte-3: composer controls

    "picker",
    "settings-menu",
    "model-selector",
    "reasoning-effort",
    "add-menu",
    "approval-mode",
    "model-control",
    "context-bar",
    "context-meter",
    "dictation",

    // framework-svelte-4: indicators, notices and files

    "loader",
    "thinking-indicator",
    "typing-indicator",
    "streaming-text",
    "status",
    "notice",
    "guardrail-notice",
    "uploader",

    // framework-svelte-5: step family

    // framework-svelte-6: developer output

    // framework-svelte-7: Wave 6 shell

    "thread-list",
    "thread-search",
    "sidebar",
    "day-separator",
    "connection-status",
    "share-dialog",
    "conversation-search",

    // framework-svelte-8: conformance
  ],
  // Internal wrapper names, without the `internal-` prefix.
  internals: [
    // framework-svelte-1: groundwork, internal wrappers and Step

    "avatar",
    "button",
    "collapsible",
    "command",
    "file-input",
    "menu",
    "progress",
    "scroll-area",
    "switch",
    "toggle",
    "token-input",
    "trigger-menu",

    // framework-svelte-2: chat core

    "alert-dialog",
    "carousel",
    "checkbox",
    "radio",
    "textarea",
    "toolbar",
    "tooltip",

    // framework-svelte-3: composer controls

    "segmented-control",

    // framework-svelte-4: indicators, notices and files

    // framework-svelte-5: step family

    // framework-svelte-6: developer output

    // framework-svelte-7: Wave 6 shell

    "drawer",
    "resizable",

    // framework-svelte-8: conformance
  ],
  // Spec files the layer's projects run, relative to `tests/browser/`.
  specs: [
    // framework-svelte-1: groundwork, internal wrappers and Step

    "wave-1/step.spec.ts",
    "wave-1/internal.spec.ts",
    "parity.spec.ts",
    "hydration.spec.ts",

    // framework-svelte-2: chat core

    "wave-1/markdown.spec.ts",
    "wave-1/conversation.spec.ts",
    "wave-1/message.spec.ts",
    "wave-1/composer.spec.ts",
    "wave-3/suggestion.spec.ts",
    "wave-3/feedback.spec.ts",
    "wave-3/confirmation.spec.ts",
    "wave-3/question.spec.ts",
    "wave-3/checkpoint.spec.ts",
    "wave-1/budgets.spec.ts",

    // framework-svelte-3: composer controls

    "wave-5/picker.spec.ts",
    "wave-5/settings-menu.spec.ts",
    "wave-3/model-selector.spec.ts",
    "wave-3/reasoning-effort.spec.ts",
    "wave-5/add-menu.spec.ts",
    "wave-5/approval-mode.spec.ts",
    "wave-5/model-control.spec.ts",
    "wave-5/context-bar.spec.ts",
    "wave-3/context-meter.spec.ts",
    "wave-5/dictation.spec.ts",
    "wave-5/composed-events.spec.ts",

    // framework-svelte-4: indicators, notices and files

    "wave-1/indicators.spec.ts",
    "wave-1/uploader.spec.ts",
    "wave-2/status.spec.ts",
    "wave-3/notice.spec.ts",
    "wave-3/guardrail-notice.spec.ts",

    // framework-svelte-5: step family

    // framework-svelte-6: developer output

    // framework-svelte-7: Wave 6 shell

    "wave-6/thread-list.spec.ts",
    "wave-6/thread-search.spec.ts",
    "wave-6/sidebar.spec.ts",
    "wave-6/day-separator.spec.ts",
    "wave-6/connection-status.spec.ts",
    "wave-6/share-dialog.spec.ts",
    "wave-6/conversation-search.spec.ts",

    // framework-svelte-8: conformance
  ],
};
