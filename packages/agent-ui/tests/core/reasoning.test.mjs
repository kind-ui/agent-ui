import assert from "node:assert/strict";
import { test } from "node:test";
import { reasoningTitle } from "@kind-ui/agent-ui/core";

test("thinking until done", () => {
  for (const status of ["pending", "running", "awaiting-input"])
    assert.equal(reasoningTitle(status, 4), "Thinking");
});

test("rounds the duration, at least 1 s", () => {
  assert.equal(reasoningTitle("complete", 2.6), "Thought for 3 s");
  assert.equal(reasoningTitle("complete", 0.2), "Thought for 1 s");
  assert.equal(reasoningTitle("error", 5), "Thought for 5 s");
});

test("no duration, or one that isn't a number", () => {
  assert.equal(reasoningTitle("complete"), "Thought");
  assert.equal(reasoningTitle("complete", Number.NaN), "Thought");
  assert.equal(reasoningTitle("complete", Number.POSITIVE_INFINITY), "Thought");
});
