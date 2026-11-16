import assert from "node:assert/strict";
import { test } from "node:test";
import { filterModels } from "@kind-ui/agent-ui/core";

const models = [
  { id: "gpt-5", name: "GPT-5", group: "OpenAI" },
  { id: "sonnet-3", name: "Sonnet 3.7", group: "Anthropic" },
  { id: "gpt-5-mini", name: "GPT-5 mini", group: "OpenAI" },
  { id: "sonnet-4", name: "Sonnet 4", group: "Anthropic", description: "Fast and capable" },
  { id: "gemini", name: "Gemini 2.5 Pro", group: "Google" },
];

const ids = (groups) => groups.map(({ group, models }) => [group, models.map((model) => model.id)]);

test("an empty query keeps every model, grouped in the order groups first appear", () => {
  assert.deepEqual(ids(filterModels(models, "")), [
    ["OpenAI", ["gpt-5", "gpt-5-mini"]],
    ["Anthropic", ["sonnet-3", "sonnet-4"]],
    ["Google", ["gemini"]],
  ]);
});

test("ranks the best match first within its group", () => {
  assert.deepEqual(ids(filterModels(models, "son4")), [["Anthropic", ["sonnet-4"]]]);
  assert.deepEqual(ids(filterModels(models, "sonnet")), [["Anthropic", ["sonnet-4", "sonnet-3"]]]);
});

test("matches a model's group and description too", () => {
  assert.deepEqual(ids(filterModels(models, "google")), [["Google", ["gemini"]]]);
  assert.deepEqual(ids(filterModels(models, "capable")), [["Anthropic", ["sonnet-4"]]]);
});

test("drops models and groups that score zero", () => {
  assert.deepEqual(filterModels(models, "zzz"), []);
});
