import assert from "node:assert/strict";
import { test } from "node:test";
import { branchLabel, messagePrimitive } from "@kind-ui/agent-ui/core";

test("labels the branch shown out of all of them", () => {
  assert.equal(branchLabel(0, 3), "1 of 3");
  assert.equal(branchLabel(2, 3), "3 of 3");
});

test("asks for in-range branches only, and offers setBranch only with more than one", () => {
  const asked = [];
  const message = messagePrimitive({
    branchIndex: 1,
    branchCount: 3,
    onBranchChange: (index) => asked.push(index),
  });
  for (const index of [1, -1, 3, 0.5, 2]) message.api.setBranch(index);
  assert.deepEqual(asked, [2]);
  message.setOptions({ branchIndex: 0, branchCount: 1 });
  assert.equal(message.api.setBranch, undefined);
});

test("offers regenerate only once the message settles", () => {
  const message = messagePrimitive({ status: "streaming", onRegenerate: () => {} });
  assert.equal(message.api.regenerate, undefined);
  message.setOptions({ status: "complete", onRegenerate: () => {} });
  assert.equal(typeof message.api.regenerate, "function");
});

test("offers regenerate while its callback is set, and edit only on user messages", () => {
  const message = messagePrimitive({ messageRole: "assistant", onRegenerate: () => {}, onEdit: () => {} });
  assert.equal(typeof message.api.regenerate, "function");
  assert.equal(message.api.edit, undefined);
  message.setOptions({ messageRole: "user", onEdit: () => {} });
  assert.equal(message.api.regenerate, undefined);
  assert.equal(typeof message.api.edit, "function");
});
