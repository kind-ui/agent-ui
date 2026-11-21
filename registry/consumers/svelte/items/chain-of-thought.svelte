<script lang="ts">
  import { ChainOfThought } from "../components/ui/svelte/chain-of-thought/index.js";
</script>

<ChainOfThought
  label="Researching flights"
  status="complete"
  steps={[{ id: "search", status: "complete", title: "Search flights", durationSeconds: 3 }]}
  defaultOpen
/>
