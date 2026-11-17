import assert from "node:assert/strict";
import { test } from "node:test";
import { stackTracePrimitive } from "@kind-ui/agent-ui/core";

const stack = [
  "AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:",
  "",
  "3 !== 4",
  "",
  "    at check (/app/test/sum.test.ts:8:12)",
  "    at run (/app/node_modules/runner/index.js:3:1)",
].join("\n");

test("the message before the first frame names the error, and its other lines follow", () => {
  const { name, summary, details, rows } = stackTracePrimitive({ stack }).get();
  assert.equal(name, "AssertionError [ERR_ASSERTION]");
  assert.equal(summary, "Expected values to be strictly equal:");
  assert.equal(details, "3 !== 4");
  assert.deepEqual(rows, [
    { type: "frame", index: 0 },
    { type: "library", start: 1, indexes: [1] },
  ]);
});

test("openFrame takes a whole index among the frames and refuses anything else", () => {
  const opened = [];
  const trace = stackTracePrimitive({
    stack,
    onOpenFrame: (frame, { index }) => opened.push([index, frame.fn]),
  });
  for (const index of ["", " ", "1e0", "-1", "2", 0.5]) assert.equal(trace.api.openFrame?.(index), false);
  assert.equal(trace.api.openFrame?.("1"), true);
  assert.equal(trace.api.openFrame?.(0), true);
  assert.deepEqual(opened, [
    [1, "run"],
    [0, "check"],
  ]);
  assert.equal(stackTracePrimitive({ stack }).api.openFrame, undefined);
});

test("copy is offered only with a message or frames to copy", () => {
  assert.equal(stackTracePrimitive({ label: "Build failed" }).api.copy, undefined);
  assert.equal(typeof stackTracePrimitive({ stack }).api.copy, "function");
});
