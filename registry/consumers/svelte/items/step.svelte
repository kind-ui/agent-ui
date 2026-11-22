<script lang="ts">
  import { Step, StepContent, StepIcon, StepTitle, StepTrigger } from "../components/ui/svelte/step/index.js";
</script>

<Step status="complete">
  <StepTrigger>
    <StepIcon />
    <StepTitle>Read the logs</StepTitle>
  </StepTrigger>
  <StepContent>
    <p>Three timeouts.</p>
  </StepContent>
</Step>
