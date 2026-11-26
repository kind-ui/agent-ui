<script lang="ts">
  import { StepGroup } from "../components/ui/svelte/step-group/index.js";
</script>

<StepGroup
  label="Read 3 files"
  items={[
    { id: "a", status: "complete" },
    { id: "b", status: "complete" },
    { id: "c", status: "complete" },
  ]}
  defaultOpen
>
  <p>Read three files.</p>
</StepGroup>
