<script lang="ts">
  import { ReasoningEffort } from "@/components/ui/svelte/reasoning-effort/index.js";

  let effort = $state<string | null>("medium");
</script>

<ReasoningEffort bind:value={effort} />
