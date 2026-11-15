import assert from "node:assert/strict";
import { test } from "node:test";
import { codeBlockPrimitive } from "@kind-ui/agent-ui/core";

function deferred() {
  const requests = [];
  const highlight = (code) => new Promise((resolve) => requests.push({ code, resolve }));
  return { highlight, requests };
}
const text = (lines) => lines.map((line) => line.map((token) => token.content).join("")).join("\n");
const colors = (lines) => lines.flat().map((token) => token.color ?? "-");
const settle = () => new Promise((resolve) => setImmediate(resolve));

test("shows a result for code that has since grown, with the new text plain, then asks again", async () => {
  const { highlight, requests } = deferred();
  const block = codeBlockPrimitive({ code: "let a", highlight });
  block.setOptions({ code: "let a = 1;\nlet b", highlight });
  requests[0].resolve([{ content: "let", color: "red" }, { content: " a" }]);
  await settle();
  assert.equal(text(block.get().lines), "let a = 1;\nlet b");
  assert.deepEqual(colors(block.get().lines), ["red", "-", "-", "-"]);
  assert.equal(requests[1]?.code, "let a = 1;\nlet b");
});

test("discards a result for code that was replaced", async () => {
  const { highlight, requests } = deferred();
  const block = codeBlockPrimitive({ code: "const a = 1;", highlight });
  block.setOptions({ code: "let b = 2;", highlight });
  requests[0].resolve([{ content: "const", color: "red" }, { content: " a = 1;" }]);
  await settle();
  assert.deepEqual(colors(block.get().lines), ["-"]);
  assert.equal(requests[1]?.code, "let b = 2;");
});
