import assert from "node:assert/strict";
import { test } from "node:test";
import { testCounts, testItems, testResultsPrimitive } from "@kind-ui/agent-ui/core";

const suites = [
  {
    id: "auth",
    name: "auth",
    tests: [
      { id: "login", name: "logs in", status: "pass", durationMs: 12 },
      { id: "bad", name: "rejects a bad password", status: "fail", error: { message: "expected 401" } },
      { id: "sso", name: "signs in with SSO", status: "skip" },
    ],
  },
  { id: "cart", name: "cart", tests: [{ id: "add", name: "adds an item", status: "pass" }] },
  { id: "empty", name: "empty", tests: [] },
];

test("testCounts counts each status across suites", () => {
  assert.deepEqual(testCounts(suites), { pass: 2, fail: 1, skip: 1, total: 4 });
  assert.deepEqual(testCounts([]), { pass: 0, fail: 0, skip: 0, total: 0 });
});

test("testItems keeps the tests a filter lets through, and leaves out suites with none", () => {
  const values = (filter) =>
    testItems(suites, filter).map((suite) => [suite.value, suite.children.map((child) => child.value)]);
  assert.deepEqual(values("all"), [
    ["auth", ["auth/login", "auth/bad", "auth/sso"]],
    ["cart", ["cart/add"]],
  ]);
  assert.deepEqual(values("fail"), [["auth", ["auth/bad"]]]);
  assert.deepEqual(values("pass"), [
    ["auth", ["auth/login"]],
    ["cart", ["cart/add"]],
  ]);
  assert.deepEqual(values("skip"), [["auth", ["auth/sso"]]]);
  // A failed test is a branch with no children, which opens to its error.
  assert.deepEqual(testItems(suites, "fail")[0].children[0].children, []);
  assert.equal(testItems(suites, "pass")[0].children[0].children, undefined);
});

test("a run with a failure is an error, opens its failures and refuses unknown filters and rows", () => {
  const results = testResultsPrimitive({ suites });
  assert.equal(results.get().status, "error");
  assert.deepEqual(results.get().expanded, ["auth", "auth/bad"]);
  assert.equal(results.api.setFilter("broken"), false);
  assert.equal(results.api.setFilter("fail"), true);
  assert.equal(results.get().filter, "fail");
  assert.equal(results.api.expand("auth/login"), false);
  assert.equal(results.api.collapse("auth"), true);
  assert.deepEqual(results.get().expanded, ["auth/bad"]);
  assert.equal(results.api.expand("auth/bad"), true);
  assert.deepEqual(results.get().expanded, ["auth/bad", "auth"]);
  assert.equal(testResultsPrimitive({ suites: [suites[1]] }).get().status, "complete");
});

test("host data a reporter wrote as is still reads right", () => {
  const results = testResultsPrimitive({
    filter: "failed",
    suites: [
      {
        id: "__proto__",
        name: "proto",
        tests: [{ id: "t", name: "x", status: "passed", durationMs: 999.6 }],
      },
    ],
  });
  assert.equal(results.get().filter, "all");
  assert.deepEqual(results.get().counts, { pass: 0, fail: 0, skip: 1, total: 1 });
  assert.equal(results.get().rows.__proto__.name, "proto");
  assert.equal(results.get().rows["__proto__/t"].duration, "1.0 s");
});

test("a failed test that's gone closes", () => {
  const results = testResultsPrimitive({ suites });
  results.setOptions({ suites: [suites[1]] });
  assert.deepEqual(results.get().expanded, []);
});
