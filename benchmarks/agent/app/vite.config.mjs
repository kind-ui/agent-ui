import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

// The harness copies this folder to benchmarks/agent-app in a checkout of the version it measures,
// so the screen renders that version's React render files and the UI SDK it pins.
const here = (path) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  root: here("."),
  cacheDir: here("node_modules/.vite"),
  plugins: [tailwindcss()],
  server: { hmr: false },
  resolve: {
    alias: {
      "@kind-ui/agent-ui/core": here("../../packages/agent-ui/src/core/index.ts"),
      "@ui": here("../../packages/agent-ui/src/react"),
    },
  },
  oxc: { jsx: { runtime: "automatic" } },
});
