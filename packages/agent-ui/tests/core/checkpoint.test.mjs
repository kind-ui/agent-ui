import assert from "node:assert/strict";
import { test } from "node:test";
import { checkpointPrimitive } from "@kind-ui/agent-ui/core";

const host = {
  onRestore: () => {},
  scopes: ["both", "code", "conversation"],
  changes: { files: 3, additions: 12, deletions: 40 },
  laterMessages: 4,
  unrestorableMessages: 2,
};

test("the loss sentence and the note follow the scope", () => {
  const checkpoint = checkpointPrimitive({ ...host, defaultOpen: true });
  const state = () => checkpoint.get();
  assert.equal(state().scope, "both");
  assert.equal(
    state().confirmDescription,
    "Undoes changes to 3 files (+12 \u221240) and removes 4 later messages.",
  );
  assert.equal(state().note, "Code from 2 messages can't be restored.");
  assert.equal(checkpoint.api.setScope("code"), true);
  assert.equal(
    state().confirmDescription,
    "Undoes changes to 3 files (+12 \u221240). The conversation stays.",
  );
  checkpoint.api.setScope("conversation");
  assert.equal(state().confirmDescription, "Removes 4 later messages. The code stays.");
  assert.equal(state().note, "");
  assert.equal(state().outcome, "Restored conversation");
  assert.equal(state().outcomeMeta, "4 messages");
});

test("without a choice or numbers, it reads as 0.8 did", () => {
  const checkpoint = checkpointPrimitive({ onRestore: () => {}, defaultOpen: true });
  const state = checkpoint.get();
  assert.deepEqual(state.scopes, ["both"]);
  assert.equal(state.confirmTitle, "Restore to this point?");
  assert.equal(state.confirmDescription, "Changes after it will be discarded.");
  assert.equal(state.outcome, "Restored");
  assert.equal(checkpoint.api.setScope, undefined);
});

test("setScope and compare are offered only while the dialog is open, and refuse an unknown scope", () => {
  const sources = [];
  const checkpoint = checkpointPrimitive({ ...host, onCompare: ({ source }) => sources.push(source) });
  assert.equal(checkpoint.api.setScope, undefined);
  assert.equal(checkpoint.api.compare, undefined);
  checkpoint.api.setOpen(true);
  assert.equal(checkpoint.api.setScope("everything"), false);
  assert.equal(checkpoint.get().scope, "both");
  checkpoint.api.compare();
  assert.deepEqual(sources, ["programmatic"]);
});

test("a scope the host stops offering falls back to the first it offers", () => {
  const checkpoint = checkpointPrimitive({ ...host, defaultScope: "conversation" });
  assert.equal(checkpoint.get().scope, "conversation");
  checkpoint.setOptions({ ...host, scopes: ["code", "both"] });
  assert.equal(checkpoint.get().scope, "code");
  assert.deepEqual(checkpoint.get().scopes, ["code", "both"]);
});
