<script module lang="ts">
  export const variants = ["all"];
</script>

<script lang="ts">
  import type { StepStatus } from "@kind-ui/agent-ui";
  import type { MotionMode } from "@kind-ui/agent-ui/core";
  import { Status, StatusIcon, StatusLabel } from "../../../../src/svelte/status/index.js";
  import { expose } from "../../shared/expose.js";

  const statuses: StepStatus[] = ["pending", "running", "awaiting-input", "complete", "error", "cancelled"];

  let status: StepStatus = $state("running");
  let label: string | undefined = $state();
  let motion: MotionMode = $state("auto");
  expose({
    kindStatus: {
      setStatus: (next: StepStatus) => (status = next),
      setLabel: (next: string | undefined) => (label = next),
      setMotion: (next: MotionMode) => (motion = next),
    },
  });
</script>

<div class="flex flex-col items-start gap-3 bg-[var(--kind-color-surface)] p-6">
  {#each statuses as each (each)}
    <Status status={each} />
  {/each}
  <Status id="live" {status} {label} {motion} />
  <Status id="composed" status="complete">
    <StatusLabel>
      {#snippet children({ label }: { label: string })}{`Build ${label.toLowerCase()}`}{/snippet}
    </StatusLabel>
    <StatusIcon />
  </Status>
</div>
