import { Diff } from "@/components/ui/diff";

const patch = `--- a/package.json
+++ b/package.json
@@ -12,3 +12,3 @@
     "test": "vitest run",
-    "lint": "eslint .",
+    "lint": "biome check .",
     "build": "tsc -b"
`;

export default function DiffSingleExample() {
  return <Diff className="w-full max-w-2xl" files={[{ path: "package.json", patch }]} />;
}
