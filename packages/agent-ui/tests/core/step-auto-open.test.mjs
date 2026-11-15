import assert from "node:assert/strict";
import { test } from "node:test";
import { nextOpen } from "@kind-ui/agent-ui/core";

const base = { prevStatus: "pending", open: false, userToggled: false, autoOpen: "running" };

test("opens on running and awaiting-input", () => {
  assert.equal(nextOpen({ ...base, status: "running" }), true);
  assert.equal(nextOpen({ ...base, status: "awaiting-input", prevStatus: "running", open: false }), true);
});

test("closes on complete, stays open on error and cancelled", () => {
  const running = { ...base, prevStatus: "running", open: true };
  assert.equal(nextOpen({ ...running, status: "complete" }), false);
  assert.equal(nextOpen({ ...running, status: "error" }), true);
  assert.equal(nextOpen({ ...running, status: "cancelled" }), true);
});

test("user toggle disables auto", () => {
  assert.equal(nextOpen({ ...base, status: "running", userToggled: true }), false);
  assert.equal(
    nextOpen({ ...base, status: "complete", prevStatus: "running", open: true, userToggled: true }),
    true,
  );
});

test("never mode leaves open unchanged", () => {
  assert.equal(nextOpen({ ...base, status: "running", autoOpen: "never" }), false);
  assert.equal(
    nextOpen({ ...base, status: "complete", prevStatus: "running", open: true, autoOpen: "never" }),
    true,
  );
});

test("an unchanged status leaves open unchanged", () => {
  assert.equal(nextOpen({ ...base, status: "running", prevStatus: "running", open: false }), false);
});
