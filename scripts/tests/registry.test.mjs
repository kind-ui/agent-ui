import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import catalog from "../../registry/catalog.mjs";
import { toRegistry, validateCatalog } from "../build-registry.mjs";
import { checkRegistryIntegrity } from "../check-registry-consumers.mjs";

const pkg = JSON.parse(
  readFileSync(new URL("../../packages/agent-ui/package.json", import.meta.url), "utf8"),
);
const item = (name) => catalog.items.find((each) => each.name === name);
const errorsWith = (change) => validateCatalog({ ...catalog, ...change }, pkg).join("\n");

const dir = mkdtempSync(join(tmpdir(), "registry-"));
after(() => rmSync(dir, { recursive: true, force: true }));

test("the catalog is valid", () => assert.deepEqual(validateCatalog(catalog, pkg), []));

test("duplicate names fail", () =>
  assert.match(
    errorsWith({ items: [...catalog.items, item("composer")] }),
    /duplicate item name "composer"/,
  ));

test("version drift fails", () => assert.match(errorsWith({ packageVersion: "9.9.9" }), /packageVersion/));

test("ui-sdk pin drift fails", () =>
  assert.match(
    errorsWith({
      items: [...catalog.items, { ...item("step-web"), name: "x", dependencies: ["@ui-sdk/web@0.0.1"] }],
    }),
    /@ui-sdk\/web@0\.0\.1 differs from the pin/,
  ));

test("relative core import fails", () => {
  const file = join(dir, "relative.tsx");
  const core = fileURLToPath(new URL("../../packages/agent-ui/src/core/index.js", import.meta.url));
  writeFileSync(file, `import { stepPrimitive } from "${relative(dir, core)}";\n`);
  const relativeImport = { ...item("step"), name: "x", files: [file] };
  assert.match(errorsWith({ items: [...catalog.items, relativeImport] }), /@kind-ui\/agent-ui\/core/);
});

test("a relative import no dependency ships fails", () => {
  const withoutScrollArea = { ...item("code-block"), registryDependencies: ["@kind-ui/agent-ui-setup"] };
  const items = catalog.items.map((each) => (each.name === "code-block" ? withoutScrollArea : each));
  assert.match(errorsWith({ items }), /imports \.\/internal\/scroll-area\.js/);
});

test("unknown registry dependencies and visible internals fail", () => {
  const items = [
    ...catalog.items,
    { ...item("step"), name: "y", registryDependencies: ["@kind-ui/missing", "agent-ui-setup"] },
    { ...item("internal-button"), name: "internal-z", hidden: false },
  ];
  const errors = errorsWith({ items });
  assert.match(errors, /@kind-ui\/missing is not an item/);
  assert.match(errors, /agent-ui-setup is not an item/);
  assert.match(errors, /"internal-z": only internal-<name> items are hidden/);
});

test("component names have no product prefix", () => {
  for (const { name } of catalog.items.filter((each) => each.type === "registry:ui")) {
    assert.doesNotMatch(name, /^agent-/);
  }
});

test("every component ships in both layers", () => {
  const names = catalog.items.map((each) => each.name);
  const react = catalog.items.filter((each) => each.layer === "react" && !each.hidden);
  assert.equal(react.length, 38);
  for (const { name } of react) assert.ok(names.includes(`${name}-web`), name);
});

test("every React render file is a client module", () => {
  const files = catalog.items.flatMap((each) => (each.layer === "react" ? each.files : []));
  for (const file of files.filter((path) => path.endsWith(".tsx"))) {
    assert.ok(
      readFileSync(new URL(`../../${file}`, import.meta.url), "utf8").startsWith('"use client";\n'),
      file,
    );
  }
});

test("hidden items are marked in meta, and files keep their layer's folders", () => {
  const registry = toRegistry(catalog);
  const scrollArea = registry.items.find((each) => each.name === "internal-scroll-area-web");
  assert.deepEqual(scrollArea.meta, { layer: "web", hidden: true });
  assert.equal(scrollArea.files[0].target, "@ui/web/internal/scroll-area.ts");
  assert.equal(registry.items.find((each) => each.name === "step").files[0].target, "@ui/step.tsx");
});

test("the integrity check finds unbuilt dependencies and visible internals", () => {
  const out = join(dir, "r");
  mkdirSync(out);
  const registry = toRegistry(catalog);
  writeFileSync(join(out, "registry.json"), JSON.stringify(registry));
  for (const each of registry.items) {
    const payload = { ...each, files: each.files.map((file) => ({ ...file, content: "x" })) };
    if (each.name === "internal-scroll-area") delete payload.meta;
    if (each.name !== "internal-toolbar")
      writeFileSync(join(out, `${each.name}.json`), JSON.stringify(payload));
  }
  const errors = checkRegistryIntegrity(out).join("\n");
  assert.match(errors, /internal-toolbar\.json was not built/);
  assert.match(errors, /message: @kind-ui\/internal-toolbar is not served/);
  assert.match(errors, /internal-scroll-area: hidden is wrong/);
});

test("an import outside the item's dependencies, a range and a missing file fail", () => {
  const file = join(dir, "imports.tsx");
  writeFileSync(file, 'import debounce from "lodash";\n');
  const items = [
    ...catalog.items,
    { ...item("step"), name: "imports", files: [file] },
    { ...item("step-web"), name: "range", dependencies: ["@ui-sdk/web@^0.1.0"] },
    { ...item("step"), name: "missing", files: [join(dir, "missing.tsx")] },
  ];
  const errors = errorsWith({ items });
  assert.match(errors, /imports lodash, not a dependency/);
  assert.match(errors, /@ui-sdk\/web@\^0\.1\.0 is not an exact version/);
  assert.match(errors, /missing\.tsx does not exist/);
});

test("the setup note is a plain file beside the components", () =>
  assert.deepEqual(toRegistry(catalog).items.find((each) => each.name === "agent-ui-setup").files, [
    { path: "registry/agent-ui-setup/AGENTS.md", type: "registry:file", target: "@ui/AGENTS.md" },
  ]));
