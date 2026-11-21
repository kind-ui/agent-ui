<!-- Closes the reason box without deciding. Reads "Cancel" unless you pass children. Rendered while the box is open. -->
<script lang="ts">
  import type { ConfirmationState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Cancel> = $props();
</script>

<parts.Cancel {...props}>
  {#snippet children(state)}
    {#if content}{@render content(state)}{:else}Cancel{/if}
  {/snippet}
</parts.Cancel>
