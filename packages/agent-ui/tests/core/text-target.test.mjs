import assert from "node:assert/strict";
import { test } from "node:test";
import { bindTextTarget, insertText, insertTextNearby } from "../../dist/core/text-target.js";

const node = (parentElement) => ({ parentElement });

test("insertText reaches the nearest target above the element, and a cleanup removes only its own", () => {
  const outer = node(null);
  const inner = node(outer);
  const child = node(inner);
  const got = [];
  const unbindOuter = bindTextTarget(outer, (text, source) => got.push(["outer", text, source]) > 0).cleanup;
  assert.equal(insertText(child, "a", "mouse"), true);
  assert.equal(insertText(outer, "b", "mouse"), false, "an element isn't its own target");
  const first = () => false;
  const unbindFirst = bindTextTarget(inner, first).cleanup;
  bindTextTarget(inner, (text, source) => got.push(["inner", text, source]) > 0);
  unbindFirst();
  assert.equal(insertText(child, "c", "keyboard"), true);
  unbindOuter();
  assert.deepEqual(got, [
    ["outer", "a", "mouse"],
    ["inner", "c", "keyboard"],
  ]);
  assert.equal(insertText(undefined, "d", "agent"), false);
});

test("insertTextNearby falls back to the first target inside the nearest ancestor that holds one", () => {
  const contains = function (other) {
    for (let node = other; node; node = node.parentElement) if (node === this) return true;
    return false;
  };
  const tree = (parentElement) => ({ parentElement, contains });
  const page = tree(null);
  const conversation = tree(page);
  const message = tree(conversation);
  const composer = tree(page);
  const got = [];
  const target = bindTextTarget(composer, (text, _source, reason) => got.push([text, reason]) > 0);
  assert.equal(insertTextNearby(message, "use the table", "mouse", "queue-edit"), true);
  target.cleanup();
  assert.equal(insertTextNearby(message, "again", "mouse", "queue-edit"), false);
  assert.deepEqual(got, [["use the table", "queue-edit"]]);
});
