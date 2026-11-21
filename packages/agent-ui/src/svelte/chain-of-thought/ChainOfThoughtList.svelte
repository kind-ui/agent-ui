<!-- An item for each step, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import ChainOfThoughtItem from "./ChainOfThoughtItem.svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.List> = $props();
</script>

<parts.List {...props}>
  {#snippet children(state)}
    {#if content}
      {@render content(state)}
    {:else}
      {#each state.steps as step (step.id)}
        <ChainOfThoughtItem value={step.id} />
      {/each}
    {/if}
  {/snippet}
</parts.List>
