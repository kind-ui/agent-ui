#!/usr/bin/env node
// Packs the built docs site and registry into the release asset kindui.dev serves (spec §9.6 "Handoff"):
// artifacts/site/agent-ui-site-<version>.tar.gz, with docs/ and r/ at its root, and its .sha256.
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cpSync, existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const { version } = JSON.parse(readFileSync(join(root, "packages/agent-ui/package.json"), "utf8"));
const outDir = join(root, "artifacts/site");
const stage = join(outDir, "stage");
const sources = { docs: "apps/docs/out", r: "artifacts/registry/r" };

rmSync(outDir, { recursive: true, force: true });
for (const [name, source] of Object.entries(sources)) {
  if (!existsSync(join(root, source)))
    throw new Error(`${source} is missing; run \`npm run build:docs\` and \`npm run build:registry\``);
  cpSync(join(root, source), join(stage, name), { recursive: true });
}
const asset = `agent-ui-site-${version}.tar.gz`;
execFileSync("tar", ["-czf", join(outDir, asset), "-C", stage, ...Object.keys(sources)]);
rmSync(stage, { recursive: true });
const sha256 = createHash("sha256")
  .update(readFileSync(join(outDir, asset)))
  .digest("hex");
writeFileSync(join(outDir, `${asset}.sha256`), `${sha256}  ${asset}\n`);
console.log(`packed artifacts/site/${asset} (${sha256})`);
