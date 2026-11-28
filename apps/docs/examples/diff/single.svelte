<script lang="ts">
  import { Diff } from "@/components/ui/svelte/diff/index.js";

  const patch = `--- a/package.json
+++ b/package.json
@@ -12,3 +12,3 @@
     "test": "vitest run",
-    "lint": "eslint .",
+    "lint": "biome check .",
     "build": "tsc -b"
`;
</script>

<Diff class="w-full max-w-2xl" files={[{ path: "package.json", patch }]} />
