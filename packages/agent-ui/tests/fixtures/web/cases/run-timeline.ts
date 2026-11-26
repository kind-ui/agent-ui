import type { RunTimelineLoadReason } from "@kind-ui/agent-ui/core";
import { defineRunTimeline } from "../../../../src/web/run-timeline.js";
import { expose } from "../../shared/expose.js";
import { appended, earlier, events } from "../../shared/run-timeline.js";

const page =
  ({ feed = false }: { feed?: boolean } = {}) =>
  (root: HTMLElement) => {
    defineRunTimeline();
    const section = document.createElement("section");
    section.id = "run-timeline";
    section.className = "w-[28rem] p-6";
    const element = document.createElement("kind-run-timeline");
    element.timeZone = "UTC";
    element.feed = feed;
    element.order = feed ? "newest-first" : "oldest-first";
    element.hasMore = !feed;
    element.canLoadMore = true;
    element.events = events;
    const loads: RunTimelineLoadReason[] = [];
    element.addEventListener("loadmore", (event) => {
      loads.push(event.detail.reason);
      element.busy = true;
    });
    section.append(element);
    root.append(section);
    expose({
      kindHost: {
        loads,
        append: () => {
          element.events = appended(element.events ?? []);
        },
        settle: () => {
          element.events = [earlier, ...(element.events ?? [])];
          element.hasMore = false;
          element.busy = false;
        },
      },
    });
  };

export const cases = { all: page(), feed: page({ feed: true }) };
