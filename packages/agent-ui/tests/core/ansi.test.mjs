import assert from "node:assert/strict";
import { test } from "node:test";
import { createAnsiLines } from "@kind-ui/agent-ui/core";

const plain = (line) => line.spans.map((span) => span.text).join("");

test("an SGR sequence split across chunks styles the text after it", () => {
  const lines = createAnsiLines();
  assert.deepEqual(lines.update("\x1b[3"), [{ spans: [] }]);
  const [line] = lines.update("\x1b[31mred\x1b[0m ok");
  assert.deepEqual(line.spans, [{ text: "red", fg: "var(--kind-ansi-red)" }, { text: " ok" }]);
});

test("other escapes are dropped and a lone \\r starts its line again", () => {
  const lines = createAnsiLines();
  const out = lines.update("\x1b[2K\x1b]0;title\x07 10%\x1b[1A\r 99%\nnext\x07");
  assert.deepEqual(out.map(plain), [" 99%", "next"]);
  assert.equal(lines.text(), " 99%\nnext");
});

test("a non-SGR sequence doesn't swallow text up to a later m", () => {
  assert.deepEqual(createAnsiLines().update("\x1b[2Kmake me").map(plain), ["make me"]);
});

test("an OSC 8 link keeps only its text", () => {
  const out = createAnsiLines().update("\x1b]8;;https://example.com\x1b\\docs\x1b]8;;\x1b\\ ok");
  assert.deepEqual(out.map(plain), ["docs ok"]);
});

test("an OSC left open ends at the next line break", () => {
  const lines = createAnsiLines();
  assert.deepEqual(lines.update("ok\n\x1b]0;tit").map(plain), ["ok", ""]);
  assert.deepEqual(lines.update("ok\n\x1b]0;title\nnext").map(plain), ["ok", "", "next"]);
});

test("an OSC cut short by another escape shows none of its text", () => {
  assert.deepEqual(createAnsiLines().update("ok\x1b]0;title\x1b\nnext").map(plain), ["ok", "next"]);
  const [line] = createAnsiLines().update("\x1b]0;t\x1b[31mred");
  assert.deepEqual(line.spans, [{ text: "red", fg: "var(--kind-ansi-red)" }]);
});

test("\\r\\n split across chunks is one newline", () => {
  const lines = createAnsiLines();
  lines.update("a\r");
  assert.deepEqual(lines.update("a\r\nb").map(plain), ["a", "b"]);
});

test("finished lines keep their object while the output grows", () => {
  const lines = createAnsiLines();
  const first = lines.update("a\nb");
  const next = lines.update("a\nbc\nd");
  assert.equal(next[0], first[0]);
  assert.deepEqual(next.map(plain), ["a", "bc", "d"]);
  assert.equal(lines.update("a\nbc\nd"), next);
});

test("output that doesn't continue the last starts over", () => {
  const lines = createAnsiLines();
  lines.update("\x1b[31mold\nline");
  const [line] = lines.update("new");
  assert.deepEqual(line.spans, [{ text: "new" }]);
});

test("256-color and truecolor, decorations, ESC[m and inverse", () => {
  const [line] = createAnsiLines().update(
    "\x1b[38;5;196mx\x1b[48;2;1;2;3my\x1b[m\x1b[1;2;3;4;9mz\x1b[0;7mw\x1b[0;7;32mv\x1b[38;5;1mu",
  );
  assert.deepEqual(line.spans, [
    { text: "x", fg: "#ff0000" },
    { text: "y", fg: "#ff0000", bg: "#010203" },
    { text: "z", bold: true, dim: true, italic: true, underline: true, strike: true },
    { text: "w", fg: "var(--kind-color-surface)", bg: "var(--kind-color-fg)" },
    { text: "v", fg: "var(--kind-color-surface)", bg: "var(--kind-ansi-green)" },
    { text: "u", fg: "var(--kind-color-surface)", bg: "var(--kind-ansi-red)" },
  ]);
});

test("text in one style across chunks stays one span", () => {
  const lines = createAnsiLines();
  lines.update("\x1b[32mab");
  assert.deepEqual(lines.update("\x1b[32mabcd")[0].spans, [{ text: "abcd", fg: "var(--kind-ansi-green)" }]);
});

test("\\r then a style then \\n keeps the line, and \\r ending a chunk doesn't blank it", () => {
  assert.deepEqual(createAnsiLines().update("done\r\x1b[0m\nnext").map(plain), ["done", "next"]);
  const lines = createAnsiLines();
  assert.deepEqual(lines.update("10%\r\x1b[32m").map(plain), ["10%"]);
  assert.deepEqual(lines.update("10%\r\x1b[32m99%").map(plain), ["99%"]);
});

test("an empty SGR parameter reads as 0", () => {
  const [line] = createAnsiLines().update("\x1b[1;31ma\x1b[;32mb\x1b[mc");
  assert.deepEqual(line.spans, [
    { text: "a", fg: "var(--kind-ansi-red)", bold: true },
    { text: "b", fg: "var(--kind-ansi-green)" },
    { text: "c" },
  ]);
});

test("an update that changes nothing shown keeps the lines", () => {
  const lines = createAnsiLines();
  const first = lines.update("x\nyy");
  assert.equal(lines.update("x\nyy\x1b[3"), first);
});
