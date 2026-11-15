import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { createMarkdownEngine } from "@kind-ui/agent-ui/core";

const longAnswer = readFileSync(new URL("./fixtures/long-answer.md", import.meta.url), "utf8");

function* chunks(source, size) {
  for (let i = 0; i < source.length; i += size) yield source.slice(i, i + size);
}

const text = (node) => ("value" in node ? node.value : (node.children ?? []).map(text).join(""));
const find = (node, type) =>
  node.type === type ? node : (node.children ?? []).map((child) => find(child, type)).find(Boolean);
const parseOne = (source, streaming = false) => createMarkdownEngine().set(source, streaming)[0].node;

test("streaming the 10k-token fixture parses only blocks that were not final", () => {
  const engine = createMarkdownEngine();
  let src = "";
  let previous = [];
  for (const chunk of chunks(longAnswer, 20)) {
    const parsesBefore = engine.stats().parses;
    src += chunk;
    const blocks = engine.set(src, true);
    const finalBefore = previous.filter((b) => b.final).length;
    assert.ok(engine.stats().parses - parsesBefore <= blocks.length - finalBefore);
    for (const [i, block] of previous.entries()) if (block.final) assert.equal(blocks[i], block);
    previous = blocks;
  }
  assert.ok(previous.filter((b) => b.final).length > 100);
  assert.ok(engine.stats().parses < (2 * longAnswer.length) / 20);
});

test("definition syntax inside code doesn't stop the split", () => {
  const blocks = createMarkdownEngine().set("Use `[^x]` here.\n\n```md\n[x]: /docs\n```\n\nA\n\nB", true);
  assert.equal(blocks.length, 4);
});

test("a late footnote keeps the final blocks", () => {
  const engine = createMarkdownEngine();
  const before = engine.set("A claim[^1].\n\nB\n\nC\n\nD\n\n", true);
  const after = engine.set("A claim[^1].\n\nB\n\nC\n\nD\n\n[^1]: The source.", true);
  assert.ok(before[0].final);
  assert.equal(after[0], before[0]);
  assert.equal(text(after.at(-1).node), "The source.");
});

test("final block keys are stable across appends", () => {
  const engine = createMarkdownEngine();
  let src = "";
  let finalKeys = [];
  for (const chunk of chunks(longAnswer, 20)) {
    src += chunk;
    const blocks = engine.set(src, true);
    assert.deepEqual(
      blocks.slice(0, finalKeys.length).map((b) => b.key),
      finalKeys,
    );
    finalKeys = blocks.filter((b) => b.final).map((b) => b.key);
  }
});

test("a finished stream matches a one-shot parse", () => {
  const engine = createMarkdownEngine();
  let src = "";
  for (const chunk of chunks(longAnswer, 20)) {
    src += chunk;
    engine.set(src, true);
  }
  const streamed = engine.set(src, false);
  const oneShot = createMarkdownEngine().set(src, false);
  assert.ok(streamed.every((b) => b.final));
  assert.deepEqual(
    streamed.map((b) => b.node),
    oneShot.map((b) => b.node),
  );
});

test("replaced source rebuilds", () => {
  const engine = createMarkdownEngine();
  engine.set("# A\n\nfoo", true);
  const blocks = engine.set("# B", true);
  assert.equal(blocks.length, 1);
  assert.equal(text(blocks[0].node), "B");
});

test("the streaming tail is repaired, and only while streaming", () => {
  assert.equal(text(find(parseOne("a **b", true), "strong")), "b");
  assert.equal(find(parseOne("a `b", true), "inlineCode").value, "b");
  assert.equal(find(parseOne("a **b"), "strong"), undefined);
  const code = find(parseOne("```js\nlet a", true), "code");
  assert.deepEqual(code, { type: "code", lang: "js", value: "let a" });
  assert.equal(find(parseOne("see [docs](https://exa", true), "link"), undefined);
});

test("raw html renders as text", () => {
  assert.equal(text(parseOne("<script>alert(1)</script>")), "<script>alert(1)</script>");
  assert.equal(text(parseOne("a <b>c</b>")), "a <b>c</b>");
});

test("unsafe link and image urls become null", () => {
  const url = (md) => (find(parseOne(md), "link") ?? find(parseOne(md), "image")).url;
  assert.equal(url("[x](javascript:alert(1))"), null);
  assert.equal(url("[x](< JaVaScRiPt:x>)"), null);
  assert.equal(url("[x](data:text/html,x)"), null);
  assert.equal(url("![x](javascript:x)"), null);
  assert.equal(url("[x](/docs)"), "/docs");
  assert.equal(url("[x](mailto:a@b.c)"), "mailto:a@b.c");
  assert.equal(url("[x](HTTPS://a.b)"), "HTTPS://a.b");
  assert.equal(url("[x][d]\n\n[d]: javascript:x"), null);
  assert.equal(url("[x][d]\n\n[d]: https://a.b"), "https://a.b");
});
