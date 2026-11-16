import assert from "node:assert/strict";
import { test } from "node:test";
import { confirmationPrimitive } from "@kind-ui/agent-ui/core";

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const request = (state, generation = 1, decision) => ({
  approvalId: "a",
  generation,
  state,
  ...(decision && { decision }),
});

const setup = () => {
  const calls = [];
  const replies = [];
  const answer = (choice) => (decision, details) => {
    calls.push({ choice, decision, details });
    const reply = deferred();
    replies.push(reply);
    return reply.promise;
  };
  const options = { approval: request("requested"), onApprove: answer("approve"), onDeny: answer("deny") };
  const confirmation = confirmationPrimitive(options);
  const set = (approval) => confirmation.setOptions({ ...options, approval });
  return { confirmation, calls, replies, set, state: () => confirmation.get() };
};

const tick = () => new Promise((resolve) => setTimeout(resolve));

test("a decision locks both choices at once, and a second one calls nothing", () => {
  const { confirmation, calls, state } = setup();
  confirmation.api.approve();
  assert.equal(state().pending, true);
  assert.equal(state().pressed, "approve");
  assert.equal(confirmation.api.approve, undefined);
  assert.equal(confirmation.api.deny, undefined);
  assert.equal(calls.length, 1);
  assert.deepEqual(calls[0].decision, { approvalId: "a", generation: 1 });
});

test("a rejection while the request is current makes it available again", async () => {
  const { confirmation, replies, state } = setup();
  confirmation.api.approve();
  replies[0].reject(new Error("offline"));
  await tick();
  assert.equal(state().pending, false);
  assert.equal(state().pressed, undefined);
  assert.equal(typeof confirmation.api.deny, "function");
});

test("host submitting keeps the lock, and submit-failed releases it", async () => {
  const { confirmation, replies, set, state } = setup();
  confirmation.api.approve();
  set(request("submitting"));
  replies[0].resolve();
  await tick();
  assert.equal(confirmation.api.approve, undefined);
  set(request("submit-failed"));
  assert.equal(state().pending, false);
  assert.equal(typeof confirmation.api.approve, "function");
});

test("a sent decision stays locked until the host reports on it", async () => {
  const { confirmation, replies, set, state } = setup();
  confirmation.api.approve();
  replies[0].resolve();
  await tick();
  assert.equal(state().sent, true);
  assert.equal(confirmation.api.approve, undefined);
  set(request("responded", 1, { approved: true }));
  assert.equal(state().sent, false);
  assert.equal(confirmation.api.approve, undefined);
});

test("a replaced generation drops the lock, and the old result is stale", async () => {
  const { confirmation, calls, replies, set, state } = setup();
  confirmation.api.approve();
  set(request("requested", 2));
  assert.equal(state().pending, false);
  confirmation.api.deny("Too broad");
  assert.deepEqual(calls[1].decision, { approvalId: "a", generation: 2, reason: "Too broad" });
  replies[0].reject(new Error("late"));
  replies[0].resolve();
  await tick();
  assert.equal(state().pending, true);
  assert.equal(state().pressed, "deny");
});

test("auto approvals render as status with no choices", () => {
  const confirmation = confirmationPrimitive({
    approval: request("auto", 1, { approved: true }),
    onApprove: () => {},
    onDeny: () => {},
  });
  assert.equal(confirmation.api.approve, undefined);
  assert.equal(confirmation.get().outcome, "Approved automatically");
});
