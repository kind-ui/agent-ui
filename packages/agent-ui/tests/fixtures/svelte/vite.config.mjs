import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { identityPlugin } from "../identity.mjs";
import { ssrPlugin } from "../ssr.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

// Render layers import core through the public specifier; serve it from source so fixtures need no build.
export default defineConfig({
  root: here("."),
  cacheDir: here("../../../../../node_modules/.vite/fixture-svelte"),
  plugins: [svelte(), tailwindcss(), identityPlugin("svelte"), ssrPlugin()],
  // A file written during a run would otherwise reload open pages and destroy the context a test evaluates in.
  server: { hmr: false },
  resolve: { alias: { "@kind-ui/agent-ui/core": here("../../../src/core/index.ts") } },
  optimizeDeps: { include: ["@ui-sdk/core"] },
});
