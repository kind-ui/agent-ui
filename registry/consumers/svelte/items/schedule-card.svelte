<script lang="ts">
  import { ScheduleCard } from "../components/ui/svelte/schedule-card/index.js";
</script>

<ScheduleCard
  schedule={{ id: "triage", label: "Daily triage", description: "Weekdays at 9:00", enabled: true }}
  onRunNow={() => {}}
/>
