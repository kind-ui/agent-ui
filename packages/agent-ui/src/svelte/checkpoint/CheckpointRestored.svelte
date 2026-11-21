<!-- "Restored" with a check, in Restore's place once the host restores the checkpoint, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Restored> = $props();
</script>

{#if children}
  <parts.Restored {...props} {children} />
{:else}
  <parts.Restored {...props}
    ><span aria-hidden="true" data-status-mark="" data-status="complete"></span>Restored</parts.Restored
  >
{/if}
