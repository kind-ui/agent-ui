import { ScheduleCard } from "../components/ui/solid/schedule-card.js";

export default function ScheduleCardItem() {
  return (
    <ScheduleCard
      schedule={{ id: "triage", label: "Daily triage", description: "Weekdays at 9:00", enabled: true }}
      onRunNow={() => {}}
    />
  );
}
