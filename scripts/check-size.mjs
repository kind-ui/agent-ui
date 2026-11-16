#!/usr/bin/env node
// Fails when a public entry, bundled with its dependencies, minified and gzipped, grows past its limit in
// size-budget.json, or when an app importing one export of `./core` (`imports`) does: those prove the entry
// tree-shakes, so one component doesn't bring in every other. Reads the built dist, so run it after `npm run build`.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "vite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const budget = JSON.parse(readFileSync(join(root, "size-budget.json"), "utf8"));
const pkg = JSON.parse(readFileSync(join(root, "packages/agent-ui/package.json"), "utf8"));

// A module that exists only in the build, so the entry resolves the package as an app beside it would.
const ENTRY = join(root, "size-entry.js");

/** Bundles `code` as an app's only module would be, and returns its gzipped size. */
async function gzippedSize(code) {
  const [output] = await build({
    configFile: false,
    logLevel: "silent",
    plugins: [
      {
        name: "size-entry",
        resolveId: (id) => (id === ENTRY ? id : null),
        load: (id) => (id === ENTRY ? code : null),
      },
    ],
    build: { write: false, minify: true, lib: { entry: ENTRY, formats: ["es"], fileName: "entry" } },
  });
  return output.output.reduce((total, chunk) => total + gzipSync(chunk.code ?? chunk.source).length, 0);
}

let over = false;
const check = (name, size, limit) => {
  over ||= size > limit;
  console.log(`${size > limit ? "over" : "ok"}: ${name} ${size} B gzip (limit ${limit} B)`);
};

for (const entry of Object.keys(pkg.exports).filter((entry) => !entry.endsWith(".css"))) {
  const limit = budget[entry];
  if (limit === undefined) {
    console.log(`missing: ${entry} has no limit in size-budget.json`);
    over = true;
    continue;
  }
  check(entry, await gzippedSize(`export * from "${pkg.name + entry.slice(1)}";`), limit);
}
for (const [name, limit] of Object.entries(budget.imports)) {
  check(`./core ${name}`, await gzippedSize(`export { ${name} } from "${pkg.name}/core";`), limit);
}
if (over) process.exit(1);
