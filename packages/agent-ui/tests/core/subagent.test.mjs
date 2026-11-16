import assert from "node:assert/strict";
import { test } from "node:test";
import { avatarInitials, subagentStatus } from "@kind-ui/agent-ui/core";

test("avatarInitials", () => {
  assert.equal(avatarInitials("Code reviewer"), "CR");
  assert.equal(avatarInitials("ada"), "A");
  assert.equal(avatarInitials("  "), "?");
  assert.equal(avatarInitials(" test   writer bot "), "TW");
  assert.equal(avatarInitials("ünïcode 𝒳ray"), "Ü𝒳");
  assert.equal(avatarInitials("ßtraße bot"), "ßB");
  assert.equal(avatarInitials("e\u0301lodie dupont"), "E\u0301D");
  assert.equal(avatarInitials("👩‍💻 coder"), "C");
  assert.equal(avatarInitials("(beta) reviewer"), "BR");
});

test("the status in words, with the duration once complete", () => {
  assert.equal(subagentStatus("running", 4), "Working");
  assert.equal(subagentStatus("complete"), "Done");
  assert.equal(subagentStatus("complete", 11.6), "Done in 12 s");
  assert.equal(subagentStatus("cancelled", 3), "Stopped");
  assert.equal(subagentStatus("bogus"), "Waiting");
});
