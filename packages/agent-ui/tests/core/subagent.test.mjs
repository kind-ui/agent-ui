import assert from "node:assert/strict";
import { test } from "node:test";
import { initials, subagentStatus } from "@kind-ui/agent-ui/core";

test("initials", () => {
  assert.equal(initials("Code reviewer"), "CR");
  assert.equal(initials("ada"), "A");
  assert.equal(initials("  "), "?");
  assert.equal(initials(" test   writer bot "), "TW");
  assert.equal(initials("ünïcode 𝒳ray"), "Ü𝒳");
  assert.equal(initials("ßtraße bot"), "ßB");
  assert.equal(initials("e\u0301lodie dupont"), "E\u0301D");
  assert.equal(initials("👩‍💻 coder"), "C");
  assert.equal(initials("(beta) reviewer"), "BR");
});

test("the status in words, with the duration once complete", () => {
  assert.equal(subagentStatus("running", 4), "Working");
  assert.equal(subagentStatus("complete"), "Done");
  assert.equal(subagentStatus("complete", 11.6), "Done in 12 s");
  assert.equal(subagentStatus("cancelled", 3), "Stopped");
  assert.equal(subagentStatus("bogus"), "Waiting");
});
