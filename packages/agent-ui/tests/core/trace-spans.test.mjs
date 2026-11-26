import assert from "node:assert/strict";
import { test } from "node:test";
import { traceModel, traceSpans, traceTime, waterfallItems } from "@kind-ui/agent-ui/core";

const steps = [
  {
    id: "agent",
    kind: "subagent",
    agent: { id: "a", name: "Researcher" },
    status: "complete",
    title: "Research",
    startedAt: "2026-11-25T10:00:00.000Z",
    endedAt: "2026-11-25T10:00:02.000Z",
    children: [
      {
        id: "search",
        kind: "tool",
        call: { toolCallId: "t1", name: "search", dynamic: false, input: { state: "ready", value: {} } },
        status: "complete",
        title: "search",
        startedAt: "2026-11-25T10:00:00.120Z",
        endedAt: "2026-11-25T10:00:00.460Z",
      },
      {
        id: "untimed",
        kind: "custom",
        name: "x",
        data: null,
        status: "complete",
        title: "Untimed",
        children: [
          {
            id: "think",
            kind: "reasoning",
            text: "",
            status: "running",
            title: "Thinking",
            startedAt: "2026-11-25T10:00:01.000Z",
          },
        ],
      },
    ],
  },
];

test("traceSpans nests timed steps in milliseconds from the earliest start", () => {
  assert.deepEqual(traceSpans(steps), [
    {
      id: "agent",
      name: "Research",
      kind: "agent",
      status: "complete",
      start: 0,
      end: 2000,
      children: [
        { id: "search", name: "search", kind: "tool", status: "complete", start: 120, end: 460 },
        { id: "think", name: "Thinking", kind: "model", status: "running", start: 1000 },
      ],
    },
  ]);
});

test("traceSpans counts from an origin", () => {
  const [span] = traceSpans(steps, { origin: "2026-11-25T09:59:59.000Z" });
  assert.equal(span.start, 1000);
  assert.equal(span.end, 3000);
});

test("a running span grows to now, else to the latest time any span reached", () => {
  const spans = [
    { id: "a", name: "A", start: 0, end: 500 },
    { id: "b", name: "B", start: 100 },
  ];
  assert.deepEqual(
    waterfallItems(spans).map((item) => item.duration),
    [500, 400],
  );
  assert.deepEqual(
    waterfallItems(spans, 900).map((item) => item.duration),
    [500, 800],
  );
  const model = traceModel(spans);
  assert.equal(model.running, true);
  assert.equal(model.entries.b.status, "running");
  assert.equal(model.entries.a.status, "complete");
});

test("ISO spans are placed from the earliest start, and now is the wall clock", () => {
  const spans = [
    { id: "a", name: "A", start: "2026-11-25T10:00:01.000Z", end: "2026-11-25T10:00:01.250Z" },
    { id: "b", name: "B", start: "2026-11-25T10:00:00.000Z" },
  ];
  const model = traceModel(spans, "2026-11-25T10:00:03.000Z");
  assert.equal(model.wallClock, true);
  assert.deepEqual(
    model.items.map(({ start, duration }) => [start, duration]),
    [
      [1000, 250],
      [0, 3000],
    ],
  );
  assert.equal(traceModel(spans, Date.parse("2026-11-25T10:00:02.000Z")).entries.b.duration, 2000);
});

test("an entry keeps its object while its span and times do", () => {
  const spans = [{ id: "a", name: "A", start: 0, end: 5, attributes: { tokens: 12, cached: true } }];
  const first = traceModel(spans).entries.a;
  assert.equal(traceModel(spans).entries.a, first);
  assert.deepEqual(first.attributes, [
    ["tokens", "12"],
    ["cached", "true"],
  ]);
});

test("traceTime writes milliseconds, seconds or minutes", () => {
  assert.equal(traceTime(340), "340 ms");
  assert.equal(traceTime(1250), "1.25 sec");
  assert.equal(traceTime(150000), "2.5 min");
});

test("an unknown status reads as the one its times say", () => {
  const { entries } = traceModel([
    { id: "a", name: "A", start: 0, end: 5, status: "done" },
    { id: "b", name: "B", start: 0, status: "toString" },
  ]);
  assert.equal(entries.a.status, "complete");
  assert.equal(entries.b.status, "running");
});
