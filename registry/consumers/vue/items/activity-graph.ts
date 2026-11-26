import { h } from "vue";
import { ActivityGraph } from "../components/ui/vue/activity-graph.js";

export default () =>
  h(ActivityGraph, { days: [{ date: "2026-11-18", count: 3 }], now: "2026-11-18", timeZone: "UTC" });
