import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative } from "node:path";
import { after, test } from "node:test";
import { fileURLToPath } from "node:url";
import catalog, { blockItems, fixtureBlocks, layerItems } from "../../registry/catalog.mjs";
import { toRegistry, V0_STYLES, v0Payload, validateCatalog } from "../build-registry.mjs";
import { checkRegistryIntegrity } from "../check-registry-consumers.mjs";
import { liveCatalog } from "../check-registry-namespace.mjs";

const pkg = JSON.parse(
  readFileSync(new URL("../../packages/agent-ui/package.json", import.meta.url), "utf8"),
);
const item = (name) => catalog.items.find((each) => each.name === name);
const errorsWith = (change) => validateCatalog({ ...catalog, ...change }, pkg).join("\n");

const dir = mkdtempSync(join(tmpdir(), "registry-"));
after(() => rmSync(dir, { recursive: true, force: true }));

test("the catalog is valid", () => assert.deepEqual(validateCatalog(catalog, pkg), []));

test("a missing live catalog has no items, and other failures throw", async () => {
  assert.deepEqual(await liveCatalog(new Response("Not Found", { status: 404 })), { items: [] });
  await assert.rejects(liveCatalog(new Response("", { status: 503 })), /503/);
});

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

test("unknown registry dependencies, visible internals and missing descriptions fail", () => {
  const items = [
    ...catalog.items,
    { ...item("step"), name: "y", registryDependencies: ["@kind-ui/missing", "agent-ui-setup"] },
    { ...item("internal-button"), name: "internal-z", hidden: false, description: undefined },
  ];
  const errors = errorsWith({ items });
  assert.match(errors, /"internal-z": has no description/);
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
  const react = catalog.items.filter((each) => each.layer === "react" && !each.hidden && !each.meta?.block);
  const renderFiles = readdirSync(new URL("../../packages/agent-ui/src/react/", import.meta.url))
    .filter((file) => file.endsWith(".tsx"))
    .map((file) => file.slice(0, -".tsx".length));
  assert.deepEqual(react.map((each) => each.name).sort(), renderFiles.sort());
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

test("a manifest's components and internals become that layer's items", () => {
  const manifest = { components: ["code-block"], internals: ["scroll-area"] };
  const list = (dir) =>
    ({ "packages/agent-ui/src/svelte/code-block": ["CodeBlock.svelte", "index.ts"] })[dir] ?? ["index.ts"];
  const items = layerItems({ vue: manifest, svelte: manifest }, list);
  const targets = (name) =>
    toRegistry({ items: [items.find((each) => each.name === name)] }).items[0].files.map(
      (file) => file.target,
    );
  assert.deepEqual(
    items.map((each) => each.name),
    ["code-block-vue", "internal-scroll-area-vue", "code-block-svelte", "internal-scroll-area-svelte"],
  );
  assert.deepEqual(items[0].registryDependencies, [
    "@kind-ui/agent-ui-setup",
    "@kind-ui/internal-scroll-area-vue",
  ]);
  assert.deepEqual(
    items[0].dependencies.map((each) => each.split("@").slice(0, -1).join("@")),
    ["@kind-ui/agent-ui", "@ui-sdk/core", "@ui-sdk/vue"],
  );
  assert.deepEqual(targets("code-block-vue"), ["@ui/vue/code-block.ts"]);
  assert.deepEqual(targets("internal-scroll-area-vue"), [
    "@ui/vue/internal/scroll-area.ts",
    "@ui/vue/internal/kind-class.ts",
  ]);
  assert.deepEqual(targets("code-block-svelte"), [
    "@ui/svelte/code-block/CodeBlock.svelte",
    "@ui/svelte/code-block/index.ts",
  ]);
  assert.deepEqual(targets("internal-scroll-area-svelte"), [
    "@ui/svelte/internal/scroll-area/index.ts",
    "@ui/svelte/internal/kind-class.ts",
  ]);
});

test("a manifest naming an unknown component or internal throws, and a missing Svelte folder lists nothing", () => {
  const none = () => [];
  assert.throws(
    () => layerItems({ vue: { components: ["nope"], internals: [] } }, none),
    /registry\/layers\/vue\.mjs: unknown component nope/,
  );
  assert.throws(
    () => layerItems({ solid: { components: [], internals: ["nope"] } }, none),
    /registry\/layers\/solid\.mjs: unknown internal nope/,
  );
  const [step] = layerItems({ svelte: { components: ["step"], internals: [] } }, none);
  assert.match(errorsWith({ items: [...catalog.items, step] }), /"step-svelte": ships no files/);
});

const [helloItem] = blockItems(fixtureBlocks, { exampleRoot: "scripts/tests/fixtures/blocks" });
const itemsByName = new Map([...catalog.items, helloItem].map((each) => [each.name, each]));

test("a block is a registry:block over React items", () => {
  assert.equal(helloItem.type, "registry:block");
  assert.deepEqual(helloItem.registryDependencies, ["@kind-ui/agent-ui-setup", "@kind-ui/step"]);
  assert.deepEqual(
    helloItem.files.map((file) => [file.type, file.target]),
    [
      ["registry:page", "app/hello/page.tsx"],
      ["registry:component", "@components/blocks/hello/hello.tsx"],
      ["registry:lib", "@components/blocks/hello/mock.ts"],
      ["registry:page", "app/api/hello/route.ts"],
    ],
  );
  for (const pin of ["ai@7.0.173", "@ai-sdk/react@4.0.177", "zod@4.6.7"])
    assert.ok(helloItem.dependencies.includes(pin), pin);
  assert.deepEqual(helloItem.meta, { layer: "react", block: true });
  assert.deepEqual(toRegistry({ items: [helloItem] }).items[0].files, helloItem.files);
});

test("a block's imports must be shipped by the items it depends on", () => {
  assert.deepEqual(validateCatalog({ ...catalog, items: [...catalog.items, helloItem] }, pkg), []);
  const withoutStep = { ...helloItem, registryDependencies: ["@kind-ui/agent-ui-setup"] };
  assert.match(
    errorsWith({ items: [...catalog.items, withoutStep] }),
    /hello\.tsx imports @\/components\/ui\/step, which no item it depends on ships/,
  );
});

test("the v0 payload is flat, namespace-free and css-free", () => {
  const v0 = v0Payload(helloItem, itemsByName);
  assert.deepEqual(v0.registryDependencies, []);
  assert.equal(v0.css, undefined);
  assert.equal(v0.cssVars, undefined);
  assert.equal(v0.envVars, undefined);
  assert.ok(!JSON.stringify(v0).includes('"@kind-ui/agent-ui-setup"'));
  const page = v0.files.find((file) => file.target === "app/hello/page.tsx");
  assert.ok(page.content.startsWith(V0_STYLES));
  assert.equal(
    v0.files.find((file) => file.target === "app/api/hello/route.ts").content.startsWith(V0_STYLES),
    false,
  );
  for (const file of v0.files.filter((each) => each !== page))
    assert.equal(file.content, readFileSync(new URL(`../../${file.path}`, import.meta.url), "utf8"));
});

test("the v0 payload covers the block's transitive files exactly, with their dependencies", () => {
  const v0 = v0Payload(helloItem, itemsByName);
  assert.deepEqual(v0.files.map((file) => file.target).sort(), [
    "@components/blocks/hello/hello.tsx",
    "@components/blocks/hello/mock.ts",
    "@ui/AGENTS.md",
    "@ui/step.tsx",
    "app/api/hello/route.ts",
    "app/hello/page.tsx",
  ]);
  const names = v0.dependencies.map((each) => each.slice(0, each.lastIndexOf("@")));
  assert.deepEqual(names.sort(), [
    "@ai-sdk/react",
    "@kind-ui/agent-ui",
    "@ui-sdk/core",
    "@ui-sdk/react",
    "ai",
    "zod",
  ]);
  const tool = blockItems(
    { x: { title: "X", description: "d", folder: "hello", uses: ["tool"] } },
    { exampleRoot: "scripts/tests/fixtures/blocks" },
  )[0];
  const targets = v0Payload(tool, itemsByName).files.map((file) => file.target);
  for (const target of ["@ui/confirmation.tsx", "@ui/internal/textarea.tsx", "@ui/internal/kind-class.ts"])
    assert.ok(targets.includes(target), target);
  assert.equal(new Set(targets).size, targets.length);
});
