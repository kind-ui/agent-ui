import assert from "node:assert/strict";
import { test } from "node:test";
import { pathItems, treeValues } from "@kind-ui/agent-ui/core";

test("pathItems and treeValues list folders and files by path", () => {
  const items = pathItems([{ path: "src/a.ts", change: "added" }, { path: "README.md" }, { path: "empty/" }]);
  assert.deepEqual(treeValues(items), { branches: ["src", "empty"], leaves: ["src/a.ts", "README.md"] });
});
