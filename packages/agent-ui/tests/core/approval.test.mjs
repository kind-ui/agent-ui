import assert from "node:assert/strict";
import { test } from "node:test";
import {
  approvalKey,
  approvalLabel,
  approvalMark,
  codeSpans,
  isActionable,
  isSettled,
  plainText,
} from "@kind-ui/agent-ui/core";

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

test("outcomes in the shared words, with what and where an Always allow reaches", () => {
  const decided = (state, decision) => ({ ...approval(state), decision });
  const always = { target: "npm test", scope: "in this project" };
  assert.equal(approvalLabel(decided("responded", { approved: true })), "Approved");
  assert.equal(approvalLabel(decided("auto", { approved: true })), "Approved automatically");
  assert.equal(
    approvalLabel(decided("responded", { approved: true, always: true }), always),
    "Always allowed `npm test` in this project",
  );
  // The host's recorded scope wins over the option's.
  assert.equal(
    approvalLabel(decided("responded", { approved: true, always: true, scope: "in this session" }), always),
    "Always allowed `npm test` in this session",
  );
  assert.equal(approvalLabel(decided("responded", { approved: false })), "Denied");
  assert.equal(approvalLabel(decided("responded", { approved: false, reason: "Too broad" })), "Denied:");
  assert.equal(approvalLabel(approval("expired")), "Expired before a decision");
  assert.equal(approvalLabel(approval("cancelled")), "Cancelled before a decision");
});

test("one mark per outcome", () => {
  const decided = (state, approved) => ({ ...approval(state), decision: { approved } });
  assert.equal(approvalMark(decided("responded", true)), "complete");
  assert.equal(approvalMark(decided("auto", true)), "complete");
  assert.equal(approvalMark(decided("responded", false)), "denied");
  assert.equal(approvalMark(approval("expired")), "expired");
  assert.equal(approvalMark(approval("cancelled")), "cancelled");
  assert.equal(approvalMark(approval("requested")), "awaiting-input");
  assert.equal(isSettled("expired"), true);
  assert.equal(isSettled("submitting"), false);
});

test("backticks mark code", () => {
  assert.deepEqual(codeSpans("Run `npm test`?"), ["Run ", "npm test", "?"]);
  assert.deepEqual(codeSpans("a ` b"), ["a ` b"]);
  assert.equal(plainText("Allow `search_docs`?"), "Allow search_docs?");
});
