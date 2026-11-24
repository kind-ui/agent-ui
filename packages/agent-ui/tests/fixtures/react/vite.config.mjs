import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { identityPlugin } from "../identity.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

// Render layers import core through the public specifier; serve it from source so fixtures need no build.
export default defineConfig(({ mode }) => ({
  root: here("."),
  cacheDir: here(`../../../../../node_modules/.vite/fixture-react-${mode}`),
  plugins: [tailwindcss(), identityPlugin("react")],
  // A file written during a run would otherwise reload open pages and destroy the context a test evaluates in.
  server: { hmr: false },
  // Starter blocks import their components and their own files as an installed app does (starter blocks spec D4).
  resolve: {
    alias: [
      { find: "@kind-ui/agent-ui/core", replacement: here("../../../src/core/index.ts") },
      { find: /^@\/components\/ui\//, replacement: here("../../../src/react/") },
      { find: /^@\/components\/blocks\//, replacement: here("../../../../../apps/docs/examples/blocks/") },
    ],
  },
  optimizeDeps: {
    include: [
      "react",
      "react/jsx-dev-runtime",
      "react-dom/client",
      "@ui-sdk/core",
      "@ui-sdk/react/agent",
      "@ui-sdk/react/primitive",
      "@ui-sdk/react/alert-dialog",
      "@ui-sdk/react/avatar",
      "@ui-sdk/react/button",
      "@ui-sdk/react/checkbox",
      "@ui-sdk/react/collapsible",
      "@ui-sdk/react/file-input",
      "@ui-sdk/react/menu",
      "@ui-sdk/react/progress",
      "@ui-sdk/react/radio",
      "@ui-sdk/react/scroll-area",
      "@ui-sdk/react/textarea",
      "@ui-sdk/react/toggle",
      "@ui-sdk/react/token-input",
      "@ui-sdk/react/toolbar",
      "@ui-sdk/react/tooltip",
      "@ui-sdk/react/tree",
      "@ui-sdk/react/trigger-menu",
    ],
  },
  oxc: { jsx: { runtime: "automatic" } },
}));
