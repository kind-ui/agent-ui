import assert from "node:assert/strict";
import { test } from "node:test";
import { fitChips } from "@kind-ui/agent-ui/core";

test("every chip, when they all fit without the +N button", () => {
  assert.equal(fitChips([100, 100, 100], 316, 8, 40), 3);
});

test("as many as leave room for the +N button, else none", () => {
  assert.equal(fitChips([100, 100, 100], 300, 8, 40), 2);
  assert.equal(fitChips([100, 100, 100], 100, 8, 40), 0);
});

test("a chip not measured yet doesn't fit, nor any after it", () => {
  assert.equal(fitChips([100, undefined, 100], 1000, 8, 40), 1);
  assert.equal(fitChips([], 100, 8, 40), 0);
});
