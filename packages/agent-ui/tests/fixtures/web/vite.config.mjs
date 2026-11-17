import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

// Render layers import core through the public specifier; serve it from source so fixtures need no build.
export default defineConfig({
  root: here("."),
  cacheDir: here("../../../../../node_modules/.vite/fixture-web"),
  plugins: [tailwindcss()],
  // A file written during a run would otherwise reload open pages and destroy the context a test evaluates in.
  server: { hmr: false },
  resolve: { alias: { "@kind-ui/agent-ui/core": here("../../../src/core/index.ts") } },
  optimizeDeps: {
    include: [
      "@ui-sdk/core",
      "@ui-sdk/web",
      "@ui-sdk/web/agent",
      "@ui-sdk/web/alert-dialog",
      "@ui-sdk/web/avatar",
      "@ui-sdk/web/button",
      "@ui-sdk/web/checkbox",
      "@ui-sdk/web/collapsible",
      "@ui-sdk/web/file-input",
      "@ui-sdk/web/menu",
      "@ui-sdk/web/progress",
      "@ui-sdk/web/radio",
      "@ui-sdk/web/scroll-area",
      "@ui-sdk/web/textarea",
      "@ui-sdk/web/toggle",
      "@ui-sdk/web/token-input",
      "@ui-sdk/web/toolbar",
      "@ui-sdk/web/tooltip",
      "@ui-sdk/web/tree",
      "@ui-sdk/web/trigger-menu",
    ],
  },
});
