import assert from "node:assert/strict";
import { test } from "node:test";
import { effortSliderPrimitive } from "@kind-ui/agent-ui/core";

const levels = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

test("a value that names no level reads as the default level, and Reset isn't offered", () => {
  for (const options of [{ defaultValue: "bogus" }, { value: "bogus" }]) {
    const instance = effortSliderPrimitive({ levels, ...options });
    assert.equal(instance.api.getValue(), "medium");
    assert.equal(instance.api.reset, undefined);
    instance.destroy();
  }
});

test("dropping the chosen level moves an uncontrolled slider to the default level", () => {
  const instance = effortSliderPrimitive({ levels, defaultValue: "high" });
  instance.setOptions({
    levels: [
      { value: "a", label: "A" },
      { value: "b", label: "B" },
      { value: "c", label: "C" },
    ],
  });
  assert.equal(instance.api.getValue(), "b");
  assert.equal(instance.api.name(instance.get()), "Effort, B");
  assert.equal(instance.api.reset, undefined);
  instance.destroy();
});

test("an empty label reads as Effort", () => {
  const instance = effortSliderPrimitive({ levels, label: "", modelLabel: "GPT-5" });
  assert.equal(instance.api.name(instance.get()), "Effort, Medium");
  assert.equal(instance.api.modelState(instance.get()).text, "Effort for GPT-5");
  instance.destroy();
});
