<!-- The step whose `id` is `value`. Without children, it shows the step's trigger. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import ChainOfThoughtItemTrigger from "./ChainOfThoughtItemTrigger.svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Item> = $props();
</script>

<parts.Item {...props}>
  {#snippet children(state)}
    {#if content}{@render content(state)}{:else}<ChainOfThoughtItemTrigger />{/if}
  {/snippet}
</parts.Item>
