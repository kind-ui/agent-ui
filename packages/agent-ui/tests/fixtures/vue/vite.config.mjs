import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vite";
import { identityPlugin } from "../identity.mjs";
import { ssrPlugin } from "../ssr.mjs";
import { optimizedEntries } from "../ui-sdk-entries.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

// Render layers import core through the public specifier; serve it from source so fixtures need no build.
export default defineConfig({
  root: here("."),
  cacheDir: here("../../../../../node_modules/.vite/fixture-vue"),
  plugins: [vue(), tailwindcss(), identityPlugin("vue"), ssrPlugin()],
  // A file written during a run would otherwise reload open pages and destroy the context a test evaluates in.
  server: { hmr: false },
  resolve: {
    alias: {
      "@kind-ui/agent-ui/core/flow-graph": here("../../../src/core/flow-graph/index.ts"),
      "@kind-ui/agent-ui/core": here("../../../src/core/index.ts"),
    },
  },
  optimizeDeps: { include: ["vue", "@ui-sdk/core", ...optimizedEntries("vue")] },
});
