import assert from "node:assert/strict";
import { test } from "node:test";
import { bindTextTarget, insertText } from "../../dist/core/text-target.js";

const node = (parentElement) => ({ parentElement });

test("insertText reaches the nearest target above the element, and a cleanup removes only its own", () => {
  const outer = node(null);
  const inner = node(outer);
  const child = node(inner);
  const got = [];
  const unbindOuter = bindTextTarget(outer, (text, source) => got.push(["outer", text, source]) > 0);
  assert.equal(insertText(child, "a", "mouse"), true);
  assert.equal(insertText(outer, "b", "mouse"), false, "an element isn't its own target");
  const first = () => false;
  const unbindFirst = bindTextTarget(inner, first);
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
