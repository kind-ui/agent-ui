import type { MotionMode } from "@kind-ui/agent-ui/core";
import { defineTrace } from "../../../../src/web/trace.js";
import { manySpans, runningSpans, spans, type TraceLog } from "../../shared/trace.js";

const page =
  ({ motion, refuse, running }: { motion?: MotionMode; refuse?: boolean; running?: boolean } = {}) =>
  (root: HTMLElement) => {
    defineTrace();
    const log: TraceLog = { values: [], expanded: [] };
    const container = document.createElement("div");
    container.className = "w-[44rem] max-w-full p-6";
    const element = document.createElement("kind-trace");
    element.id = "trace";
    element.label = "Agent run";
    if (motion) element.motion = motion;
    element.defaultExpanded = ["run"];
    element.addEventListener("spanselect", (event) => {
      log.values.push(`${event.detail.value} ${event.detail.reason}`);
      if (refuse) event.preventDefault();
    });
    element.addEventListener("expandchange", (event) => {
      log.expanded.push(`${event.detail.value.join(",")} ${event.detail.reason}`);
      if (refuse) event.preventDefault();
    });
    container.append(element);
    root.append(container);
    if (running) element.now = 4000;
    element.spans = running ? runningSpans : spans;
    Object.assign(window, {
      kindLog: log,
      kindHost: {
        tick: (ms: number) => {
          element.now = ms;
        },
      },
    });
  };

const many = (count: number) => (root: HTMLElement) => {
  defineTrace();
  const { spans: list, expanded } = manySpans(count);
  const container = document.createElement("div");
  container.className = "w-[400px]";
  container.style.setProperty("--kind-trace-height", "600px");
  const element = document.createElement("kind-trace");
  element.motion = "none";
  element.defaultExpanded = expanded;
  container.append(element);
  root.append(container);
  element.spans = list;
  Object.assign(window, {
    kindTrace: {
      select: (id: string | null) => {
        element.value = id;
      },
      toggle: (id: string) => {
        const open = element.expanded;
        element.expanded = open.includes(id) ? open.filter((other) => other !== id) : [...open, id];
      },
    },
  });
};

export const cases = {
  all: page(),
  running: page({ running: true }),
  reduced: page({ motion: "reduced" }),
  refused: page({ refuse: true }),
  "many-50": many(50),
  "many-5000": many(5000),
};
