<script lang="ts">
  import { Step, StepContent, StepIcon, StepMeta, StepTitle, StepTrigger } from "@/components/ui/svelte/step/index.js";
</script>

<div class="flex flex-col gap-1">
  <Step status="complete">
    <StepTrigger>
      <StepIcon />
      <StepTitle>Read the logs</StepTitle>
      <StepMeta>2 s</StepMeta>
    </StepTrigger>
    <StepContent>
      <p>Three requests timed out after 30 seconds.</p>
    </StepContent>
  </Step>
  <Step status="running" defaultOpen>
    <StepTrigger>
      <StepIcon />
      <StepTitle>Add a retry with backoff</StepTitle>
    </StepTrigger>
    <StepContent>
      <p>Editing src/client.ts.</p>
    </StepContent>
  </Step>
</div>
