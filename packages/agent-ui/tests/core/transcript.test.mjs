import assert from "node:assert/strict";
import { test } from "node:test";
import { currentAt, searchSegments } from "@kind-ui/agent-ui/core";

const segments = [
  {
    id: "a",
    speaker: "Ada",
    start: 0,
    end: 4,
    text: "Welcome to the review.",
    words: [
      { text: "Welcome", start: 0, end: 0.6 },
      { text: " to", start: 0.7, end: 0.9 },
      { text: " the", start: 0.9, end: 1.1 },
      { text: " review.", start: 1.2, end: 2 },
    ],
  },
  { id: "b", speaker: "Grace", start: 5, end: 9, text: "The build is green." },
  { id: "c", speaker: "Ada", start: 9, end: 12, text: "Ship it." },
];

test("searchSegments keeps matches of text or speaker in time order and drops the rest", () => {
  const ids = (query) => searchSegments(segments, query).map((segment) => segment.id);
  assert.deepEqual(ids("ada"), ["a", "c"]);
  assert.deepEqual(ids("build"), ["b"]);
  assert.deepEqual(ids("zzz"), []);
  assert.equal(searchSegments(segments, "  "), segments);
});

test("currentAt finds the segment and word at a time, and none in a gap", () => {
  assert.deepEqual(currentAt(segments, 0), { segment: "a", word: 0 });
  assert.deepEqual(currentAt(segments, 1.5), { segment: "a", word: 3 });
  assert.deepEqual(currentAt(segments, 0.65), { segment: "a" });
  assert.deepEqual(currentAt(segments, 4.5), {});
  assert.deepEqual(currentAt(segments, 9), { segment: "c" });
  assert.deepEqual(currentAt(segments, -1), {});
  assert.deepEqual(currentAt(segments, 12), {});
});
