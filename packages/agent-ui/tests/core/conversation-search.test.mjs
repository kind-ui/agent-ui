import assert from "node:assert/strict";
import { test } from "node:test";
import { findMatches, searchText } from "@kind-ui/agent-ui/core";

test("searchText reads Markdown as the text it renders", () => {
  assert.equal(searchText("**bold** [link](x)"), "bold link");
  assert.equal(searchText("run `npm test` now"), "run npm test now");
  assert.equal(searchText("a ![alt](https://x.test/a.png) b"), "a  b");
  const code = searchText("```ts\nconst x = 1\n```");
  assert.match(code, /const x = 1/);
  assert.doesNotMatch(code, /ts/);
});

test("searchText breaks lines between blocks, list items and table cells", () => {
  assert.deepEqual(searchText("a\n\n- b\n- c").split("\n"), ["a", "b", "c"]);
  assert.deepEqual(searchText("| h1 | h2 |\n| -- | -- |\n| a | b |").split("\n"), ["h1", "h2", "a", "b"]);
});

test("findMatches finds every occurrence in each text", () => {
  assert.deepEqual(findMatches(["a cat, a cat", "dog", "Cat"], "cat"), [
    { index: 0, start: 2, end: 5 },
    { index: 0, start: 9, end: 12 },
    { index: 2, start: 0, end: 3 },
  ]);
});

test("findMatches folds case and accents", () => {
  assert.deepEqual(findMatches(["My Résumé"], "resume"), [{ index: 0, start: 3, end: 9 }]);
});

test("findMatches matches nothing for a blank query or across a break", () => {
  assert.deepEqual(findMatches(["anything"], "  "), []);
  assert.deepEqual(findMatches(["foo\nbar"], "foo bar"), []);
});
