import { h } from "vue";
import { RunTimeline } from "../components/ui/vue/run-timeline.js";

export default () =>
  h(RunTimeline, {
    events: [{ id: "started", at: "2026-11-10T14:02:00Z", title: "Run started", status: "complete" }],
    timeZone: "UTC",
  });
