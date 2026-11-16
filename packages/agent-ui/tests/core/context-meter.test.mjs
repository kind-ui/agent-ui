import assert from "node:assert/strict";
import { test } from "node:test";
import { contextMeterPrimitive, contextRows, contextValueText } from "@kind-ui/agent-ui/core";

test("contextValueText reads used and total tokens and the percentage", () => {
  assert.equal(contextValueText(57_600, 128_000, "en-US"), "57,600 of 128,000 tokens, 45%");
  assert.equal(contextValueText(0, 128_000, "en-US"), "0 of 128,000 tokens, 0%");
  assert.equal(contextValueText(10, 0, "en-US"), "10 of 0 tokens, 0%");
  assert.equal(contextValueText(200, 100, "en-US"), "200 of 100 tokens, 100%");
});

test("contextRows lists only what's supplied, in order, including zeros", () => {
  assert.deepEqual(contextRows({ cached: 0, input: 40_000, reasoning: 5_600 }, 0.42, "USD", "en-US"), [
    { label: "Input", value: "40,000" },
    { label: "Reasoning", value: "5,600" },
    { label: "Cached", value: "0" },
    { label: "Cost", value: "$0.42" },
  ]);
  assert.deepEqual(contextRows({ output: 12 }, undefined, "USD", "en-US"), [
    { label: "Output", value: "12" },
  ]);
  assert.deepEqual(contextRows(undefined, 0, "EUR", "en-US"), [{ label: "Cost", value: "€0.00" }]);
  assert.deepEqual(contextRows(), []);
});

test("contextRows keeps a small cost from reading as zero", () => {
  assert.deepEqual(contextRows(undefined, 0.0034, "USD", "en-US"), [{ label: "Cost", value: "$0.0034" }]);
  assert.deepEqual(contextRows(undefined, 12.345, "USD", "en-US"), [{ label: "Cost", value: "$12.35" }]);
});

test("the level is high from 80% and full from 95%", () => {
  const meter = contextMeterPrimitive({ used: 79, total: 100 });
  assert.equal(meter.get().level, "normal");
  meter.setOptions({ used: 80, total: 100 });
  assert.equal(meter.get().level, "high");
  meter.setOptions({ used: 95, total: 100 });
  assert.equal(meter.get().level, "full");
});

test("open is offered while closed and close while open", () => {
  const changes = [];
  const meter = contextMeterPrimitive({
    used: 1,
    total: 2,
    onOpenChange: (open, details) => changes.push([open, details.reason]),
  });
  assert.equal(meter.api.close, undefined);
  assert.equal(meter.api.open(), true);
  assert.equal(meter.get().open, true);
  assert.equal(meter.api.open, undefined);
  assert.equal(meter.api.close(), true);
  assert.deepEqual(changes, [
    [true, "imperative"],
    [false, "imperative"],
  ]);
});
