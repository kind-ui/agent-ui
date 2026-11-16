import assert from "node:assert/strict";
import { test } from "node:test";
import { documentSize } from "@kind-ui/agent-ui/core";

test("documentSize counts UTF-8 bytes", () => {
  assert.equal(documentSize(""), "0 bytes");
  assert.equal(documentSize("a"), "1 byte");
  assert.equal(documentSize("é"), "2 bytes");
  assert.equal(documentSize("€"), "3 bytes");
  assert.equal(documentSize("😀"), "4 bytes");
  assert.equal(documentSize("a".repeat(2450)), "2.5 kB");
  assert.equal(documentSize("a".repeat(1_200_000)), "1.2 MB");
});
