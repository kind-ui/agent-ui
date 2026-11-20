import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { reducedKeyframes, resolveMotion } from "@kind-ui/agent-ui/core";
import { DURATION, EASE } from "../../dist/core/motion/tokens.js";

const presets = ["fade", "fade-up", "expand", "dot-flow"];

test("auto follows prefers-reduced-motion", () => {
  assert.equal(resolveMotion("auto", true), "reduced");
  assert.equal(resolveMotion("auto", false), "full");
  assert.equal(resolveMotion("reduced", false), "reduced");
  assert.equal(resolveMotion("none", false), "none");
  assert.equal(resolveMotion("none", true), "none");
});

test("reduced keyframes animate only opacity", () => {
  for (const preset of presets)
    for (const frame of reducedKeyframes(preset)) assert.deepEqual(Object.keys(frame), ["opacity"]);
});

test("reduced keyframes end fully shown", () => {
  for (const preset of presets) assert.equal(reducedKeyframes(preset).at(-1).opacity, 1);
});

test("agent-ui.css mirrors the motion tokens", () => {
  const css = readFileSync(new URL("../../src/styles/agent-ui.css", import.meta.url), "utf8");
  const value = (name) => css.match(new RegExp(`${name}:\\s*([^;]+);`))?.[1];
  for (const [name, seconds] of Object.entries(DURATION))
    assert.equal(value(`--kind-duration-${name}`), `${Math.round(seconds * 1000)}ms`, name);
  assert.equal(value("--kind-ease"), `cubic-bezier(${EASE.standard.join(", ")})`);
  assert.equal(value("--kind-ease-out"), `cubic-bezier(${EASE.out.join(", ")})`);
  assert.equal(value("--kind-ease-enter"), `cubic-bezier(${EASE.enter.join(", ")})`);
  assert.equal(value("--kind-ease-exit"), `cubic-bezier(${EASE.exit.join(", ")})`);
  assert.equal(value("--kind-ease-in-out"), `cubic-bezier(${EASE.inOut.join(", ")})`);
});
