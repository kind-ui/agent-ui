import assert from "node:assert/strict";
import { test } from "node:test";
import { threadListRows, threadMark } from "@kind-ui/agent-ui/core";

const done = (n, extra = {}) => ({
  id: `done-${n}`,
  title: `Done ${n}`,
  status: "complete",
  updatedAt: `2026-11-${String(10 + n).padStart(2, "0")}T10:00:00Z`,
  ...extra,
});

test("one mark per row: approval and question wait, done and failed mark only while unread", () => {
  assert.equal(
    threadMark({ id: "a", title: "a", status: "awaiting-approval" })?.label,
    "Waiting for approval",
  );
  assert.equal(threadMark({ id: "a", title: "a", status: "awaiting-input" })?.label, "Needs input");
  assert.equal(threadMark({ id: "a", title: "a", status: "complete" }), undefined);
  assert.equal(threadMark({ id: "a", title: "a", status: "complete", unread: true })?.status, "complete");
  assert.equal(threadMark({ id: "a", title: "a", status: "error" }, { unreadOnly: true }), undefined);
  assert.equal(threadMark({ id: "a", title: "a", status: "error" })?.status, "error");
  assert.equal(threadMark({ id: "a", title: "a", status: "queued" })?.status, "pending");
});

test("Done shows its newest and unread threads, then pages behind a fold row", () => {
  const threads = Array.from({ length: 13 }, (_, n) => done(n + 1, n === 2 ? { unread: true } : {}));
  const rows = threadListRows(threads, { now: "2026-11-27", groupBy: "status" });
  assert.deepEqual(
    rows.map((row) => (row.type === "fold" ? [row.key, row.count, row.expanded] : row.key)),
    ["heading:done", "done-13", "done-3", ["fold:done", 11, false]],
  );
  assert.equal(rows[0].count, 13);
  const paged = threadListRows(threads, { now: "2026-11-27", groupBy: "status", donePages: 2 });
  assert.deepEqual(paged.at(-1), { type: "fold", key: "fold:done", count: 0, expanded: true });
});

test("archived threads leave the active view and list alone in the archived one", () => {
  const threads = [done(1), done(2, { archived: true }), done(3, { archived: true })];
  assert.deepEqual(
    threadListRows(threads, { now: "2026-11-27" }).flatMap((row) => (row.type === "thread" ? [row.key] : [])),
    ["done-1"],
  );
  assert.deepEqual(
    threadListRows(threads, { now: "2026-11-27", view: "archived" }).map((row) => row.key),
    ["heading:archived", "done-3", "done-2"],
  );
});
