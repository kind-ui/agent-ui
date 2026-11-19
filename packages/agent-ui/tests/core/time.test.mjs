import assert from "node:assert/strict";
import { test } from "node:test";
import {
  dateGroup,
  dayKey,
  dayLabel,
  durationLabel,
  isContinuation,
  timeLabel,
  todayKey,
} from "@kind-ui/agent-ui/core";

const now = "2026-11-18T07:30:00Z";
const utc = { now, locale: "en", timeZone: "UTC" };

test("dayLabel reads relative days in the given zone", () => {
  assert.equal(dayLabel("2026-11-18T01:00:00Z", utc), "today");
  assert.equal(dayLabel("2026-11-17T23:00:00Z", utc), "yesterday");
  // 15:00 and 23:30 on Nov 17 in Los Angeles.
  assert.equal(dayLabel("2026-11-17T23:00:00Z", { ...utc, timeZone: "America/Los_Angeles" }), "today");
  assert.equal(dayLabel("2026-11-14T12:00:00Z", utc), "Saturday");
  assert.equal(dayLabel("2026-11-02T12:00:00Z", utc), "November 2, 2026");
  assert.equal(dayLabel("2026-11-18T01:00:00Z", { locale: "en" }), "November 18, 2026", "no now: the date");
  assert.equal(dayLabel("2026-11-17", { now: "2026-11-18", locale: "de" }), "gestern");
  assert.equal(dayLabel("not a date", utc), "");
});

test("dayKey takes an ISO date as its own day and an instant in the zone", () => {
  assert.equal(dayKey("2026-11-17"), "2026-11-17");
  assert.equal(dayKey("2026-11-18T01:00:00Z", "Asia/Tokyo"), "2026-11-18");
  assert.equal(dayKey("2026-11-18T01:00:00Z", "America/Los_Angeles"), "2026-11-17");
  assert.equal(dayKey("2026-02-30"), undefined);
  assert.equal(
    dayKey("2026-11-17T23:30:00", "UTC"),
    "2026-11-17",
    "no offset: UTC, whatever the machine's zone",
  );
  assert.equal(dayKey("Nov 17 2026"), undefined);
  assert.match(todayKey("Not/AZone"), /^\d{4}-\d{2}-\d{2}$/);
});

test("timeLabel adds the date when not today, and the year when not this year", () => {
  assert.equal(timeLabel("2026-11-18T06:05:00Z", utc), "6:05 AM");
  assert.equal(timeLabel("2026-11-17T18:05:00Z", utc), "Nov 17, 6:05 PM");
  assert.equal(timeLabel("2025-12-31T18:05:00Z", utc), "Dec 31, 2025, 6:05 PM");
  assert.equal(timeLabel("2026-11-18", utc), "");
});

test("durationLabel joins whole units in the locale's short form", () => {
  assert.equal(durationLabel(4.2, "en"), "4 sec");
  assert.equal(durationLabel(72, "en"), "1 min 12 sec");
  assert.equal(durationLabel(3600, "en"), "1 hr");
  assert.equal(durationLabel(0.2, "en"), "1 sec");
  assert.equal(durationLabel(undefined), "");
});

test("isContinuation needs the same author within the window", () => {
  const ada = { id: "ada", name: "Ada" };
  const first = { author: ada, createdAt: "2026-11-18T07:00:00Z" };
  assert.equal(isContinuation(first, { author: ada, createdAt: "2026-11-18T07:04:00Z" }), true);
  assert.equal(isContinuation(first, { author: ada, createdAt: "2026-11-18T07:06:00Z" }), false);
  assert.equal(
    isContinuation(first, { author: { id: "bo", name: "Bo" }, createdAt: first.createdAt }),
    false,
  );
  assert.equal(isContinuation(undefined, first), false);
});

test("dateGroup buckets by days back, then month this year, then year", () => {
  const group = (iso) => dateGroup(iso, utc);
  assert.deepEqual(group("2026-11-20T00:00:00Z"), { key: "today", label: "today" });
  assert.deepEqual(group("2026-11-11T12:00:00Z"), { key: "previous-7-days", label: "Previous 7 days" });
  assert.deepEqual(group("2026-10-19T12:00:00Z"), { key: "previous-30-days", label: "Previous 30 days" });
  assert.deepEqual(group("2026-10-18T12:00:00Z"), { key: "2026-10", label: "October" });
  assert.deepEqual(group("2025-12-30T12:00:00Z"), { key: "2025", label: "2025" });
  assert.deepEqual(group(undefined), { key: "older", label: "Older" });
  assert.equal(
    dateGroup("2026-11-17T12:00:00Z", { ...utc, labels: { yesterday: "Gestern" } }).label,
    "Gestern",
  );
});
