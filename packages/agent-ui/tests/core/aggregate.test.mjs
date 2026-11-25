import assert from "node:assert/strict";
import { test } from "node:test";
import { aggregateStatus } from "@kind-ui/agent-ui/core";

test("aggregateStatus puts a waiting step first", () => {
  assert.equal(aggregateStatus(["complete", "awaiting-input", "running"]), "awaiting-input");
  assert.equal(aggregateStatus(["complete", "error", "running"]), "running");
  assert.equal(aggregateStatus(["complete", "error"]), "error");
  assert.equal(aggregateStatus(["cancelled", "cancelled"]), "cancelled");
  assert.equal(aggregateStatus([]), "pending");
});

test("aggregateStatus runs while a step is still to start after another started", () => {
  assert.equal(aggregateStatus(["pending", "pending"]), "pending");
  assert.equal(aggregateStatus(["complete", "pending"]), "running");
  assert.equal(aggregateStatus(["complete", "cancelled"]), "complete");
});
