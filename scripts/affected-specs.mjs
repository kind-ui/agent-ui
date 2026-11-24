#!/usr/bin/env node
// Prints the browser specs a change can reach, so CI runs only those on pull requests: "all" when a change
// reaches a fixture page or render file no spec is known to cover, nothing when it reaches neither.
//
//   node scripts/affected-specs.mjs              A pull request's merge commit against its base (HEAD^1).
//   node scripts/affected-specs.mjs main HEAD    Any `git diff` range.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { blocks as catalogBlocks } from "../registry/catalog.mjs";
import { manifests } from "../registry/layers/index.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = "packages/agent-ui/src/";
const coreIndex = `${src}core/index.ts`;
const layers = "react|web|vue|svelte|solid";
const sourceFile = /\.(tsx?|vue|svelte)$/;
// A layer file reaches the root-level specs (`parity.spec.ts`, `hydration.spec.ts`) its manifest lists; a React one
// reaches those any manifest lists, since parity compares each layer with React.
const layerFile = /^packages\/agent-ui\/(?:src|tests\/fixtures)\/(react|vue|svelte|solid)\/(?:cases\/)?/;
const rootSpecs = (names) =>
  names.filter((spec) => !spec.includes("/")).map((spec) => `tests/browser/${spec}`);

const unrelated = [
  /^(docs|apps\/docs|registry|tests\/types|\.agents|\.claude|\.changeset|\.vscode)\//,
  /^scripts\/(?!affected-specs\.mjs$|run-checks\.mjs$)/,
  /^\.github\/workflows\/(?!ci\.yml$)/,
  /\.md$/,
  /^(LICENSE|biome\.json|size-budget\.json|skills-lock\.json|\.mcp\.json|\.gitignore)$/,
];

const read = (file) => readFileSync(join(root, file), "utf8");

function resolveRelative(from, specifier) {
  const base = posix.join(posix.dirname(from), specifier.replace(/\?.*$/, ""));
  const stem = base.replace(/\.js$/, "");
  return (
    [base, `${stem}.ts`, `${stem}.tsx`, `${stem}/index.ts`].find((file) => existsSync(join(root, file))) ??
    base
  );
}

// Render files and fixtures import core by name through the package; each name leads to the module exporting it.
const coreModules = new Map();
for (const [, names, from] of read(coreIndex).matchAll(
  /export\s*(?:type\s*)?\{([^}]*)\}\s*from\s*"([^"]+)"/g,
)) {
  for (const name of names.split(","))
    coreModules.set(name.replace(/^\s*type\s+/, "").trim(), resolveRelative(coreIndex, from));
}

// Vue and Svelte files import inside their `<script>` blocks.
const scriptBlocks = (text) =>
  [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((m) => m[1]).join("\n");

export function importsOf(file) {
  const text = /\.(vue|svelte)$/.test(file) ? scriptBlocks(read(file)) : read(file);
  const imports = ts
    .preProcessFile(text, true, true)
    .importedFiles.filter(({ fileName }) => fileName.startsWith("."))
    .map(({ fileName }) => resolveRelative(file, fileName));
  for (const [, names, entry] of text.matchAll(
    /import\s*\{([^}]*)\}\s*from\s*"@kind-ui\/agent-ui(\/core)?"/g,
  )) {
    for (const name of names.split(",").map((each) => each.trim())) {
      if (!name || name.startsWith("type ")) continue;
      imports.push(entry ? (coreModules.get(name) ?? coreIndex) : `${src}index.ts`);
    }
  }
  // Component styles reach the page through agent-ui.css; credit each to its render files instead.
  const name = file
    .match(/^packages\/agent-ui\/src\/(?:(?:react|web|vue|solid)\/([^/]+)\.tsx?|svelte\/([^/]+)\/index\.ts)$/)
    ?.slice(1)
    .find(Boolean);
  if (name && existsSync(join(root, `${src}styles/${name}.css`))) imports.push(`${src}styles/${name}.css`);
  return imports;
}

function loadGraph() {
  const files = execFileSync("git", ["ls-files", src, "packages/agent-ui/tests", "tests/browser"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\n")
    .filter(Boolean);
  const dependents = new Map(files.map((file) => [file, new Set()]));
  for (const file of files) {
    if (!sourceFile.test(file)) continue;
    for (const dependency of importsOf(file)) dependents.get(dependency)?.add(file);
  }
  const specs = new Map(
    files
      .filter((file) => file.endsWith(".spec.ts"))
      .map((spec) => [spec, new Set([...read(spec).matchAll(/[?&]c=([\w-]+)/g)].map((match) => match[1]))]),
  );
  return { dependents, specs };
}

// A starter block's spec is reached by its own sources and by every component its `uses` names, since the
// fixture imports the block through an alias the import graph doesn't follow.
const blockSpec = (name) => `tests/browser/blocks/${name}.spec.ts`;
const blockSource = /^apps\/docs\/examples\/blocks\/([^/]+)\//;
const renderFile = /^packages\/agent-ui\/src\/react\/(?:(internal)\/)?([^/]+)\.tsx?$/;

/** The specs `changed` can reach, sorted, or "all" when a file's reach is unknown. */
export function affectedSpecs(
  changed,
  { dependents, specs } = loadGraph(),
  layerManifests = manifests,
  blocks = catalogBlocks,
) {
  const affected = new Set();
  const usedBy = (name) =>
    Object.entries(blocks)
      .filter(([, { uses }]) => uses.includes(name))
      .map(([block]) => blockSpec(block));
  for (const file of changed) {
    const folder = file.match(blockSource)?.[1];
    if (folder) {
      for (const [name, block] of Object.entries(blocks))
        if (block.folder === folder) affected.add(blockSpec(name));
      continue;
    }
    const layer = file.match(/^registry\/layers\/(\w+)\.mjs$/)?.[1];
    if (layer) {
      if (!layerManifests[layer]) return "all";
      for (const spec of layerManifests[layer].specs) affected.add(`tests/browser/${spec}`);
      continue;
    }
    if (!dependents.has(file)) {
      if (unrelated.some((pattern) => pattern.test(file))) continue;
      return "all";
    }
    const reached = new Set([file]);
    for (const each of reached) for (const dependent of dependents.get(each)) reached.add(dependent);
    const cases = new Set(
      [...reached]
        .map((each) => each.match(new RegExp(`/fixtures/(?:${layers})/cases/([^/.]+)\\.`))?.[1])
        .filter(Boolean),
    );
    const hits = [...specs]
      .filter(([spec, used]) => reached.has(spec) || [...used].some((name) => cases.has(name)))
      .map(([spec]) => spec);
    for (const each of reached) {
      const [, internal, name] = each.match(renderFile) ?? [];
      if (name) hits.push(...usedBy(internal ? `internal-${name}` : name));
    }
    for (const each of reached) {
      const match = each.match(layerFile);
      if (!match || (each.includes("/tests/fixtures/") && !each.includes("/cases/"))) continue;
      const listed = match[1] === "react" ? Object.values(layerManifests) : [layerManifests[match[1]]];
      hits.push(...listed.flatMap((manifest) => rootSpecs(manifest?.specs ?? [])));
    }
    if (!hits.length) {
      if ([...reached].some((each) => new RegExp(`/tests/fixtures/|/src/(${layers}|styles)/`).test(each)))
        return "all";
      continue;
    }
    for (const spec of hits) affected.add(spec);
  }
  return [...affected].sort();
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const range = process.argv.length > 2 ? process.argv.slice(2) : ["HEAD^1", "HEAD"];
  const changed = execFileSync("git", ["diff", "--name-only", ...range], { cwd: root, encoding: "utf8" })
    .split("\n")
    .filter(Boolean);
  const specs = affectedSpecs(changed);
  console.log(specs === "all" ? "all" : specs.join(" "));
}
