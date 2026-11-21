<!-- "Draft restored" with Discard, shown while a draft restored from `draftStorage` is still unedited. -->
<script lang="ts">
  import type { ComposerState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Restored> = $props();
</script>

<parts.Restored {...props}>
  {#snippet children(state)}
    {#if content}
      {@render content(state)}
    {:else}
      <span>Draft restored</span><parts.Discard>Discard</parts.Discard>
    {/if}
  {/snippet}
</parts.Restored>
