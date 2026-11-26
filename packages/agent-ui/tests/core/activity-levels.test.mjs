import assert from "node:assert/strict";
import { test } from "node:test";
import { activityLevels, activityWeeks } from "@kind-ui/agent-ui/core";

test("activityWeeks ends with now's week, from the week start", () => {
  const weeks = activityWeeks([], { now: "2026-11-25", weeks: 53, weekStart: 0 });
  assert.equal(weeks.length, 53);
  assert.equal(weeks[52].start, "2026-11-22");
  assert.equal(weeks[0].start, "2025-11-23");
  assert.deepEqual(
    weeks[52].days.map((day) => [day.date, day.future]),
    [
      ["2026-11-22", false],
      ["2026-11-23", false],
      ["2026-11-24", false],
      ["2026-11-25", false],
      ["2026-11-26", true],
      ["2026-11-27", true],
      ["2026-11-28", true],
    ],
  );
});

test("activityWeeks starts weeks on Monday and keeps a leap day", () => {
  const weeks = activityWeeks(
    [
      { date: "2028-02-29", count: 3 },
      { date: "2028-02-29", count: 2 },
      { date: "2028-02-30", count: 9 },
    ],
    { now: "2028-03-01", weeks: 2, weekStart: 1 },
  );
  assert.deepEqual(
    weeks.map((week) => week.start),
    ["2028-02-21", "2028-02-28"],
  );
  assert.deepEqual(
    weeks[1].days.slice(0, 3).map((day) => [day.date, day.count]),
    [
      ["2028-02-28", 0],
      ["2028-02-29", 5],
      ["2028-03-01", 0],
    ],
  );
});

test("activityLevels buckets counts above zero by quantile", () => {
  assert.deepEqual(activityLevels([0, 1, 2, 3, 4], 4), [0, 1, 2, 3, 4]);
  assert.deepEqual(activityLevels([0, 5, 5, 5], 4), [0, 4, 4, 4]);
  assert.deepEqual(activityLevels([1, 100], 4), [2, 4]);
  assert.deepEqual(activityLevels([0, 0], 4), [0, 0]);
  assert.deepEqual(activityLevels([3, 1, 2], 1), [1, 1, 1]);
});
