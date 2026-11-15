import assert from "node:assert/strict";
import { test } from "node:test";
import {
  hasOutput,
  isDataPart,
  isFilePart,
  isReasoningPart,
  isSourcePart,
  isStepPart,
  isTextPart,
  isToolStep,
} from "@kind-ui/agent-ui";

const call = { toolCallId: "t1", name: "search", dynamic: false, input: { state: "ready", value: {} } };
const step = { id: "s", status: "running", title: "Search", kind: "tool", call };

test("hasOutput treats falsy values as output", () => {
  for (const value of [0, false, "", null, undefined]) {
    assert.equal(hasOutput({ ...call, output: { state: "available", value } }), true);
  }
  assert.equal(hasOutput({ ...call, output: { state: "preliminary", value: 0 } }), true);
  assert.equal(hasOutput({ ...call }), false);
  assert.equal(hasOutput({ ...call, output: undefined }), false);
});

test("isStepPart narrows step parts", () => assert.equal(isStepPart({ type: "step", id: "s", step }), true));

test("part guards match exactly one part type", () => {
  const parts = [
    { type: "text", id: "1", text: "", state: "done" },
    { type: "reasoning", id: "2", text: "", state: "streaming" },
    { type: "file", id: "3", name: "a.txt", mediaType: "text/plain", url: "blob:a" },
    { type: "source", id: "4", source: { id: "src", title: "Docs" } },
    { type: "step", id: "5", step },
    { type: "data", id: "6", name: "weather", data: null },
  ];
  const guards = [isTextPart, isReasoningPart, isFilePart, isSourcePart, isStepPart, isDataPart];
  for (const [i, guard] of guards.entries()) {
    assert.deepEqual(
      parts.map((part) => guard(part)),
      parts.map((_, j) => i === j),
      guard.name,
    );
  }
});

test("isToolStep matches only tool steps", () => {
  assert.equal(isToolStep(step), true);
  assert.equal(
    isToolStep({ id: "r", status: "complete", title: "Think", kind: "reasoning", text: "" }),
    false,
  );
});
