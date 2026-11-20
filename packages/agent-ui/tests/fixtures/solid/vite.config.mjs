import { fileURLToPath } from "node:url";
import solid from "@solidjs/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import { identityPlugin } from "../identity.mjs";
import { ssrPlugin } from "../ssr.mjs";
import { optimizedEntries } from "../ui-sdk-entries.mjs";

const here = (path) => fileURLToPath(new URL(path, import.meta.url));

// Render layers import core through the public specifier; serve it from source so fixtures need no build.
export default defineConfig({
  root: here("."),
  cacheDir: here("../../../../../node_modules/.vite/fixture-solid"),
  plugins: [solid({ ssr: true }), tailwindcss(), identityPlugin("solid"), ssrPlugin()],
  // A file written during a run would otherwise reload open pages and destroy the context a test evaluates in.
  server: { hmr: false },
  resolve: { alias: { "@kind-ui/agent-ui/core": here("../../../src/core/index.ts") } },
  optimizeDeps: { include: ["solid-js", "@solidjs/web", "@ui-sdk/core", ...optimizedEntries("solid")] },
});
