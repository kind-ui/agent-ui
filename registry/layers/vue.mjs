// What the Vue layer ships and tests (framework layers plan D10). The registry catalog, the Playwright
// projects, `scripts/affected-specs.mjs`, the parity test and the docs tabs read it, so a component exists in
// this layer only once it is listed here. Each track task adds its lines under its own marker, then one blank
// line, and never edits another task's lines.
// biome-ignore format: the blank line under each marker keeps two tasks' lines apart, so git merges them cleanly
export default {
  // Registry names of the visible components this layer renders, as in `registry/catalog.mjs`.
  components: [
    // framework-vue-1: groundwork, internal wrappers and Step

    "step",

    // framework-vue-2: chat core

    // framework-vue-3: composer controls

    // framework-vue-4: indicators, notices and files

    // framework-vue-5: step family

    // framework-vue-6: developer output

    // framework-vue-7: Wave 6 shell

    // framework-vue-8: conformance
  ],
  // Internal wrapper names, without the `internal-` prefix.
  internals: [
    // framework-vue-1: groundwork, internal wrappers and Step

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

  ],
  // Spec files the layer's projects run, relative to `tests/browser/`.
  specs: [
    // framework-vue-1: groundwork, internal wrappers and Step

    "wave-1/step.spec.ts",
    "wave-1/internal.spec.ts",
    "parity.spec.ts",

    // framework-vue-2: chat core

    // framework-vue-3: composer controls

    // framework-vue-4: indicators, notices and files

    // framework-vue-5: step family

    // framework-vue-6: developer output

    // framework-vue-7: Wave 6 shell

    // framework-vue-8: conformance
  ],
};
