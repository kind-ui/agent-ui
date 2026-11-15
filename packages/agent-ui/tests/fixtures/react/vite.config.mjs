import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

// Render layers import core through the public specifier; serve it from source so fixtures need no build.
export default defineConfig({
  root: here("."),
  cacheDir: here("../../../../../node_modules/.vite/fixture-react"),
  plugins: [tailwindcss()],
  resolve: { alias: { "@kind-ui/agent-ui/core": here("../../../src/core/index.ts") } },
  optimizeDeps: {
    include: [
      "react",
      "react/jsx-dev-runtime",
      "react-dom/client",
      "@ui-sdk/core",
      "@ui-sdk/react/agent",
      "@ui-sdk/react/primitive",
      "@ui-sdk/react/avatar",
      "@ui-sdk/react/button",
      "@ui-sdk/react/collapsible",
      "@ui-sdk/react/file-input",
      "@ui-sdk/react/menu",
      "@ui-sdk/react/progress",
      "@ui-sdk/react/scroll-area",
      "@ui-sdk/react/toggle",
      "@ui-sdk/react/token-input",
      "@ui-sdk/react/toolbar",
      "@ui-sdk/react/trigger-menu",
    ],
  },
  oxc: { jsx: { runtime: "automatic" } },
});
