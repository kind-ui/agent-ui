// Each manifest's specs exist, and its Playwright projects list exactly those files (plan D8).
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { manifests, selectedLayers } from "../../registry/layers/index.mjs";

const root = fileURLToPath(new URL("../../", import.meta.url));

test("KIND_LAYERS selects layers and refuses unknown ones", () => {
  assert.deepEqual(selectedLayers(""), ["react", "web", "vue", "svelte", "solid"]);
  assert.deepEqual(selectedLayers("solid, react"), ["react", "solid"]);
  assert.throws(() => selectedLayers("angular"), /unknown layer angular/);
});

for (const [layer, { specs }] of Object.entries(manifests))
  test(`${layer} projects run exactly the specs its manifest lists`, () => {
    for (const spec of specs) assert.ok(existsSync(`${root}tests/browser/${spec}`), `${spec} exists`);
    const listed = JSON.parse(
      execFileSync("npx", ["playwright", "test", "--list", "--reporter=json", "--pass-with-no-tests"], {
        cwd: root,
        env: { ...process.env, KIND_LAYERS: layer, KIND_FIXTURE_PORT_BASE: "5990" },
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      }),
    );
    const files = new Set();
    const visit = (suite) => {
      if (suite.specs?.length) files.add(suite.file);
      for (const child of suite.suites ?? []) visit(child);
    };
    for (const suite of listed.suites) visit(suite);
    assert.deepEqual([...files].sort(), [...specs].sort());
  });
