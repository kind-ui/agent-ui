import assert from "node:assert/strict";
import { test } from "node:test";
import { itemProgress, itemsStatus, planPrimitive, taskPrimitive } from "@kind-ui/agent-ui/core";

const st = (status) => ({ status });
const item = (id, status) => ({ id, status, title: id });

test("task progress counts complete", () =>
  assert.deepEqual(itemProgress([st("complete"), st("running"), st("error")], ["complete"]), {
    done: 1,
    total: 3,
    percent: 33,
  }));

test("plan progress counts skipped as done", () =>
  assert.deepEqual(itemProgress([st("complete"), st("skipped")], ["complete", "skipped"]), {
    done: 2,
    total: 2,
    percent: 100,
  }));

test("empty list", () => assert.deepEqual(itemProgress([], ["complete"]), { done: 0, total: 0, percent: 0 }));

test("the items add up to the step's status", () => {
  const done = ["complete"];
  assert.equal(itemsStatus([], done), "pending");
  assert.equal(itemsStatus([st("pending"), st("pending")], done), "pending");
  assert.equal(itemsStatus([st("complete"), st("pending")], done), "running");
  assert.equal(itemsStatus([st("complete"), st("complete")], done), "complete");
  assert.equal(itemsStatus([st("complete"), st("error"), st("running")], done), "error");
});

test("a host status wins over the items'", () => {
  const task = taskPrimitive({ items: [item("a", "complete")], status: "awaiting-input" });
  assert.equal(task.get().status, "awaiting-input");
  task.setOptions({ items: [item("a", "complete")] });
  assert.equal(task.get().status, "complete");
});

test("accept is offered only with onAccept, and once while pending", async () => {
  assert.equal(planPrimitive({ items: [] }).api.accept, undefined);
  let calls = 0;
  let reject;
  const plan = planPrimitive({
    items: [],
    onAccept: () => {
      calls++;
      return new Promise((_resolve, fail) => {
        reject = fail;
      });
    },
  });
  plan.api.accept();
  assert.equal(plan.api.accept, undefined);
  assert.equal(calls, 1);
  reject(new Error("no"));
  await new Promise((resolve) => setTimeout(resolve));
  assert.equal(typeof plan.api.accept, "function");
  assert.equal(plan.get().pending, false);
});

test("an onAccept that throws gives Accept back", async () => {
  const plan = planPrimitive({
    items: [],
    onAccept: () => {
      throw new Error("no");
    },
  });
  plan.api.accept();
  await new Promise((resolve) => setTimeout(resolve));
  assert.equal(plan.get().pending, false);
  assert.equal(typeof plan.api.accept, "function");
});
