import assert from "node:assert/strict";
import { test } from "node:test";
import { streamingTextDiff, streamingTextPrimitive } from "@kind-ui/agent-ui/core";

test("append diff", () =>
  assert.deepEqual(streamingTextDiff("Hel", "Hello"), { kind: "append", appended: "lo" }));

test("shrink or replace resets", () => {
  assert.deepEqual(streamingTextDiff("Hello", "Hi"), { kind: "reset" });
  assert.deepEqual(streamingTextDiff("abc", "xbcd"), { kind: "reset" });
});

test("appends keep earlier chunks; a shrink replaces them with one", () => {
  const text = streamingTextPrimitive({ id: "t", text: "Hel" });
  text.setOptions({ id: "t", text: "Hello" });
  text.setOptions({ id: "t", text: "Hello there" });
  assert.deepEqual(
    text.get().chunks.map((chunk) => chunk.text),
    ["Hel", "lo", " there"],
  );
  const kept = text.get().chunks[0];
  text.setOptions({ id: "t", text: "Hi" });
  assert.deepEqual(
    text.get().chunks.map((chunk) => chunk.text),
    ["Hi"],
  );
  assert.notEqual(text.get().chunks[0].id, kept.id);
  text.setOptions({ id: "t", text: "" });
  assert.deepEqual(text.get().chunks, []);
});
