<script lang="ts">
  import { Status } from "@/components/ui/svelte/status/index.js";
  import { Step, StepIcon, StepMeta, StepTitle, StepTrigger } from "@/components/ui/svelte/step/index.js";
  import { ThinkingIndicator } from "@/components/ui/svelte/thinking-indicator/index.js";

  // The last update arrived three minutes ago.
  const lastActivityAt = new Date(Date.now() - 3 * 60_000).toISOString();
</script>

<div class="flex w-full max-w-md flex-col items-start gap-4">
  <Step status="running" {lastActivityAt} class="w-full">
    <StepTrigger>
      <StepIcon />
      <StepTitle>Searching the docs</StepTitle>
      <StepMeta>3 min</StepMeta>
    </StepTrigger>
  </Step>
  <Status status="running" label="Deploying to staging" {lastActivityAt} />
  <ThinkingIndicator {lastActivityAt} />
</div>
