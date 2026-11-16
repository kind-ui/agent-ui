import assert from "node:assert/strict";
import { test } from "node:test";
import { generatedImagePrimitive } from "@kind-ui/agent-ui/core";

test("an unknown status reads as ready, and numbers that aren't finite fall back", () => {
  const image = generatedImagePrimitive({
    alt: "x",
    status: "pending",
    progress: Number.NaN,
    width: Infinity,
  });
  assert.equal(image.get().phase, "loading");
  assert.equal(image.get().progress, undefined);
  assert.equal(image.get().width, 1024);
});

test("the full size view opens only once the image has loaded", () => {
  const image = generatedImagePrimitive({ alt: "x", status: "generating", defaultOpen: true });
  assert.equal(image.get().open, false);
  assert.equal(image.api.setOpen(true), false);
  assert.equal(image.api.open, undefined);
});
