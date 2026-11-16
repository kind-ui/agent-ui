import assert from "node:assert/strict";
import { test } from "node:test";
import { nextOpenSteps } from "@kind-ui/agent-ui/core";

const s = (id, status) => ({ id, status, title: id });

test("a running step opens and a completed one closes", () =>
  assert.deepEqual(
    nextOpenSteps({
      prev: [s("a", "running")],
      next: [s("a", "complete"), s("b", "running")],
      open: ["a"],
      toggled: [],
      autoOpen: "running",
    }),
    ["b"],
  ));

test("a toggled step keeps its state", () =>
  assert.deepEqual(
    nextOpenSteps({
      prev: [s("a", "running")],
      next: [s("a", "complete")],
      open: ["a"],
      toggled: ["a"],
      autoOpen: "running",
    }),
    ["a"],
  ));

test("removed steps drop out", () =>
  assert.deepEqual(
    nextOpenSteps({ prev: [s("a", "running")], next: [], open: ["a"], toggled: [], autoOpen: "running" }),
    [],
  ));

test("a step whose status didn't change keeps its state, and errors stay open", () =>
  assert.deepEqual(
    nextOpenSteps({
      prev: [s("a", "complete"), s("b", "running")],
      next: [s("a", "complete"), s("b", "error"), s("c", "complete")],
      open: ["a", "b"],
      toggled: [],
      autoOpen: "running",
    }),
    ["a", "b"],
  ));

test('autoOpen "never" leaves every step as it was', () =>
  assert.deepEqual(
    nextOpenSteps({
      prev: [s("a", "running")],
      next: [s("a", "complete"), s("b", "running")],
      open: ["a"],
      toggled: [],
      autoOpen: "never",
    }),
    ["a"],
  ));
