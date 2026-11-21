<!--
  A summary of the steps an agent took, which expands into them. Any `children` replace the default trigger and
  content.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import ChainOfThoughtList from "./ChainOfThoughtList.svelte";
  import ChainOfThoughtMeta from "./ChainOfThoughtMeta.svelte";
  import ChainOfThoughtTitle from "./ChainOfThoughtTitle.svelte";
  import { parts } from "./parts.js";

  let {
    children: content,
    open = $bindable(),
    openSteps = $bindable(),
    ...props
  }: ComponentProps<typeof parts.Root> = $props();
</script>

<parts.Root {...props} bind:open bind:openSteps>
  {#snippet children(state)}
    {#if content}
      {@render content(state)}
    {:else}
      <parts.Trigger>
        <parts.Icon />
        <ChainOfThoughtTitle />
        <ChainOfThoughtMeta />
      </parts.Trigger>
      <parts.Content>
        <ChainOfThoughtList />
      </parts.Content>
    {/if}
  {/snippet}
</parts.Root>
