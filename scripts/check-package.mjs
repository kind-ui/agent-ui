#!/usr/bin/env node
// Packs @kind-ui/agent-ui and checks the tarball the way a consumer gets it (spec §10 "Packed package").
import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packageDir = join(root, "packages/agent-ui");
const outDir = join(root, "artifacts/package");
const tsc = join(root, "node_modules/typescript/bin/tsc");

const FORBIDDEN_IMPORTS = ["react", "react-dom", "ai"];
const REQUIRED_FILES = ["dist/styles/agent-ui.css", "LICENSE", "THIRD_PARTY_NOTICES.md"];

/** Packages from FORBIDDEN_IMPORTS that the given JavaScript files import, in the order found. */
export function findForbiddenImports(files) {
  const found = new Set();
  for (const file of files) {
    const { importedFiles } = ts.preProcessFile(readFileSync(file, "utf8"), true, true);
    for (const { fileName } of importedFiles) {
      const name = fileName.split("/")[0];
      if (FORBIDDEN_IMPORTS.includes(name)) found.add(name);
    }
  }
  return [...found];
}

function run(command, args, cwd = root, name = `${command} ${args[0]}`) {
  console.log(`$ ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, { cwd, stdio: ["ignore", "pipe", "inherit"], encoding: "utf8" });
  if (result.status !== 0) {
    process.stdout.write(result.stdout ?? "");
    throw new Error(`${name} failed${result.error ? `: ${result.error.message}` : ""}`);
  }
  return result.stdout;
}

const compilerOptions = {
  target: "ES2022",
  lib: ["ES2022", "DOM", "DOM.Iterable"],
  strict: true,
  noUncheckedIndexedAccess: true,
  exactOptionalPropertyTypes: true,
  verbatimModuleSyntax: true,
  isolatedModules: true,
  noEmit: true,
  types: [],
  skipLibCheck: false,
};

function typecheck(consumer, name, options, files) {
  const config = join(consumer, `tsconfig.${name}.json`);
  writeFileSync(config, JSON.stringify({ compilerOptions: { ...compilerOptions, ...options }, files }));
  run("node", [tsc, "-p", config], consumer, `tsc ${name}`);
}

function check() {
  const pkg = JSON.parse(readFileSync(join(packageDir, "package.json"), "utf8"));
  const entries = Object.keys(pkg.exports)
    .filter((entry) => !entry.endsWith(".css"))
    .map((entry) => pkg.name + entry.slice(1));

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const [packed] = JSON.parse(run("npm", ["pack", "--json", "--pack-destination", outDir], packageDir));
  const tarball = join(outDir, packed.filename);
  const files = packed.files.map((file) => file.path);
  const missing = REQUIRED_FILES.filter((file) => !files.includes(file));
  if (missing.length) throw new Error(`tarball is missing ${missing.join(", ")}`);
  const sources = files.filter((file) => file.startsWith("src/"));
  if (sources.length) throw new Error(`tarball ships sources: ${sources.join(", ")}`);

  run("npx", ["publint", "run", tarball, "--strict"]);
  // ESM only, and the stylesheet has no types to resolve.
  run("npx", ["attw", tarball, "--profile", "esm-only", "--exclude-entrypoints", "./styles.css"]);

  const consumer = mkdtempSync(join(tmpdir(), "agent-ui-packed-"));
  try {
    writeFileSync(
      join(consumer, "package.json"),
      JSON.stringify({ name: "consumer", private: true, type: "module" }),
    );
    run("npm", ["install", tarball, "--no-audit", "--no-fund", "--no-package-lock"], consumer);
    if (existsSync(join(consumer, "node_modules/ai"))) throw new Error("installing the package installed ai");

    const installed = join(consumer, "node_modules", pkg.name);
    const scripts = readdirSync(join(installed, "dist"), { recursive: true })
      .filter((file) => file.endsWith(".js"))
      .map((file) => join(installed, "dist", file));
    const forbidden = findForbiddenImports(scripts);
    if (forbidden.length) throw new Error(`dist imports ${forbidden.join(", ")} at runtime`);

    writeFileSync(
      join(consumer, "import.mjs"),
      `${entries.map((entry) => `await import(${JSON.stringify(entry)});`).join("\n")}
import { existsSync } from "node:fs";
if (!existsSync(new URL(import.meta.resolve("${pkg.name}/styles.css")))) throw new Error("styles.css does not resolve");
`,
    );
    run("node", ["import.mjs"], consumer);

    cpSync(join(root, "tests/types/nodenext/types.ts"), join(consumer, "types.ts"));
    cpSync(join(root, "tests/types/no-ai/index.ts"), join(consumer, "no-ai.ts"));
    writeFileSync(
      join(consumer, "entries.ts"),
      entries.map((entry, index) => `export * as entry${index} from ${JSON.stringify(entry)};`).join("\n"),
    );
    for (const [name, resolution] of [
      ["nodenext", { module: "NodeNext", moduleResolution: "NodeNext" }],
      ["bundler", { module: "ESNext", moduleResolution: "Bundler" }],
    ]) {
      typecheck(consumer, name, resolution, ["types.ts", "no-ai.ts"]);
      // `@ui-sdk/core`'s declarations fail under exactOptionalPropertyTypes.
      typecheck(consumer, `${name}-entries`, { ...resolution, exactOptionalPropertyTypes: false }, [
        "entries.ts",
      ]);
    }

    run(
      "npm",
      ["install", `ai@${pkg.devDependencies.ai}`, "--no-audit", "--no-fund", "--no-package-lock"],
      consumer,
    );
    cpSync(join(root, "tests/types/with-ai/adapter.ts"), join(consumer, "adapter.ts"));
    // `ai`'s own declarations fail under exactOptionalPropertyTypes.
    typecheck(consumer, "with-ai", { module: "NodeNext", moduleResolution: "NodeNext", skipLibCheck: true }, [
      "adapter.ts",
    ]);
  } finally {
    rmSync(consumer, { recursive: true, force: true });
  }

  const sha256 = createHash("sha256").update(readFileSync(tarball)).digest("hex");
  const manifest = { tarball: join("artifacts/package", packed.filename), sha256, version: pkg.version };
  writeFileSync(join(outDir, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(`packed ${manifest.tarball} (${sha256})`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    check();
  } catch (error) {
    console.error(`check-package: ${error.message}`);
    process.exit(1);
  }
}
