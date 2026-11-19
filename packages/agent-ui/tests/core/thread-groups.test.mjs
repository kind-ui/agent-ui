import assert from "node:assert/strict";
import { test } from "node:test";
import { threadGroups } from "@kind-ui/agent-ui/core";

test("threadGroups puts pinned first, then host groups, then date buckets", () => {
  const threads = [
    { id: "old", title: "Old", updatedAt: "2025-03-01T12:00:00Z" },
    { id: "today-1", title: "Today 1", updatedAt: "2026-11-18T06:00:00Z" },
    { id: "work-1", title: "Work 1", group: "Work", updatedAt: "2026-11-18T06:00:00Z" },
    { id: "pin", title: "Pinned", pinned: true, group: "Work", updatedAt: "2024-01-01T00:00:00Z" },
    { id: "oct", title: "October", updatedAt: "2026-10-01T12:00:00Z" },
    { id: "home", title: "Home", group: "Home" },
    { id: "today-2", title: "Today 2", updatedAt: "2026-11-18T01:00:00Z" },
    { id: "work-2", title: "Work 2", group: "Work" },
    { id: "undated", title: "Undated" },
  ];
  const groups = threadGroups(threads, {
    now: "2026-11-18",
    locale: "en",
    timeZone: "UTC",
    labels: { pinned: "Starred" },
  });
  assert.deepEqual(
    groups.map(({ key, label, threads }) => [key, label, threads.map((thread) => thread.id)]),
    [
      ["pinned", "Starred", ["pin"]],
      ["group:Work", "Work", ["work-1", "work-2"]],
      ["group:Home", "Home", ["home"]],
      ["today", "today", ["today-1", "today-2"]],
      ["2026-10", "October", ["oct"]],
      ["2025", "2025", ["old"]],
      ["older", "Older", ["undated"]],
    ],
  );
});

test("an empty or null group falls back to the date group", () => {
  const threads = [
    { id: "a", title: "A", group: "", updatedAt: "2026-11-18T01:00:00Z" },
    { id: "b", title: "B", group: null, updatedAt: "2026-11-18T02:00:00Z" },
  ];
  assert.deepEqual(
    threadGroups(threads, { now: "2026-11-18" }).map(({ key, threads }) => [key, threads.length]),
    [["today", 2]],
  );
});
