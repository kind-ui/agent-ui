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

    // framework-svelte-4: indicators, notices and files

    // framework-svelte-5: step family

    // framework-svelte-6: developer output

    // framework-svelte-7: Wave 6 shell

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

    // framework-svelte-4: indicators, notices and files

    // framework-svelte-5: step family

    // framework-svelte-6: developer output

    // framework-svelte-7: Wave 6 shell

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

    // framework-svelte-4: indicators, notices and files

    // framework-svelte-5: step family

    // framework-svelte-6: developer output

    // framework-svelte-7: Wave 6 shell

    // framework-svelte-8: conformance
  ],
};
