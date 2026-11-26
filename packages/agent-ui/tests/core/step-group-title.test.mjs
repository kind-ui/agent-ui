import assert from "node:assert/strict";
import { test } from "node:test";
import { stepGroupTitle } from "@kind-ui/agent-ui/core";

const labels = {
  read: (n) => `read ${n} ${n === 1 ? "file" : "files"}`,
  run: (n) => `ran ${n} ${n === 1 ? "command" : "commands"}`,
};

test("joins each labelled group's count in first-seen order and capitalizes the first", () => {
  const items = [
    { id: "a", status: "complete", group: "read" },
    { id: "b", status: "complete", group: "run" },
    { id: "c", status: "complete", group: "read" },
  ];
  assert.equal(stepGroupTitle(items, labels), "Read 2 files and ran 1 command");
});

test("counts steps without a labelled group as steps", () => {
  const items = [
    { id: "a", status: "complete", group: "read" },
    { id: "b", status: "complete", group: "edit" },
    { id: "c", status: "complete" },
  ];
  assert.equal(stepGroupTitle(items, labels), "Read 1 file and 2 steps");
  assert.equal(stepGroupTitle(items), "3 steps");
  assert.equal(stepGroupTitle([]), "0 steps");
});

test("joins in the locale", () => {
  const items = [
    { id: "a", status: "complete", group: "read" },
    { id: "b", status: "complete", group: "run" },
  ];
  assert.equal(stepGroupTitle(items, labels, "fr"), "Read 1 file et ran 1 command");
});
