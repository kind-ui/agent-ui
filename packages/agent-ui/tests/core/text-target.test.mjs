import assert from "node:assert/strict";
import { test } from "node:test";
import { bindTextSource, bindTextTarget, insertText, insertTextNearby, takeBackText } from "../../dist/core/text-target.js";

const node = (parentElement) => ({
  parentElement,
  contains(other) {
    for (let at = other; at; at = at.parentElement) if (at === this) return true;
    return false;
  },
});

test("insertText reaches the nearest target above the element, and a cleanup removes only its own", () => {
  const outer = node(null);
  const inner = node(outer);
  const child = node(inner);
  const got = [];
  const outerTarget = bindTextTarget(outer, (text, source) => got.push(["outer", text, source]) > 0);
  assert.equal(insertText(child, "a", "mouse"), true);
  assert.equal(insertText(outer, "b", "mouse"), false, "an element isn't its own target");
  const first = bindTextTarget(inner, () => false);
  bindTextTarget(inner, (text, source, reason) => got.push(["inner", text, source, reason]) > 0);
  first.cleanup();
  assert.equal(insertText(child, "c", "keyboard", "queue-edit"), true);
  outerTarget.cleanup();
  assert.deepEqual(got, [
    ["outer", "a", "mouse"],
    ["inner", "c", "keyboard", "queue-edit"],
  ]);
  assert.equal(insertText(undefined, "d", "agent"), false);
});

test("a source docks in the target around it whichever binds first, follows running, and is taken back from", () => {
  const composer = node(null);
  const queue = node(composer);
  const docked = [];
  const taken = [];
  const unlink = bindTextSource(queue, {
    dock: (running) => docked.push(running),
    takeBack: (source) => taken.push(source) > 0,
  });
  assert.deepEqual(docked, [], "no target yet");
  let running = true;
  const target = bindTextTarget(
    composer,
    () => true,
    () => running,
  );
  running = false;
  target.update();
  assert.equal(takeBackText(composer, "keyboard"), true);
  target.cleanup();
  assert.equal(takeBackText(composer, "keyboard"), false);
  unlink();
  assert.deepEqual(docked, [true, false, null, null]);
  assert.deepEqual(taken, ["keyboard"]);
});

test("insertTextNearby falls back to the first target inside the nearest ancestor that holds one", () => {
  const tree = (parentNode) => ({ ...node(parentNode), parentNode });
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
