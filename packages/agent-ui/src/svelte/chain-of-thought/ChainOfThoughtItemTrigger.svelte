<!-- Opens and closes the step's content. Without children, it shows the step's icon, title and duration. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import ChainOfThoughtItemMeta from "./ChainOfThoughtItemMeta.svelte";
  import ChainOfThoughtItemTitle from "./ChainOfThoughtItemTitle.svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.ItemTrigger> = $props();
</script>

<parts.ItemTrigger {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<parts.ItemIcon
      /><ChainOfThoughtItemTitle
      /><ChainOfThoughtItemMeta
    />{/if}{/snippet}</parts.ItemTrigger>
