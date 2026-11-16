import assert from "node:assert/strict";
import { test } from "node:test";
import { approvalLabel, toolStatus, toolValue } from "@kind-ui/agent-ui/core";

const call = (fields) => ({
  toolCallId: "t1",
  name: "search_docs",
  dynamic: false,
  input: { state: "ready", value: { query: "steps" } },
  ...fields,
});
const approval = (state, fields) => ({ approvalId: "a1", generation: 1, state, ...fields });

test("status follows the call", () => {
  assert.equal(toolStatus(call({ input: { state: "streaming", value: {} } })), "running");
  assert.equal(toolStatus(call({ approval: approval("requested") })), "awaiting-input");
  assert.equal(toolStatus(call({ approval: approval("submit-failed") })), "awaiting-input");
  assert.equal(
    toolStatus(call({ approval: approval("responded", { decision: { approved: true } }) })),
    "running",
  );
  assert.equal(toolStatus(call({ output: { state: "preliminary", value: 1 } })), "running");
  assert.equal(toolStatus(call({ output: { state: "available", value: null } })), "complete");
  assert.equal(toolStatus(call({ outcome: "denied" })), "cancelled");
  assert.equal(toolStatus(call({ outcome: "cancelled" })), "cancelled");
});

test("an outcome wins over an approval and output", () => {
  assert.equal(
    toolStatus(
      call({ outcome: "error", approval: approval("requested"), output: { state: "available", value: 1 } }),
    ),
    "error",
  );
});

test("falsy output is shown as itself", () => {
  for (const [value, code] of [
    [0, "0"],
    [false, "false"],
    ["", '""'],
    [null, "null"],
    [undefined, "undefined"],
  ])
    assert.deepEqual(toolValue(value), { kind: "code", code });
});

test("text output is markdown", () =>
  assert.deepEqual(toolValue("**ok**"), { kind: "markdown", text: "**ok**" }));

test("objects are indented JSON, and a cycle falls back to its string", () => {
  assert.deepEqual(toolValue({ hits: [1] }), { kind: "code", code: '{\n  "hits": [\n    1\n  ]\n}' });
  const cycle = {};
  cycle.self = cycle;
  assert.deepEqual(toolValue(cycle), { kind: "code", code: "[object Object]" });
});

test("approval labels", () => {
  assert.equal(approvalLabel(undefined), undefined);
  assert.equal(approvalLabel(approval("requested")), "Waiting for approval");
  assert.equal(approvalLabel(approval("submitting")), "Sending decision");
  assert.equal(approvalLabel(approval("submit-failed")), "Decision not sent");
  assert.equal(approvalLabel(approval("responded", { decision: { approved: true } })), "Approved");
  assert.equal(approvalLabel(approval("responded", { decision: { approved: false } })), "Denied");
  assert.equal(approvalLabel(approval("auto", { decision: { approved: false } })), "Denied automatically");
  assert.equal(approvalLabel(approval("auto", { decision: { approved: true } })), "Approved automatically");
});
