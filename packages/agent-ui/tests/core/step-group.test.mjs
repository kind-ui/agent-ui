import assert from "node:assert/strict";
import { test } from "node:test";
import {
  aggregateStatus,
  stepGroupFinished,
  stepGroupMeta,
  stepGroupSentence,
  stepGroupTitle,
} from "@kind-ui/agent-ui/core";

const kinds = {
  read: { live: "Reading", done: "Read", one: "file", many: "files" },
  edit: { live: "Editing", done: "Edited", one: "file", many: "files" },
  run: { live: "Running", done: "Ran", one: "command", many: "commands" },
  agent: { live: "Running", done: "Ran", one: "agent", many: "agents" },
};
const item = (id, status, kind, target) => ({ id, status, kind, target });

test("the group takes its most urgent child's status", () => {
  assert.equal(aggregateStatus(["complete", "awaiting-input", "error"]), "awaiting-input");
  assert.equal(aggregateStatus(["complete", "error", "running"]), "error");
  assert.equal(aggregateStatus(["complete", "pending"]), "running");
  assert.equal(aggregateStatus(["pending", "pending"]), "pending");
  assert.equal(aggregateStatus(["cancelled", "pending"]), "pending");
  assert.equal(aggregateStatus(["complete", "cancelled"]), "cancelled");
  assert.equal(aggregateStatus(["complete", "complete"]), "complete");
  assert.equal(aggregateStatus([]), "pending");
});

test("the title names targets, joins kinds and caps the clauses", () => {
  assert.equal(
    stepGroupSentence(
      [
        item("1", "complete", "read", "sign-in.ts"),
        item("2", "complete", "read", "session.ts"),
        item("3", "error", "run", "npm test"),
      ],
      kinds,
    ),
    "Read `sign-in.ts`, `session.ts` and ran `npm test`",
  );
  assert.equal(
    stepGroupSentence([item("1", "complete", "read", "a.ts"), item("2", "complete", "read", "a.ts")], kinds),
    "Read `a.ts`",
  );
  const many = [
    ...["a", "b", "c", "d", "e", "f"].map((name) => item(name, "complete", "read", `${name}.ts`)),
    item("g", "complete", "edit", "a.ts"),
    item("h", "complete", "edit", "b.ts"),
    item("i", "complete", "edit", "c.ts"),
    item("j", "complete", "run", "npm test"),
    item("k", "complete"),
    item("l", "complete", "unknown"),
  ];
  assert.equal(stepGroupSentence(many, kinds), "Read 6 files, edited 3 files and 3 other steps");
  assert.equal(
    stepGroupSentence(many, kinds, 3),
    "Read 6 files, edited 3 files, ran `npm test` and 2 other steps",
  );
  assert.equal(stepGroupSentence(many), "12 steps");
});

test("while running, the title is the live step; agents and parallel steps count", () => {
  const items = [
    item("1", "complete", "read", "a.ts"),
    item("2", "running", "run", "npm test"),
    item("3", "pending", "run", "npm run lint"),
  ];
  assert.equal(stepGroupTitle({ status: "running", items, kinds }), "Running `npm test`");
  assert.equal(stepGroupTitle({ status: "running", items, kinds, current: "Testing" }), "Testing");
  const agents = [
    item("a", "complete", "agent"),
    item("b", "running", "agent"),
    item("c", "pending", "agent"),
  ];
  assert.equal(stepGroupTitle({ status: "running", items: agents, kinds }), "Running 3 agents");
  assert.equal(
    stepGroupTitle({
      status: "error",
      items: agents.map((each, index) => ({ ...each, status: index ? "complete" : "error" })),
      kinds,
    }),
    "Ran 3 agents",
  );
  const reads = [
    item("1", "running", "read", "a.ts"),
    item("2", "running", "read", "b.ts"),
    item("3", "running", "read", "c.ts"),
  ];
  assert.equal(stepGroupTitle({ status: "running", items: reads, kinds }), "Reading 3 files");
});

test("while waiting, the title is the work so far", () => {
  const items = [
    item("1", "complete", "read", "package.json"),
    item("2", "complete", "read", "build.ts"),
    item("3", "awaiting-input", "run", "rm -rf dist"),
  ];
  assert.equal(
    stepGroupTitle({ status: "awaiting-input", items, kinds }),
    "Read `package.json` and `build.ts`",
  );
  assert.equal(stepGroupMeta({ status: "awaiting-input", items, open: true }), "1 waiting");
  assert.equal(stepGroupMeta({ status: "awaiting-input", items, open: false }), "Waiting for approval");
});

test("the meta says progress, failures and stops in words", () => {
  const running = [
    item("1", "complete"),
    item("2", "complete"),
    item("3", "complete"),
    item("4", "running"),
    item("5", "pending"),
  ];
  assert.equal(stepGroupMeta({ status: "running", items: running, open: false }), "3 of 5");
  const failed = [item("1", "complete"), item("2", "error"), item("3", "complete")];
  assert.equal(
    stepGroupMeta({ status: "error", items: failed, open: false, durationSeconds: 41 }),
    "1 failed · 41 sec",
  );
  assert.equal(
    stepGroupMeta({ status: "error", items: [item("1", "complete")], open: false, durationSeconds: 12 }),
    "Failed after 12 sec",
  );
  assert.equal(
    stepGroupMeta({ status: "cancelled", items: failed, open: false, durationSeconds: 41 }),
    "Stopped after 41 sec",
  );
  assert.equal(
    stepGroupMeta({ status: "complete", items: failed, open: false, durationSeconds: 72 }),
    "1 min 12 sec",
  );
  assert.equal(stepGroupMeta({ status: "complete", items: failed, open: false }), "");
});

test("steps finishing together read as one sentence", () => {
  assert.equal(
    stepGroupFinished(
      [item("a", "complete", "agent"), item("b", "error", "agent"), item("c", "complete", "agent")],
      kinds,
    ),
    "3 agents finished, 1 failed",
  );
  assert.equal(
    stepGroupFinished([item("a", "complete", "read"), item("b", "cancelled", "run")], kinds),
    "2 steps finished, 1 stopped",
  );
});
