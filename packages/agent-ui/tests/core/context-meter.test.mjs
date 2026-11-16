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
  const cost = (value) => contextRows(undefined, value, "USD", "en-US")[0].value;
  assert.equal(cost(0.0034), "$0.0034");
  assert.equal(cost(0.00004), "$0.00004");
  assert.equal(cost(12.345), "$12.35");
  assert.equal(cost(1234.5678), "$1,234.57");
});

test("the level is high from 80% and full from 95%, as the percentage reads", () => {
  const level = (used, total = 1000) => contextMeterPrimitive({ used, total }).get().level;
  assert.equal(level(794), "normal");
  assert.equal(level(795), "high");
  assert.equal(level(944), "high");
  assert.equal(level(9496, 10_000), "full");
});

test("a missing count reads as zero, and the value text is English until the page's language is known", () => {
  const meter = contextMeterPrimitive({ used: Number.NaN, total: 128_000, locale: "" });
  assert.equal(meter.api.valueText(meter.get()), "0 of 128,000 tokens, 0%");
  meter.setOptions({ used: 57_600, total: 128_000, locale: "de-DE" });
  assert.equal(meter.api.valueText(meter.get()), "57.600 of 128.000 tokens, 45\u00a0%");
});

test("the same counts in a new usage object keep the rows", () => {
  const meter = contextMeterPrimitive({ used: 1, total: 2, usage: { input: 3 } });
  const rows = meter.api.rows(meter.get());
  meter.setOptions({ used: 1, total: 2, usage: { input: 3 } });
  assert.equal(meter.api.rows(meter.get()), rows);
});

test("a controlled or cancelled open waits for the host", () => {
  const controlled = contextMeterPrimitive({ open: false, onOpenChange: () => {} });
  assert.equal(controlled.api.open(), true);
  assert.equal(controlled.get().open, false);
  const cancelled = contextMeterPrimitive({ onOpenChange: (_open, details) => details.cancel() });
  assert.equal(cancelled.api.open(), false);
  assert.equal(cancelled.get().open, false);
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
