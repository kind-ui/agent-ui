<script lang="ts">
  import { Plan } from "../components/ui/svelte/plan/index.js";
</script>

<Plan
  label="Migration plan"
  items={[{ id: "audit", status: "complete", title: "Audit the current schema" }]}
  defaultOpen
/>
