#!/usr/bin/env node
// Prints the browser specs a change can reach, so CI runs only those on pull requests:
// "all" when unsure, nothing when no spec is reached, else the spec paths.
//
//   node scripts/affected-specs.mjs              A pull request's merge commit against its base (HEAD^1).
//   node scripts/affected-specs.mjs main HEAD    Any `git diff` range.
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = "packages/agent-ui/src/";
const coreIndex = `${src}core/index.ts`;

const unrelated = [
  /^(docs|apps\/docs|registry|tests\/types|\.agents|\.claude|\.changeset|\.vscode)\//,
  /^packages\/agent-ui\/tests\/core\//,
  /^scripts\/(?!affected-specs\.mjs$|run-checks\.mjs$)/,
  /^\.github\/workflows\/(?!ci\.yml$)/,
  /\.md$/,
  /^(LICENSE|biome\.json|size-budget\.json|skills-lock\.json|\.mcp\.json|\.gitignore)$/,
];

const read = (file) => readFileSync(join(root, file), "utf8");

function resolveRelative(from, specifier) {
  const base = posix.join(posix.dirname(from), specifier);
  const stem = base.replace(/\.js$/, "");
  return [base, `${stem}.ts`, `${stem}.tsx`].find((file) => existsSync(join(root, file))) ?? base;
}

// Render files and fixtures import core by name through the package; each name leads to the module exporting it.
const coreModules = new Map();
for (const [, names, from] of read(coreIndex).matchAll(
  /export\s*(?:type\s*)?\{([^}]*)\}\s*from\s*"([^"]+)"/g,
)) {
  for (const name of names.split(","))
    coreModules.set(name.replace(/^\s*type\s+/, "").trim(), resolveRelative(coreIndex, from));
}

function importsOf(file) {
  const text = read(file);
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
  const name = file.match(/^packages\/agent-ui\/src\/(?:react|web)\/([^/]+)\.tsx?$/)?.[1];
  if (name && existsSync(join(root, `${src}styles/${name}.css`))) imports.push(`${src}styles/${name}.css`);
  return imports;
}

function loadGraph() {
  const files = execFileSync("git", ["ls-files", src, "packages/agent-ui/tests/fixtures", "tests/browser"], {
    cwd: root,
    encoding: "utf8",
  })
    .split("\n")
    .filter((file) => /\.(tsx?|css)$/.test(file));
  const dependents = new Map(files.map((file) => [file, new Set()]));
  for (const file of files) {
    if (file.endsWith(".css")) continue;
    for (const dependency of importsOf(file)) dependents.get(dependency)?.add(file);
  }
  const specs = new Map(
    files
      .filter((file) => file.endsWith(".spec.ts"))
      .map((spec) => [spec, new Set([...read(spec).matchAll(/[?&]c=([\w-]+)/g)].map((match) => match[1]))]),
  );
  return { dependents, specs };
}

/** The specs `changed` can reach, sorted, or "all" when a file's reach is unknown. */
export function affectedSpecs(changed, { dependents, specs } = loadGraph()) {
  const affected = new Set();
  for (const file of changed) {
    if (unrelated.some((pattern) => pattern.test(file))) continue;
    if (!dependents.has(file)) return "all";
    const reached = new Set([file]);
    for (const each of reached) for (const dependent of dependents.get(each)) reached.add(dependent);
    const cases = new Set(
      [...reached]
        .map((each) => each.match(/\/fixtures\/(?:react|web)\/cases\/([^/.]+)\./)?.[1])
        .filter(Boolean),
    );
    const hits = [...specs].filter(
      ([spec, used]) => reached.has(spec) || [...used].some((name) => cases.has(name)),
    );
    if (!hits.length) return "all";
    for (const [spec] of hits) affected.add(spec);
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
