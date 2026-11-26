import { h } from "vue";
import { ScheduleCard } from "../components/ui/vue/schedule-card.js";

export default () =>
  h(ScheduleCard, {
    schedule: { id: "triage", label: "Daily triage", description: "Weekdays at 9:00", enabled: true },
    onRunNow: () => {},
  });
