import assert from "node:assert/strict";
import { test } from "node:test";
import { affectedSpecs } from "../affected-specs.mjs";

const spec = (name) => `tests/browser/wave-1/${name}.spec.ts`;

test("docs and tooling reach no spec", () =>
  assert.deepEqual(
    affectedSpecs([
      "docs/superpowers/plans/x.md",
      "apps/docs/content/docs/index.mdx",
      "scripts/check-size.mjs",
    ]),
    [],
  ));

test("code no fixture loads reaches no spec", () =>
  assert.deepEqual(affectedSpecs(["packages/agent-ui/src/adapters/ai-sdk/parts.ts"]), []));

test("a file a fixture imports with a query reaches its specs", () =>
  assert.ok(
    affectedSpecs(["packages/agent-ui/tests/core/fixtures/long-answer.md"]).includes(spec("markdown")),
  ));

test("a spec reaches itself", () => assert.deepEqual(affectedSpecs([spec("motion")]), [spec("motion")]));

test("a component reaches the specs whose fixtures render it", () => {
  const specs = affectedSpecs(["packages/agent-ui/src/core/uploader/uploader.ts"]);
  assert.ok(specs.includes(spec("uploader")) && specs.includes(spec("agent")));
  assert.ok(!specs.includes(spec("step")));
});

test("a component stylesheet reaches its component's specs", () =>
  assert.ok(affectedSpecs(["packages/agent-ui/src/styles/step.css"]).includes(spec("step"))));

test("a file of unknown reach runs every spec", () => {
  assert.equal(affectedSpecs(["package-lock.json"]), "all");
  assert.equal(affectedSpecs(["packages/agent-ui/src/styles/agent-ui.css"]), "all");
  assert.equal(affectedSpecs(["packages/agent-ui/tests/fixtures/react/main.tsx"]), "all");
});
