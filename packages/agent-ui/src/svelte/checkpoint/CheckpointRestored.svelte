<!-- "Restored" with a check, in Restore's place once the host restores the checkpoint, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Restored> = $props();
</script>

{#snippet fallback()}<span aria-hidden="true" data-status-mark="" data-status="complete"></span>Restored{/snippet}

<parts.Restored {...props} children={children ?? fallback} />
