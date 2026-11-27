import assert from "node:assert/strict";
import { test } from "node:test";
import {
  messagePrimitive,
  messageRetryText,
  retryText,
  stalledFor,
  stalledText,
} from "@kind-ui/agent-ui/core";

test("the retry line leads with what it's doing and counts only while there's time left", () => {
  assert.equal(retryText({ attempt: 2, maxAttempts: 5 }, 4), "Retrying in 4 sec, attempt 2 of 5");
  assert.equal(retryText({ attempt: 2, maxAttempts: 5 }, null), "Retrying, attempt 2 of 5");
  assert.equal(retryText({ attempt: 3 }, 0), "Retrying, attempt 3");
});

test("delivery is a user message's footer, and Withdraw locks until the host answers", async () => {
  const calls = [];
  const message = messagePrimitive({
    messageRole: "user",
    delivery: "steering",
    onWithdraw: (details) => calls.push(details.reason),
  });
  assert.equal(message.get().delivery, "steering");
  assert.equal(typeof message.api.resend, "undefined");
  message.api.withdraw();
  assert.equal(message.api.withdraw, undefined, "pending");
  await new Promise((resolve) => setTimeout(resolve));
  assert.equal(message.api.withdraw, undefined, "resolved, still locked");
  message.setOptions({ messageRole: "user", delivery: "queued", onWithdraw: () => {} });
  assert.equal(typeof message.api.withdraw, "function");
  assert.deepEqual(calls, ["imperative"]);
  message.setOptions({ messageRole: "assistant", delivery: "queued", onWithdraw: () => {} });
  assert.equal(message.get().delivery, undefined, "only a user message has a delivery");
});

test("Retry shows on a message that wasn't sent", () => {
  const message = messagePrimitive({ messageRole: "user", delivery: "not-sent", onResend: () => {} });
  assert.equal(message.api.withdraw, undefined);
  assert.equal(typeof message.api.resend, "function");
});

test("retrying offers Retry now until the attempt changes, and ends in Failed after N attempts", async () => {
  const retry = { attempt: 2, maxAttempts: 5, reason: "Rate limited" };
  const message = messagePrimitive({
    status: "streaming",
    retry,
    onRetryNow: () => {},
    onCancelRetry: () => {},
  });
  assert.equal(messageRetryText(message.get()), "Retrying, attempt 2 of 5");
  message.api.retryNow();
  await new Promise((resolve) => setTimeout(resolve));
  assert.equal(message.api.retryNow, undefined);
  assert.equal(message.api.cancelRetry, undefined);
  message.setOptions({ status: "streaming", retry: { ...retry, attempt: 3 }, onRetryNow: () => {} });
  assert.equal(typeof message.api.retryNow, "function");
  message.setOptions({ status: "error", retry: { ...retry, attempt: 5 }, onRetryNow: () => {} });
  assert.equal(message.api.retryNow, undefined, "no longer retrying");
});

test("a running state is stalled once nothing arrives for stalledAfter seconds", () => {
  const at = "2026-11-26T10:00:00Z";
  const now = Date.parse(at);
  assert.equal(stalledFor(at, now + 119_000), null);
  assert.equal(stalledFor(at, now + 120_000), 2);
  assert.equal(stalledFor(at, now + 30_000, 30), 1);
  assert.equal(stalledFor(undefined, now), null);
  assert.equal(stalledText(5), "No update for 5 min");
});
