import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { test } from "node:test";
import { parse } from "yaml";
import { findCollisions } from "../check-registry-namespace.mjs";
import { expand } from "../run-checks.mjs";

const read = (path) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");
const workflowDir = ".github/workflows";
const workflows = Object.fromEntries(
  readdirSync(new URL(`../../${workflowDir}`, import.meta.url)).map((file) => [
    file,
    parse(read(`${workflowDir}/${file}`)),
  ]),
);
const ci = workflows["ci.yml"];
const release = workflows["release.yml"];
const runs = (job) => job.steps.map((step) => step.run ?? "").join("\n");

test("findCollisions flags charts items only", () =>
  assert.deepEqual(
    findCollisions(
      { items: [{ name: "line-chart" }, { name: "composer" }] },
      ["composer"],
      ["composer", "line-chart"],
    ),
    ["line-chart"],
  ));

test("publish job is guarded and uses npm-release", () => {
  assert.match(release.jobs.plan.if, /github\.repository == 'kind-ui\/agent-ui'/);
  assert.deepEqual(release.jobs.publish.needs, ["plan", "verify"]);
  assert.equal(release.jobs.publish.environment, "npm-release");
  assert.equal(release.jobs.publish.permissions["id-token"], "write");
  assert.match(
    runs(release.jobs.publish),
    /npm publish "\$TARBALL" --ignore-scripts --access public --tag "\$DIST_TAG"/,
  );
  assert.match(runs(release.jobs.plan), /private === true/);
});

test("all actions are pinned by SHA", () => {
  const steps = [
    ...Object.values(workflows).flatMap((workflow) =>
      Object.values(workflow.jobs).flatMap((job) => job.steps ?? []),
    ),
    ...parse(read(".github/actions/setup/action.yml")).runs.steps,
  ];
  for (const { uses } of steps.filter((step) => step.uses && !step.uses.startsWith("./"))) {
    assert.match(uses, /@[0-9a-f]{40}$/, uses);
  }
});

test("workflows grant least privilege", () => {
  for (const [file, workflow] of Object.entries(workflows)) {
    assert.ok(workflow.permissions, `${file} sets top-level permissions`);
    assert.ok(!Object.values(workflow.permissions).includes("write"), `${file} grants write only per job`);
  }
});

test("ci all-checks job requires fast, packed, docs, browser", () => {
  const allChecks = ci.jobs["all-checks"];
  assert.equal(allChecks.if, "always()");
  assert.deepEqual([...allChecks.needs].sort(), ["browser", "docs", "fast", "packed"]);
});

test("ci fast job runs the lint stages, and so the UI SDK guard", () => {
  assert.match(runs(ci.jobs.fast), /npm run check:fast/);
  assert.ok(expand("check:fast").includes("lint:guard"));
});
