import assert from "node:assert/strict";
import { test } from "node:test";
import { dropRow, mergeLeaving } from "@kind-ui/agent-ui/core";

const item = (id) => ({ id });
const items = (ids) => ids.map(item);
const row = (id, leaving = false) => ({ item: item(id), leaving });
const rows = (ids) => ids.map((id) => row(id));

test("a removed item stays in place, leaving", () =>
  assert.deepEqual(mergeLeaving(rows(["a", "b", "c"]), items(["a", "c"])), [
    row("a"),
    row("b", true),
    row("c"),
  ]));

test("an item that comes back stops leaving", () =>
  assert.deepEqual(mergeLeaving([row("a"), row("b", true)], items(["a", "b"])), [row("a"), row("b")]));

test("a leaving row follows its neighbor through a reorder", () =>
  assert.deepEqual(mergeLeaving(rows(["a", "b", "c"]), items(["c", "a"])), [
    row("c"),
    row("a"),
    row("b", true),
  ]));

test("leaving rows before the first item and in a run keep their order", () =>
  assert.deepEqual(mergeLeaving(rows(["a", "b", "c", "d"]), items(["d"])), [
    row("a", true),
    row("b", true),
    row("c", true),
    row("d"),
  ]));

test("new items take their place in the host's order", () =>
  assert.deepEqual(mergeLeaving([row("a"), row("b", true)], items(["x", "a", "y"])), [
    row("x"),
    row("a"),
    row("b", true),
    row("y"),
  ]));

test("an exit that finishes after its item came back drops nothing", () => {
  const back = mergeLeaving(mergeLeaving(rows(["a", "b"]), items(["a"])), items(["a", "b"]));
  assert.deepEqual(dropRow(back, "b"), [row("a"), row("b")]);
});

test("dropRow removes only that row", () =>
  assert.deepEqual(dropRow([row("a"), row("b", true)], "b"), [row("a")]));
