import assert from "node:assert/strict";
import { test } from "node:test";
import { currentAt, searchSegments, transcriptPrimitive } from "@kind-ui/agent-ui/core";

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

test("currentAt finds the segment and word at a time, keeps a word through the pause after it, and has none in a gap", () => {
  assert.deepEqual(currentAt(segments, 0), { segment: "a", word: 0 });
  assert.deepEqual(currentAt(segments, 1.5), { segment: "a", word: 3 });
  assert.deepEqual(currentAt(segments, 0.65), { segment: "a", word: 0 });
  assert.deepEqual(currentAt(segments, 4.5), {});
  assert.deepEqual(currentAt(segments, 9), { segment: "c" });
  assert.deepEqual(currentAt(segments, -1), {});
  assert.deepEqual(currentAt(segments, 12), {});
});

test("seek and search refuse what they can't do, and an owner's refusal keeps the search", () => {
  const seeks = [];
  const transcript = transcriptPrimitive({
    segments,
    query: "",
    onQueryChange: (_query, details) => details.cancel(),
    onSeek: (time, details) => seeks.push([time, details.reason]),
  });
  assert.equal(transcript.api.search("build"), false);
  assert.equal(transcript.get().query, "");
  assert.equal(transcript.api.seek("constructor"), false);
  assert.equal(transcript.api.seek("b"), true);
  assert.deepEqual(seeks, [[5, "imperative"]]);
  assert.equal(transcript.api.timeOf("toString"), "");
  assert.equal(transcript.api.timeOf("c"), "0:09");
  assert.equal(transcriptPrimitive({ segments }).api.seek, undefined);
});
