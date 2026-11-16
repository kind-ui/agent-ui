import assert from "node:assert/strict";
import { test } from "node:test";
import { approvalKey, isActionable } from "@kind-ui/agent-ui/core";

const approval = (state, generation = 1) => ({ approvalId: "a", generation, state });

test("a replaced request has a new key", () => {
  assert.equal(approvalKey(approval("requested")), "a:1");
  assert.notEqual(approvalKey(approval("requested", 2)), approvalKey(approval("requested")));
});

test("actionable approvals", () => {
  assert.equal(isActionable(approval("requested")), true);
  assert.equal(isActionable(approval("submit-failed")), true);
  assert.equal(isActionable(approval("submitting")), false);
  assert.equal(isActionable(approval("responded")), false);
  assert.equal(isActionable(approval("auto")), false);
  assert.equal(isActionable(undefined), false);
});
