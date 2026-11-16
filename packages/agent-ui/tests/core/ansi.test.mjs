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
