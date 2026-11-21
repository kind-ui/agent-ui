import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { identityPlugin } from "../identity.mjs";
import { ssrPlugin } from "../ssr.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));
// `@ui-sdk/solid` ships JSX under its `solid` condition, which only the Solid plugin compiles, so it isn't
// prebundled; the `@ui-sdk/core` entries it imports are, so no page waits on a new optimized dependency.
const core = createRequire(import.meta.url)("@ui-sdk/core/package.json");
const coreEntries = Object.keys(core.exports)
  .filter((entry) => !/^\.\/(testing|package\.json|web\.css)$/.test(entry))
  .map((entry) => entry.replace(/^\./, "@ui-sdk/core"));

// Render layers import core through the public specifier; serve it from source so fixtures need no build.
export default defineConfig({
  root: here("."),
  cacheDir: here("../../../../../node_modules/.vite/fixture-solid"),
  plugins: [solid({ ssr: true }), tailwindcss(), identityPlugin("solid"), ssrPlugin()],
  // A file written during a run would otherwise reload open pages and destroy the context a test evaluates in.
  server: { hmr: false },
  resolve: { alias: { "@kind-ui/agent-ui/core": here("../../../src/core/index.ts") } },
  optimizeDeps: { include: ["solid-js", "@solidjs/web", ...coreEntries], exclude: ["@ui-sdk/solid"] },
});
