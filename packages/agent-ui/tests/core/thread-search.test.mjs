import assert from "node:assert/strict";
import { test } from "node:test";
import { threadSearchPrimitive } from "@kind-ui/agent-ui/core";

test("two searches with New chat keep their actions, and notify nothing, when their options don't change", () => {
  const onNew = () => {};
  const one = threadSearchPrimitive({ threads: [], onNew });
  const two = threadSearchPrimitive({ threads: [], onNew, newLabel: "New thread" });
  const before = one.get().actions;
  let notified = 0;
  one.subscribe(() => notified++);
  for (let i = 0; i < 3; i++) {
    one.setOptions({ threads: [], onNew });
    two.setOptions({ threads: [], onNew, newLabel: "New thread" });
  }
  assert.equal(one.get().actions, before);
  assert.equal(notified, 0);
});
