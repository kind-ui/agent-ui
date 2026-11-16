import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const pkg = JSON.parse(
  readFileSync(new URL("../../packages/agent-ui/package.json", import.meta.url), "utf8"),
);

test("package manifest follows spec §3", () => {
  assert.deepEqual(Object.keys(pkg.exports).sort(), [".", "./adapters/ai-sdk", "./core", "./styles.css"]);
  for (const [n, r] of Object.entries(pkg.dependencies)) assert.match(r, /^\d+\.\d+\.\d+(-[\w.]+)?$/, n);
  assert.equal(pkg.devDependencies["@ui-sdk/react"], pkg.dependencies["@ui-sdk/core"]);
  assert.equal(pkg.devDependencies["@ui-sdk/web"], pkg.dependencies["@ui-sdk/core"]);
  assert.equal(pkg.peerDependenciesMeta.ai.optional, true);
  assert.equal(pkg.peerDependencies.react, undefined);
});
