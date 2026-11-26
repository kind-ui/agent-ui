<script lang="ts">
  import type { Schedule } from "@kind-ui/agent-ui";
  import { ScheduleCard } from "@/components/ui/svelte/schedule-card/index.js";

  const inTwentyMinutes = () => new Date(Date.now() + 20 * 60_000).toISOString();

  let schedule: Schedule = $state.raw({
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
        schedule = { ...schedule, lastRun: { at: new Date().toISOString(), status: "running", href: "#" } };
        resolve();
      }, 800);
    });
</script>

<ScheduleCard
  class="w-full max-w-md"
  {schedule}
  onEnabledChange={(enabled: boolean) => (schedule = { ...schedule, enabled })}
  onRunNow={runNow}
  onEdit={() => {}}
/>
