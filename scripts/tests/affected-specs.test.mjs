import assert from "node:assert/strict";
import { test } from "node:test";
import { affectedSpecs, importsOf } from "../affected-specs.mjs";

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

test("a Svelte file's script imports are followed", () => {
  const imports = importsOf("scripts/tests/fixtures/affected-specs/Part.svelte");
  assert.ok(imports.includes("scripts/tests/fixtures/affected-specs/helper.ts"));
  assert.ok(imports.includes("packages/agent-ui/src/core/step/index.ts"));
});

test("a framework fixture case reaches the specs that load it", () => {
  const svelteCase = "packages/agent-ui/tests/fixtures/svelte/cases/step.svelte";
  const graph = {
    dependents: new Map([[svelteCase, new Set()]]),
    specs: new Map([[spec("step"), new Set(["step"])]]),
  };
  assert.deepEqual(affectedSpecs([svelteCase], graph, { svelte: { specs: [] } }), [spec("step")]);
});

test("a layer manifest reaches the specs it lists", () => {
  const listed = { vue: { specs: ["parity.spec.ts", "wave-1/step.spec.ts"] } };
  assert.deepEqual(affectedSpecs(["registry/layers/vue.mjs"], undefined, listed), [
    "tests/browser/parity.spec.ts",
    spec("step"),
  ]);
});

test("a layer fixture case reaches the root specs its manifest lists", () => {
  const vueCase = "packages/agent-ui/tests/fixtures/vue/cases/step.ts";
  const graph = { dependents: new Map([[vueCase, new Set()]]), specs: new Map() };
  const listed = { vue: { specs: ["parity.spec.ts"] }, svelte: { specs: ["hydration.spec.ts"] } };
  assert.deepEqual(affectedSpecs([vueCase], graph, listed), ["tests/browser/parity.spec.ts"]);
});

const starter = { "coding-agent-starter": { folder: "coding-agent", uses: ["terminal", "internal-menu"] } };
const codingSpec = "tests/browser/blocks/coding-agent-starter.spec.ts";

test("a block's own sources reach its spec", () =>
  assert.deepEqual(
    affectedSpecs(["apps/docs/examples/blocks/coding-agent/mock.ts"], undefined, undefined, starter),
    [codingSpec],
  ));

test("a component a block uses reaches the block's spec", () => {
  assert.ok(
    affectedSpecs(["packages/agent-ui/src/react/terminal.tsx"], undefined, undefined, starter).includes(
      codingSpec,
    ),
  );
  assert.ok(
    affectedSpecs(
      ["packages/agent-ui/src/core/terminal/terminal.ts"],
      undefined,
      undefined,
      starter,
    ).includes(codingSpec),
  );
  assert.ok(
    affectedSpecs(["packages/agent-ui/src/react/internal/menu.tsx"], undefined, undefined, starter).includes(
      codingSpec,
    ),
  );
  assert.ok(
    !affectedSpecs(["packages/agent-ui/src/react/step.tsx"], undefined, undefined, starter).includes(
      codingSpec,
    ),
  );
});
