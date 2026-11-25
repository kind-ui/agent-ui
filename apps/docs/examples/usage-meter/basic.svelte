<script lang="ts">
  import { UsageMeter } from "@/components/ui/svelte/usage-meter/index.js";
</script>

<UsageMeter
  used={3.2}
  limit={5}
  period="This month"
  breakdown={[
    { id: "planner", label: "Planner", value: 2.1 },
    { id: "coder", label: "Coder", value: 0.8 },
    { id: "reviewer", label: "Reviewer", value: 0.3 },
  ]}
/>
