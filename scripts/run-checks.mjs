#!/usr/bin/env node
// Ordered check runner for the root scripts (spec §2 "Root scripts").
// A stage whose script file does not exist yet is skipped with `skipped: <stage>`.
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const stages = {
  "lint:biome": { needs: "biome.json", run: ["npx", "biome", "check", "."] },
  "lint:guard": { needs: "scripts/check-ui-sdk-usage.mjs", run: ["node", "scripts/check-ui-sdk-usage.mjs"] },
  build: { needs: "packages/agent-ui/tsconfig.json", run: ["npx", "tsc", "-b", "packages/agent-ui"] },
  "typecheck:extra": { needs: "tsconfig.checks.json", run: ["npx", "tsc", "-p", "tsconfig.checks.json"] },
  "typecheck:types": {
    needs: "tests/types/nodenext/tsconfig.json",
    run: ["npx", "tsc", "-p", "tests/types/nodenext/tsconfig.json"],
  },
  "typecheck:with-ai": {
    needs: "tests/types/with-ai/tsconfig.json",
    run: ["npx", "tsc", "-p", "tests/types/with-ai/tsconfig.json"],
  },
  "typecheck:no-ai": {
    needs: "tests/types/no-ai/tsconfig.json",
    run: ["npx", "tsc", "-p", "tests/types/no-ai/tsconfig.json"],
  },
  "test:scripts": { needs: "scripts/tests", run: ["node", "--test", "scripts/tests/*.test.mjs"] },
  "test:unit:run": {
    needs: "packages/agent-ui/tests/core",
    run: ["node", "--test", "packages/agent-ui/tests/core/*.test.mjs"],
  },
  "test:browser": { needs: "playwright.config.mjs", run: ["npx", "playwright", "test"] },
  "check:package": { needs: "scripts/check-package.mjs", run: ["node", "scripts/check-package.mjs"] },
  "build:registry": { needs: "scripts/build-registry.mjs", run: ["node", "scripts/build-registry.mjs"] },
  "check:registry-consumers": {
    needs: "scripts/check-registry-consumers.mjs",
    run: ["node", "scripts/check-registry-consumers.mjs"],
  },
  "dev:docs": { needs: "apps/docs/package.json", run: ["npm", "run", "dev", "-w", "apps/docs"] },
  "build:docs": { needs: "apps/docs/package.json", run: ["npm", "run", "build", "-w", "apps/docs"] },
};

const groups = {
  lint: ["lint:biome", "lint:guard"],
  typecheck: ["build", "typecheck:extra", "typecheck:types", "typecheck:with-ai", "typecheck:no-ai"],
  // Unit tests import the package by name, which resolves to the built dist.
  "test:unit": ["build", "test:unit:run"],
  "check:fast": ["lint", "typecheck", "test:scripts", "test:unit"],
  "check:packed": ["check:package", "build:registry", "check:registry-consumers"],
  check: ["check:fast", "check:packed", "test:browser"],
};

function expand(name) {
  if (groups[name]) return groups[name].flatMap(expand);
  const stage = stages[name];
  if (!stage) throw new Error(`unknown stage: ${name}`);
  return [name];
}

const [target, ...extra] = process.argv.slice(2);
if (!target) {
  console.error(`usage: run-checks.mjs <${[...Object.keys(groups), ...Object.keys(stages)].join("|")}>`);
  process.exit(2);
}

const plan = expand(target);
for (const name of plan) {
  const stage = stages[name];
  if (!existsSync(join(root, stage.needs))) {
    console.log(`skipped: ${name}`);
    continue;
  }
  const args = name === plan.at(-1) ? [...stage.run.slice(1), ...extra] : stage.run.slice(1);
  console.log(`> ${name}`);
  const result = spawnSync(stage.run[0], args, { cwd: root, stdio: "inherit" });
  if (result.error) console.error(`${name}: ${result.error.message}`);
  if (result.status !== 0) process.exit(result.status ?? 1);
}
