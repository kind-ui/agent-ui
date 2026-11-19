import assert from "node:assert/strict";
import { test } from "node:test";
import { approvalModePrimitive } from "@kind-ui/agent-ui/core";

const modes = [
  { value: "ask", label: "Ask every time" },
  { value: "full", label: "Full access", danger: true },
];

test("setValue refuses unknown modes and what the owner cancels, and names the trigger by the mode", () => {
  const calls = [];
  const instance = approvalModePrimitive({
    modes,
    defaultValue: "ask",
    onValueChange: (value, details) => {
      calls.push([value, details.reason]);
      if (value === "full" && calls.length === 1) details.cancel();
    },
  });
  const { api } = instance;
  assert.equal(api.setValue("nope"), false);
  assert.equal(api.setValue("ask"), true);
  assert.equal(api.setValue("full"), false);
  assert.equal(api.getValue(), "ask");
  assert.equal(api.setValue("full"), true);
  assert.equal(api.getValue(), "full");
  assert.deepEqual(calls, [
    ["full", "imperative"],
    ["full", "imperative"],
  ]);
  assert.equal(api.triggerState(instance.get())["aria-label"], "Approvals, Full access, risky");
});

test("a value that isn't one of the modes chooses none, and disabled offers no setValue", () => {
  const instance = approvalModePrimitive({ modes, value: "zzz", disabled: true });
  assert.equal(instance.api.getValue(), undefined);
  assert.equal(instance.api.contentState(instance.get()).value, null);
  assert.equal(instance.api.setValue, undefined);
  assert.deepEqual(instance.api.getModes(), []);
});
