import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
  assert.deepEqual(release.jobs.publish.needs, ["plan", "validate", "browser", "verify"]);
  assert.equal(release.jobs.publish.environment, "npm-release");
  assert.equal(release.jobs.publish.permissions["id-token"], "write");
  assert.match(
    runs(release.jobs.publish),
    /npm publish "\$TARBALL" --ignore-scripts --access public --tag "\$DIST_TAG"/,
  );
  const publishStep = release.jobs.publish.steps.find((step) => step.run?.includes("npm publish"));
  assert.equal(publishStep.env.NODE_AUTH_TOKEN, "${{ secrets.NPM_TOKEN }}");
  assert.match(runs(release.jobs.plan), /private === true/);
});

test("plan skips the push that adds the package", (t) => {
  const dir = mkdtempSync(join(tmpdir(), "release-plan-"));
  t.after(() => rmSync(dir, { recursive: true, force: true }));
  const git = (...args) =>
    execFileSync("git", ["-c", "user.name=t", "-c", "user.email=t@t", ...args], { cwd: dir });
  git("init", "-q");
  git("commit", "-q", "--allow-empty", "-m", "before");
  mkdirSync(join(dir, "packages/agent-ui"), { recursive: true });
  writeFileSync(join(dir, "packages/agent-ui/package.json"), '{"version":"0.0.0","private":true}');
  git("add", ".");
  git("commit", "-q", "-m", "add package");
  const output = join(dir, "output");
  writeFileSync(output, "");
  execFileSync("bash", ["-e", "-c", release.jobs.plan.steps.find((step) => step.id === "plan").run], {
    cwd: dir,
    env: { ...process.env, GITHUB_EVENT_NAME: "push", GITHUB_OUTPUT: output },
    stdio: "pipe",
  });
  assert.equal(readFileSync(output, "utf8"), "release=false\n");
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

test("release validation runs every stage of npm run check, browser tests in eight shards", () => {
  const { validate, browser, verify } = release.jobs;
  const targets = [...runs(validate).matchAll(/run-checks\.mjs (\S+)/g)].map(([, target]) => target);
  const covered = new Set([
    ...targets.flatMap(expand),
    ...(/npm run test:browser/.test(runs(browser)) ? ["test:browser"] : []),
  ]);
  assert.deepEqual(
    expand("check").filter((stage) => !covered.has(stage)),
    [],
  );
  assert.deepEqual(browser.strategy.matrix.shard, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.match(runs(browser), /--shard=\$\{\{ matrix\.shard \}\}\/8/);
  assert.deepEqual(verify.needs, ["plan", "validate", "browser"]);
});

test("ci runs browser tests in eight shards", () => {
  assert.deepEqual(ci.jobs.browser.strategy.matrix.shard, [1, 2, 3, 4, 5, 6, 7, 8]);
  assert.match(runs(ci.jobs.browser), /--shard=\$\{\{ matrix\.shard \}\}\/8/);
});

test("ci fast job runs the lint stages, and so the UI SDK guard", () => {
  assert.match(runs(ci.jobs.fast), /npm run check:fast/);
  assert.ok(expand("check:fast").includes("lint:guard"));
});

test("renovate updates only @ui-sdk/*, never automerging", () => {
  const config = JSON.parse(read("renovate.json"));
  const [rest, uiSdk] = config.packageRules;
  assert.deepEqual([rest.matchPackageNames, rest.enabled], [["*"], false]);
  assert.deepEqual(uiSdk.matchPackageNames, ["@ui-sdk/**"]);
  assert.deepEqual(uiSdk.labels, ["ui-sdk-update"]);
  assert.equal(uiSdk.rangeStrategy, "pin");
  assert.ok(!JSON.stringify(config).includes('"automerge":true'));
});

test("the UI SDK update agent pushes only to its pull request's branch", () => {
  const { adapt } = workflows["ui-sdk-update.yml"].jobs;
  assert.match(adapt.if, /startsWith\(github\.event\.pull_request\.head\.ref, 'renovate\/'\)/);
  assert.deepEqual(adapt.permissions, { contents: "read", "copilot-requests": "write" });
  const push = adapt.steps.find((step) => step.name === "Push to the pull request");
  for (const ref of ["main", "changeset-release/main"]) {
    assert.throws(
      () =>
        execFileSync("bash", ["-e", "-c", push.run], {
          env: { ...process.env, HEAD_REF: ref },
          stdio: "pipe",
        }),
      new RegExp(`Refusing to push to ${ref}`),
    );
  }
  assert.match(runs(adapt), /--deny-tool 'shell\(git push\)'/);
});
