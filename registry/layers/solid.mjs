// What the Solid layer ships and tests (framework layers plan D10). The registry catalog, the Playwright
// projects, `scripts/affected-specs.mjs`, the parity test and the docs tabs read it, so a component exists in
// this layer only once it is listed here. Each track task adds its lines under its own marker, then one blank
// line, and never edits another task's lines.
// biome-ignore format: the blank line under each marker keeps two tasks' lines apart, so git merges them cleanly
export default {
  // Registry names of the visible components this layer renders, as in `registry/catalog.mjs`.
  components: [
    // framework-solid-1: groundwork, internal wrappers and Step

    "step",

    // framework-solid-2: chat core

    // framework-solid-3: composer controls

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

    // framework-solid-4: indicators, notices and files

    // framework-solid-5: step family

    // framework-solid-6: developer output

    // framework-solid-7: Wave 6 shell

    // framework-solid-8: conformance
  ],
  // Internal wrapper names, without the `internal-` prefix.
  internals: [
    // framework-solid-1: groundwork, internal wrappers and Step

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

    // framework-solid-3: composer controls

    "segmented-control",
  ],
  // Spec files the layer's projects run, relative to `tests/browser/`.
  specs: [
    // framework-solid-1: groundwork, internal wrappers and Step

    "wave-1/step.spec.ts",
    "wave-1/internal.spec.ts",
    "parity.spec.ts",
    "hydration.spec.ts",

    // framework-solid-2: chat core

    // framework-solid-3: composer controls

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

    // framework-solid-4: indicators, notices and files

    // framework-solid-5: step family

    // framework-solid-6: developer output

    // framework-solid-7: Wave 6 shell

    // framework-solid-8: conformance
  ],
};
