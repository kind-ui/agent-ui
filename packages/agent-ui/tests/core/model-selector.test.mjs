import assert from "node:assert/strict";
import { test } from "node:test";
import { modelSelectorPrimitive } from "@kind-ui/agent-ui/core";

const models = [
  { id: "gpt-5", name: "GPT-5", group: "OpenAI", icon: "openai.svg" },
  { id: "sonnet", name: "Sonnet", group: "Anthropic", description: "Fast" },
  { id: "opus", name: "Opus", group: "Anthropic", icon: "anthropic.svg" },
  { id: "local", name: "Local" },
];

test("flat models keep their group and are found by it", () => {
  const { items } = modelSelectorPrimitive({ models }).get();
  assert.deepEqual(items[1], {
    value: "sonnet",
    label: "Sonnet",
    description: "Fast",
    group: "Anthropic",
    keywords: ["Anthropic"],
  });
  assert.deepEqual(items[3], { value: "local", label: "Local" });
});

test("groups become rows found by their models' names, with the first icon among them", () => {
  const { items } = modelSelectorPrimitive({ models, pages: "groups" }).get();
  assert.deepEqual(
    items.map(({ value, icon, keywords }) => [value, icon, keywords]),
    [
      ["group:OpenAI", "openai.svg", ["GPT-5"]],
      ["group:Anthropic", "anthropic.svg", ["Sonnet", "Fast", "Opus"]],
      ["local", undefined, undefined],
    ],
  );
  assert.deepEqual(items[1].items[0], { value: "sonnet", label: "Sonnet", description: "Fast" });
});

test("an agent chooses any model by id, never a group row", () => {
  const instance = modelSelectorPrimitive({ models, pages: "groups" });
  assert.deepEqual(
    instance.api.getChoices().map(({ value }) => value),
    ["gpt-5", "sonnet", "opus", "local"],
  );
  assert.equal(instance.api.setValue("group:OpenAI"), false);
  assert.equal(instance.api.setValue("opus"), true);
  assert.equal(instance.api.name(instance.get()), "Model, Opus");
});
