import assert from "node:assert/strict";
import { test } from "node:test";
import { reducedKeyframes, resolveMotion } from "@kind-ui/agent-ui/core";

const presets = ["fade", "fade-up", "expand", "dot-flow"];

test("auto follows prefers-reduced-motion", () => {
  assert.equal(resolveMotion("auto", true), "reduced");
  assert.equal(resolveMotion("auto", false), "full");
  assert.equal(resolveMotion("reduced", false), "reduced");
  assert.equal(resolveMotion("none", false), "none");
  assert.equal(resolveMotion("none", true), "none");
});

test("reduced keyframes animate only opacity", () => {
  for (const p of presets)
    for (const k of reducedKeyframes(p))
      assert.deepEqual(
        Object.keys(k).filter((x) => x !== "offset"),
        ["opacity"],
      );
});

test("reduced keyframes end fully shown", () => {
  for (const p of presets) assert.equal(reducedKeyframes(p).at(-1).opacity, 1);
});
