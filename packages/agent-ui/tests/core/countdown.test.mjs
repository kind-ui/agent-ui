import assert from "node:assert/strict";
import { test } from "node:test";
import { countdownText, retryText } from "@kind-ui/agent-ui/core";

test("countdownText reads whole seconds", () => {
  assert.equal(countdownText(4, "en"), "in 4 sec");
  assert.equal(countdownText(72, "en"), "in 1 min 12 sec");
  assert.equal(countdownText(0, "en"), "");
  assert.equal(countdownText(null, "en"), "");
});

test("retryText reads the attempt, the countdown and the reason", () => {
  assert.equal(
    retryText({ attempt: 2, maxAttempts: 5, reason: "Rate limited" }, 4),
    "Retrying, attempt 2 of 5, in 4 sec. Rate limited",
  );
  assert.equal(retryText({ attempt: 1 }, null), "Retrying, attempt 1");
});

test("countdownText reads whole days from a day on", () => {
  assert.equal(countdownText(3 * 86400, "en"), "in 3 days");
});
