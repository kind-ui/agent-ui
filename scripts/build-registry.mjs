#!/usr/bin/env node
// Builds the registry from registry/catalog.mjs with the pinned shadcn CLI (spec §9.2).
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import catalog from "../registry/catalog.mjs";
import { checkUiSdkUsage } from "./check-ui-sdk-usage.mjs";

export const SHADCN = "shadcn@4.23.0";
export const NAMESPACE = "@kind-ui";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packageDir = join(root, "packages/agent-ui");
const outDir = join(root, "artifacts/registry");
const coreDir = join(packageDir, "src/core") + sep;
const sourceDir = "packages/agent-ui/src/";

const packageName = (specifier) => specifier.match(/^(@[^/]+\/)?[^/@]+/)?.[0] ?? specifier;
const splitVersion = (specifier) => {
  const at = specifier.lastIndexOf("@");
  return at > 0 ? [specifier.slice(0, at), specifier.slice(at + 1)] : [specifier, ""];
};

/** Bare imports each layer's files may make beyond their items' `dependencies`. */
const frameworkPackages = {
  react: ["react"],
  vue: ["vue"],
  svelte: ["svelte"],
  solid: ["solid-js", "@solidjs/web"],
};

/** Where shadcn writes a file in the consumer: React beside its `ui` components, other layers under `ui/<layer>`. */
export function targetOf(file) {
  if (file.startsWith(`${sourceDir}react/`)) return `@ui/${file.slice(`${sourceDir}react/`.length)}`;
  const layer = /^(web|vue|svelte|solid)\//.exec(file.slice(sourceDir.length))?.[1];
  if (file.startsWith(sourceDir) && layer) return `@ui/${file.slice(sourceDir.length)}`;
  return `@ui/${file.split("/").at(-1)}`;
}

function resolveImport(from, specifier) {
  const path = resolve(dirname(from), specifier);
  if (path.endsWith(".svelte")) return path;
  const base = path.replace(/\.js$/, "");
  return [".ts", ".tsx"].map((extension) => base + extension).find(existsSync);
}

/** A file's import specifiers; a Svelte component's come from its `<script>` blocks. */
function importsOf(file, text) {
  const code = file.endsWith(".svelte")
    ? [...text.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/g)].map((match) => match[1]).join("\n")
    : text;
  return ts.preProcessFile(code, true, true).importedFiles.map(({ fileName }) => fileName);
}

/** Errors that make the catalog unbuildable; empty when it is sound. */
export function validateCatalog(input, pkg) {
  const errors = [];
  const byName = new Map();
  for (const item of input.items) {
    if (byName.has(item.name)) errors.push(`duplicate item name "${item.name}"`);
    byName.set(item.name, item);
  }
  if (input.packageVersion !== pkg.version) {
    errors.push(`packageVersion ${input.packageVersion} differs from ${pkg.name}@${pkg.version}`);
  }
  const uiSdkPin = pkg.dependencies["@ui-sdk/core"];
  const pins = { [pkg.name]: pkg.version };

  const reachable = (item, seen = new Set()) => {
    if (seen.has(item)) return seen;
    seen.add(item);
    for (const dependency of item.registryDependencies) {
      const next = byName.get(dependency.slice(NAMESPACE.length + 1));
      if (next) reachable(next, seen);
    }
    return seen;
  };

  const usage = checkUiSdkUsage(packageDir, {});
  for (const item of input.items) {
    const where = `item "${item.name}"`;
    if (Boolean(item.hidden) !== item.name.startsWith("internal-")) {
      errors.push(`${where}: only internal-<name> items are hidden, and they all are`);
    }
    for (const dependency of item.registryDependencies) {
      const name = dependency.startsWith(`${NAMESPACE}/`) && dependency.slice(NAMESPACE.length + 1);
      if (!name || !byName.has(name))
        errors.push(`${where}: registry dependency ${dependency} is not an item`);
    }
    for (const dependency of item.dependencies) {
      const [name, version] = splitVersion(dependency);
      const pin = name.startsWith("@ui-sdk/") ? uiSdkPin : pins[name];
      if (!/^\d+\.\d+\.\d+(-[\w.]+)?$/.test(version))
        errors.push(`${where}: ${dependency} is not an exact version`);
      else if (pin && version !== pin)
        errors.push(`${where}: ${dependency} differs from the pin ${name}@${pin}`);
    }

    const closure = [...reachable(item)];
    const files = new Set(closure.flatMap((each) => each.files.map((file) => resolve(root, file))));
    const packages = new Set(closure.flatMap((each) => each.dependencies.map((d) => splitVersion(d)[0])));
    for (const name of frameworkPackages[item.layer] ?? []) packages.add(name);
    if (!item.files.length) errors.push(`${where}: ships no files`);
    for (const file of item.files) {
      const path = resolve(root, file);
      if (!existsSync(path)) {
        errors.push(`${where}: ${file} does not exist`);
        continue;
      }
      if (!/\.(tsx?|svelte)$/.test(file)) continue;
      for (const fileName of importsOf(file, readFileSync(path, "utf8"))) {
        if (!fileName.startsWith(".")) {
          if (!packages.has(packageName(fileName)))
            errors.push(`${where}: ${file} imports ${fileName}, not a dependency`);
          continue;
        }
        if (`${resolve(dirname(path), fileName)}${sep}`.startsWith(coreDir)) {
          errors.push(`${where}: ${file} imports core by a relative path; import ${pkg.name}/core`);
        } else if (!files.has(resolveImport(path, fileName))) {
          errors.push(`${where}: ${file} imports ${fileName}, which no item it depends on ships`);
        }
      }
      const prefix = `${relative(packageDir, path)}:`;
      for (const error of usage) if (error.startsWith(prefix)) errors.push(`${where}: ${error}`);
    }
  }
  return errors;
}

/** The shadcn registry.json for the catalog: files by repository path, hidden items marked in `meta`. */
export function toRegistry(input) {
  return {
    $schema: "https://ui.shadcn.com/schema/registry.json",
    name: "kind-ui",
    homepage: "https://kindui.dev/agent-ui/",
    items: input.items.map(({ layer, hidden, files, ...item }) => ({
      ...item,
      files: files.map((path) => ({
        path,
        type: path.endsWith(".md") ? "registry:file" : item.type,
        target: targetOf(path),
      })),
      ...(layer || hidden ? { meta: { layer, ...(hidden && { hidden }) } } : {}),
    })),
  };
}

function run(args) {
  console.log(`$ npx ${args.join(" ")}`);
  const result = spawnSync("npx", ["--yes", ...args], { cwd: root, stdio: "inherit" });
  if (result.status !== 0) {
    throw new Error(`${args.slice(0, 2).join(" ")} failed${result.error ? `: ${result.error.message}` : ""}`);
  }
}

function build() {
  const pkg = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
  const errors = validateCatalog(catalog, pkg);
  if (errors.length) throw new Error(`catalog is invalid:\n  ${errors.join("\n  ")}`);

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const registryFile = join(outDir, "registry.json");
  writeFileSync(registryFile, `${JSON.stringify(toRegistry(catalog), null, 2)}\n`);
  const registryPath = relative(root, registryFile);
  run([SHADCN, "registry", "validate", registryPath]);
  run([SHADCN, "build", registryPath, "--output", relative(root, join(outDir, "r"))]);

  for (const item of catalog.items) {
    const built = JSON.parse(readFileSync(join(outDir, "r", `${item.name}.json`), "utf8"));
    if (built.files.length !== item.files.length) throw new Error(`${item.name}: the build dropped a file`);
    built.files.forEach((file, index) => {
      if (file.content !== readFileSync(join(root, item.files[index]), "utf8")) {
        throw new Error(`${item.name}: ${item.files[index]} differs from its source after the build`);
      }
    });
  }
  console.log(`built ${catalog.items.length} items into ${relative(root, join(outDir, "r"))}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    build();
  } catch (error) {
    console.error(`build-registry: ${error.message}`);
    process.exit(1);
  }
}
