import assert from "node:assert/strict";
import { test } from "node:test";
import { createPendingAction } from "@kind-ui/agent-ui/core";

const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

const setup = () => {
  let state = { pending: false };
  let key = "a:1";
  let destroy;
  const context = {
    store: { get: () => state, set: (next) => (state = { ...state, ...next }) },
    onDestroy: (fn) => (destroy = fn),
  };
  const action = createPendingAction(context, { state: "pending", key: () => key });
  return {
    action,
    store: context.store,
    setKey: (next) => (key = next),
    destroy: () => destroy(),
  };
};

test("a second run waits for the first", async () => {
  const { action, store } = setup();
  const first = deferred();
  const result = action.run(() => first.promise);
  let called = false;
  assert.equal(
    action.run(() => (called = true)),
    undefined,
  );
  assert.equal(called, false);
  assert.equal(store.get().pending, true);
  first.resolve();
  assert.equal(await result, "done");
  assert.equal(store.get().pending, false);
});

test("a rejection makes the action available again", async () => {
  const { action, store } = setup();
  assert.equal(await action.run(() => Promise.reject(new Error("x"))), "failed");
  assert.equal(store.get().pending, false);
  assert.notEqual(
    action.run(() => {}),
    undefined,
  );
});

test("a throw releases like a rejection", async () =>
  assert.equal(
    await setup().action.run(() => {
      throw new Error("x");
    }),
    "failed",
  ));

test("a result after the key changed is stale", async () => {
  const { action, store, setKey } = setup();
  const call = deferred();
  const result = action.run(() => call.promise);
  setKey("a:2");
  call.reject(new Error("late"));
  assert.equal(await result, "stale");
  assert.equal(store.get().pending, true);
});

test("release unlocks at once and makes the pending result stale", async () => {
  const { action, store } = setup();
  const first = deferred();
  const stale = action.run(() => first.promise);
  action.release();
  assert.equal(store.get().pending, false);
  const second = deferred();
  const fresh = action.run(() => second.promise);
  first.reject(new Error("late"));
  assert.equal(await stale, "stale");
  assert.equal(store.get().pending, true);
  second.resolve();
  assert.equal(await fresh, "done");
});

test("a result after destroy writes nothing", async () => {
  const { action, store, destroy } = setup();
  const call = deferred();
  const result = action.run(() => call.promise);
  destroy();
  call.resolve();
  assert.equal(await result, "stale");
  assert.equal(store.get().pending, true);
});
