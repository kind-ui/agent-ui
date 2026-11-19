import assert from "node:assert/strict";
import { test } from "node:test";
import { planPrimitive } from "@kind-ui/agent-ui/core";

const items = (...ids) => ids.map((id) => ({ id, status: "pending", title: id }));
const tick = () => new Promise((resolve) => setTimeout(resolve));

test("a resolved accept marks this plan accepted, and a new plan offers Accept again", async () => {
  const options = { items: items("a", "b"), onAccept: () => Promise.resolve() };
  const plan = planPrimitive(options);
  plan.api.accept();
  await tick();
  assert.equal(plan.get().accepted, true);
  assert.equal(plan.api.accept, undefined);
  plan.setOptions({ ...options, items: items("c") });
  assert.equal(plan.get().accepted, false);
  assert.equal(typeof plan.api.accept, "function");
});

test("an accept of an earlier plan doesn't count for the one that replaced it", async () => {
  let resolve;
  const options = { items: items("a"), onAccept: () => new Promise((r) => (resolve = r)) };
  const plan = planPrimitive(options);
  plan.api.accept();
  plan.setOptions({ ...options, items: items("b") });
  resolve();
  await tick();
  assert.equal(plan.get().accepted, false);
});

test("the host's accepted wins, and leaving it out again falls back to the call", () => {
  const options = { items: items("a"), onAccept: () => {} };
  const plan = planPrimitive({ ...options, accepted: true });
  assert.equal(plan.get().accepted, true);
  plan.setOptions(options);
  assert.equal(plan.get().accepted, false);
});
