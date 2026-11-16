import assert from "node:assert/strict";
import { test } from "node:test";
import { isLibraryFrame, parseStack } from "@kind-ui/agent-ui/core";

test("parseStack leaves out the message, keeps unread lines and flags library frames", () => {
  const frames = parseStack(
    "Error: x\n    at f (/app/src/a.ts:3:5)\n    at g (/app/node_modules/lib/i.js:1:1)\nweird\n    at node:internal/main:2:7\n",
  );
  assert.deepEqual(
    frames.map((frame) => [frame.fn, frame.file, frame.line, frame.column, isLibraryFrame(frame)]),
    [
      ["f", "/app/src/a.ts", 3, 5, false],
      ["g", "/app/node_modules/lib/i.js", 1, 1, true],
      [undefined, undefined, undefined, undefined, false],
      [undefined, "node:internal/main", 2, 7, true],
    ],
  );
  assert.equal(frames[2].raw, "weird");
});

test("parseStack reads SpiderMonkey and JavaScriptCore frames", () => {
  const [gecko, jsc] = parseStack("f@https://app.test/a.js:3:5\ng@https://app.test/b.js:4:6");
  assert.deepEqual([gecko.fn, gecko.line, jsc.fn, jsc.column], ["f", 3, "g", 6]);
});

test("isLibraryFrame takes the host's word first", () => {
  assert.equal(isLibraryFrame({ raw: "", file: "node_modules/x.js", library: false }), false);
  assert.equal(isLibraryFrame({ raw: "", file: "/app/a.js", library: true }), true);
});

test("parseStack skips a message ending in a URL, and reads \\r\\n and Windows paths", () => {
  const frames = parseStack(
    "Error: failed to load https://x.test/a.js:1:2\r\n    at f (C:\\app\\node_modules\\lib\\i.js:1:1)\r\n",
  );
  assert.equal(frames.length, 1);
  assert.equal(frames[0].raw, "    at f (C:\\app\\node_modules\\lib\\i.js:1:1)");
  assert.equal(isLibraryFrame(frames[0]), true);
});
