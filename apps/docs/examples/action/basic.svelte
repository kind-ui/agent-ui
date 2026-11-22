<script lang="ts">
  import { Action } from "@/components/ui/svelte/action/index.js";
</script>

<Action
  status="complete"
  label="Explain"
  quote="Add a retry with exponential backoff."
  result="**Exponential backoff** waits longer after each failed attempt, like 1 s, then 2 s, then 4 s. A server that's struggling gets room to recover instead of a burst of retries."
/>
