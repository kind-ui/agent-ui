#!/usr/bin/env node
// Ordered check runner for the root scripts (spec §2 "Root scripts").
import { spawnSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const stages = {
  "lint:biome": ["npx", "biome", "check", "."],
  "lint:guard": ["node", "scripts/check-ui-sdk-usage.mjs"],
  build: ["npm", "run", "build", "-w", "@kind-ui/agent-ui"],
  "typecheck:extra": ["npx", "tsc", "-p", "tsconfig.checks.json"],
  "typecheck:types": ["npx", "tsc", "-p", "tests/types/nodenext/tsconfig.json"],
  "typecheck:bundler": ["npx", "tsc", "-p", "tests/types/bundler/tsconfig.json"],
  "typecheck:with-ai": ["npx", "tsc", "-p", "tests/types/with-ai/tsconfig.json"],
  "typecheck:no-ai": ["npx", "tsc", "-p", "tests/types/no-ai/tsconfig.json"],
  "test:scripts": ["node", "--test", "scripts/tests/*.test.mjs"],
  "test:unit:run": ["node", "--test", "packages/agent-ui/tests/core/*.test.mjs"],
  "test:browser": ["npx", "playwright", "test"],
  "check:package": ["node", "scripts/check-package.mjs"],
  "check:size:run": ["node", "scripts/check-size.mjs"],
  "build:registry": ["node", "scripts/build-registry.mjs"],
  "check:registry-consumers": ["node", "scripts/check-registry-consumers.mjs"],
  "dev:docs:run": ["npm", "run", "dev", "-w", "apps/docs"],
  "build:docs:run": ["npm", "run", "build", "-w", "apps/docs"],
  "check:docs": ["node", "scripts/check-docs.mjs"],
};

const groups = {
  lint: ["lint:biome", "lint:guard"],
  typecheck: [
    "build",
    "typecheck:extra",
    "typecheck:types",
    "typecheck:bundler",
    "typecheck:with-ai",
    "typecheck:no-ai",
  ],
  // Unit tests import the package by name, which resolves to the built dist.
  "test:unit": ["build", "test:unit:run"],
  "check:size": ["build", "check:size:run"],
  // The docs render the registry's source files, which import the package's built core.
  "dev:docs": ["build", "dev:docs:run"],
  "build:docs": ["build", "build:docs:run", "check:docs"],
  "check:fast": ["lint", "typecheck", "test:scripts", "test:unit"],
  "check:packed": ["check:package", "check:size", "build:registry", "check:registry-consumers"],
  check: ["check:fast", "check:packed", "build:docs:run", "check:docs", "test:browser"],
};

export function expand(name) {
  if (groups[name]) return groups[name].flatMap(expand);
  if (!stages[name]) throw new Error(`unknown stage: ${name}`);
  return [name];
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [target, ...extra] = process.argv.slice(2);
  if (!target) {
    console.error(`usage: run-checks.mjs <${[...Object.keys(groups), ...Object.keys(stages)].join("|")}>`);
    process.exit(2);
  }
  const plan = expand(target);
  for (const name of plan) {
    const [command, ...args] = stages[name];
    console.log(`> ${name}`);
    const result = spawnSync(command, name === plan.at(-1) ? [...args, ...extra] : args, {
      cwd: root,
      stdio: "inherit",
    });
    if (result.error) console.error(`${name}: ${result.error.message}`);
    if (result.status !== 0) process.exit(result.status ?? 1);
  }
}
