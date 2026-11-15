#!/usr/bin/env node
// Fails when a public entry, bundled with its dependencies, minified and gzipped, grows past its limit in
// size-budget.json. Reads the built dist, so run it after `npm run build`.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";
import { build } from "vite";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const budget = JSON.parse(readFileSync(join(root, "size-budget.json"), "utf8"));
const pkg = JSON.parse(readFileSync(join(root, "packages/agent-ui/package.json"), "utf8"));

async function gzippedSize(entry) {
  const [output] = await build({
    configFile: false,
    logLevel: "silent",
    build: {
      write: false,
      minify: true,
      lib: { entry: fileURLToPath(import.meta.resolve(entry)), formats: ["es"] },
    },
  });
  return output.output.reduce((total, chunk) => total + gzipSync(chunk.code ?? chunk.source).length, 0);
}

let over = false;
for (const entry of Object.keys(pkg.exports).filter((entry) => !entry.endsWith(".css"))) {
  const limit = budget[entry];
  if (limit === undefined) {
    console.log(`missing: ${entry} has no limit in size-budget.json`);
    over = true;
    continue;
  }
  const size = await gzippedSize(pkg.name + entry.slice(1));
  over ||= size > limit;
  console.log(`${size > limit ? "over" : "ok"}: ${entry} ${size} B gzip (limit ${limit} B)`);
}
if (over) process.exit(1);
