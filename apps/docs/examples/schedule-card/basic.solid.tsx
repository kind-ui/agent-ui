import type { Schedule } from "@kind-ui/agent-ui";
import { createSignal } from "solid-js";
import { ScheduleCard } from "@/components/ui/solid/schedule-card";

const inTwentyMinutes = () => new Date(Date.now() + 20 * 60_000).toISOString();

export default function ScheduleCardExample() {
  const [schedule, setSchedule] = createSignal<Schedule>({
    id: "triage",
    label: "Daily triage",
    description: "Weekdays at 9:00, new issues in kind-ui/agent-ui",
    enabled: true,
    nextRunAt: inTwentyMinutes(),
    lastRun: { at: new Date(Date.now() - 86_400_000).toISOString(), status: "complete", href: "#" },
  });

  const runNow = () =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        setSchedule((current) => ({
          ...current,
          lastRun: { at: new Date().toISOString(), status: "running", href: "#" },
        }));
        resolve();
      }, 800);
    });

  return (
    <ScheduleCard
      class="w-full max-w-md"
      schedule={schedule()}
      onEnabledChange={(enabled) => setSchedule((current) => ({ ...current, enabled }))}
      onRunNow={runNow}
      onEdit={() => {}}
    />
  );
}
