import assert from "node:assert/strict";
import { test } from "node:test";
import { suggestionPrimitive } from "@kind-ui/agent-ui/core";

const suggestions = [
  { id: "a", label: "Summarize this thread" },
  { id: "b", label: "Draft a reply" },
];

const setup = (onPick) => {
  const picks = [];
  const suggestion = suggestionPrimitive({
    suggestions,
    onPick: onPick ?? ((id, details) => picks.push({ id, reason: details.reason })),
  });
  return { suggestion, picks };
};

test("pick calls onPick with a listed id and refuses others, inherited names included", () => {
  const { suggestion, picks } = setup();
  assert.equal(suggestion.api.pick("b"), true);
  for (const id of ["zz", "constructor", "toString", "__proto__"])
    assert.equal(suggestion.api.pick(id), false);
  assert.deepEqual(picks, [{ id: "b", reason: "imperative" }]);
});

test("pick returns false when the host cancels", () => {
  const { suggestion } = setup((_id, details) => details.cancel());
  assert.equal(suggestion.api.pick("a"), false);
});

test("pick is offered only while onPick is set", () => {
  const suggestion = suggestionPrimitive({ suggestions });
  assert.equal(suggestion.api.pick, undefined);
  suggestion.setOptions({ suggestions, onPick: () => {} });
  assert.equal(typeof suggestion.api.pick, "function");
});
