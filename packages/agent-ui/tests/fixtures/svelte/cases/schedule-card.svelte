<script module lang="ts">
  export const variants = ["all", "soon", "paused", "unsafe", "new", "refusing", "unconfirmed", "bare"];
</script>

<script lang="ts">
  import type { Schedule } from "@kind-ui/agent-ui";
  import type { ScheduleCardActionDetails, ScheduleEnabledChangeReason } from "@kind-ui/agent-ui/core";
  import type { ChangeDetails } from "@ui-sdk/core";
  import { untrack } from "svelte";
  import { ScheduleCard } from "../../../../src/svelte/schedule-card/index.js";
  import { expose } from "../../shared/expose.js";
  import { scheduleCardHost, schedules } from "../../shared/schedule-card.js";

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const { host, record, runNow } = scheduleCardHost();
  const refusing = $derived(variant === "refusing");
  const agentConfirm = $derived(variant === "unconfirmed" ? false : undefined);
  const actions = $derived(variant !== "bare");

  let schedule: Schedule = $state.raw(untrack(() => (schedules[variant] ?? schedules.all) as Schedule));
  expose({ kindHost: host });
</script>

<div class="max-w-[28rem] p-6">
  <ScheduleCard
    id="schedule"
    {schedule}
    timeZone="UTC"
    {agentConfirm}
    onEnabledChange={(enabled: boolean, details: ChangeDetails<ScheduleEnabledChangeReason>) => {
      record("enabled", details, enabled);
      if (!refusing) schedule = { ...schedule, enabled };
    }}
    onRunNow={actions ? runNow : undefined}
    onEdit={actions ? (id: string, details: ScheduleCardActionDetails) => record("edit", details, id) : undefined}
  />
</div>
