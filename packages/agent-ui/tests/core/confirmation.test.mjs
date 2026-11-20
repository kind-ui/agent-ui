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
  confirmation.api.press("deny");
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

for (const late of ["resolve", "reject"]) {
  test(`a replaced generation drops the lock, and a late ${late} of the old one changes nothing`, async () => {
    const { confirmation, calls, replies, set, state } = setup();
    confirmation.api.approve();
    set(request("requested", 2));
    assert.equal(state().pending, false);
    confirmation.api.deny("Too broad");
    assert.deepEqual(calls[1].decision, { approvalId: "a", generation: 2, reason: "Too broad" });
    replies[0][late](new Error("late"));
    await tick();
    assert.equal(state().pending, true);
    assert.equal(state().sent, false);
    assert.equal(state().pressed, "deny");
  });
}

test("a host that reports back inside the callback leaves no choice marked", () => {
  const options = { approval: request("requested"), onApprove: () => {}, onDeny: () => {} };
  const confirmation = confirmationPrimitive({
    ...options,
    onApprove: () => {
      confirmation.setOptions({ ...options, approval: request("submit-failed") });
      return new Promise(() => {});
    },
  });
  confirmation.api.approve();
  assert.equal(confirmation.get().pressed, undefined);
  assert.equal(typeof confirmation.api.approve, "function");
});

test("a new request empties the reason, and a new generation keeps it", () => {
  const { confirmation, set, state } = setup();
  confirmation.api.deny("Too broad");
  set(request("requested", 2));
  assert.equal(state().reasonText, "Too broad");
  set({ ...request("requested"), approvalId: "b" });
  assert.equal(state().reasonText, "");
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

test("an automatic approval without a decision has no outcome to show", () => {
  const confirmation = confirmationPrimitive({ approval: request("auto") });
  assert.equal(confirmation.get().outcome, undefined);
});

test("with reason, a person's Deny opens the box first, and Cancel closes it without deciding", () => {
  const calls = [];
  const confirmation = confirmationPrimitive({
    approval: request("requested"),
    reason: true,
    onApprove: () => {},
    onDeny: (decision) => calls.push(decision),
  });
  confirmation.api.press("deny");
  assert.equal(confirmation.get().composing, true);
  assert.equal(calls.length, 0);
  confirmation.api.cancelReason();
  assert.equal(confirmation.get().composing, false);
  confirmation.api.press("deny");
  confirmation.api.press("deny");
  assert.deepEqual(calls, [{ approvalId: "a", generation: 1 }]);
});

test("an agent's deny decides at once without opening the box", () => {
  const calls = [];
  const confirmation = confirmationPrimitive({
    approval: request("requested"),
    reason: true,
    onDeny: (decision) => calls.push(decision),
  });
  confirmation.api.deny("Too broad");
  assert.equal(confirmation.get().composing, false);
  assert.deepEqual(calls, [{ approvalId: "a", generation: 1, reason: "Too broad" }]);
});
