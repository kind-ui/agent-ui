import assert from "node:assert/strict";
import { test } from "node:test";
import { modelControlPrimitive, modelEffort } from "@kind-ui/agent-ui/core";

const levels = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];
const models = [
  { id: "big", name: "Big" },
  { id: "small", name: "Small", efforts: ["low", "medium"] },
];

test("modelEffort keeps a supported level, else falls back to the highest supported at or below it", () => {
  assert.equal(modelEffort(levels, { efforts: undefined }, "high"), "high");
  assert.equal(modelEffort(levels, { efforts: ["low", "medium"] }, "high"), "medium");
  assert.equal(modelEffort(levels, { efforts: ["high"] }, "low"), "high");
  assert.equal(modelEffort(levels, { efforts: [] }, "low"), null);
  assert.equal(modelEffort(levels, undefined, "bogus"), "medium");
  assert.equal(modelEffort([], undefined, "low"), null);
});

test("Model and Effort sit after the host's toggles; unsupported levels are disabled and refused", () => {
  const changes = [];
  const instance = modelControlPrimitive({
    models,
    levels,
    defaultModel: "big",
    defaultEffort: "high",
    settings: [
      { type: "toggle", id: "fast", label: "Fast mode" },
      { type: "choice", id: "context", label: "Context window", options: [{ value: "1m", label: "1M" }] },
    ],
    onEffortChange: (value, details) => changes.push([value, details.reason]),
  });
  const ids = () => instance.api.contentState(instance.get()).rows.map((row) => row.id);
  assert.deepEqual(ids(), ["fast", "model", "effort", "context"]);
  assert.equal(instance.api.name(instance.get()), "Model, Big, High effort");
  instance.api.setModel("small");
  assert.deepEqual(changes, [["medium", "model-change"]]);
  const effort = instance.api.contentState(instance.get()).rows.find((row) => row.id === "effort");
  assert.deepEqual(
    effort.options.map((option) => option.disabled ?? false),
    [false, false, true],
  );
  assert.equal(instance.api.setEffort("high"), false);
  assert.equal(instance.api.setEffort("low"), true);
  assert.equal(instance.api.getEffort(), "low");
  instance.destroy();
});

test("an uncontrolled effort starts on, and follows models to, the level the chosen model uses", () => {
  const changes = [];
  const options = {
    models: [{ id: "small", name: "Small", efforts: ["low", "medium"] }],
    levels,
    defaultModel: "small",
    defaultEffort: "high",
    onEffortChange: (value, details) => changes.push([value, details.reason]),
  };
  const instance = modelControlPrimitive(options);
  assert.equal(instance.get().effort, "medium");
  instance.setOptions({ ...options, models: [{ id: "small", name: "Small", efforts: ["low"] }] });
  assert.deepEqual(changes, [["low", "model-change"]]);
  assert.equal(instance.get().effort, "low");
  instance.destroy();
});

test("a model without effort levels has no Effort row or setEffort", () => {
  const instance = modelControlPrimitive({
    models: [{ id: "tiny", name: "Tiny", efforts: [] }],
    levels,
    defaultModel: "tiny",
  });
  assert.deepEqual(
    instance.api.contentState(instance.get()).rows.map((row) => row.id),
    ["model"],
  );
  assert.equal(instance.api.setEffort, undefined);
  assert.equal(instance.api.name(instance.get()), "Model, Tiny");
  instance.destroy();
});
