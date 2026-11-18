import { fileURLToPath } from "node:url";
import type { Page } from "@playwright/test";
import { build } from "vite";

const entry = fileURLToPath(new URL("./ui-sdk-testing-entry.ts", import.meta.url));
const core = fileURLToPath(new URL("../../packages/agent-ui/src/core/index.ts", import.meta.url));

let bundle: Promise<string> | undefined;

// UI SDK's testing kit and the primitives `checkDirection` mounts, bundled as one script so they share one copy of
// `@ui-sdk/core`. A fixture page's own copy is Vite's, which a test can't import from; `checkPattern` reads only the
// DOM, so it checks a page's components from this copy too.
const bundled = () =>
  (bundle ??= build({
    configFile: false,
    logLevel: "silent",
    define: { "process.env.NODE_ENV": JSON.stringify("development") },
    resolve: { alias: { "@kind-ui/agent-ui/core": core } },
    build: {
      write: false,
      minify: false,
      lib: { entry, formats: ["iife"], name: "kindTesting", fileName: "testing" },
    },
  }).then((output) => {
    const [result] = Array.isArray(output) ? output : [output];
    if (!result || !("output" in result)) throw new Error("the testing bundle didn't build");
    const [chunk] = result.output;
    if (chunk?.type !== "chunk") throw new Error("the testing bundle has no chunk");
    return chunk.code;
  }));

/** Adds `window.kindTesting` to the page: `checkPattern`, `checkDirection`, `mount` and the primitives they mount. */
export async function addTestingKit(page: Page) {
  await page.addScriptTag({ content: await bundled() });
}
