<!--
  The steps an agent takes for one task, as it takes them, with how many are done. Any `children` replace the
  default trigger and content.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import TaskList from "./TaskList.svelte";
  import TaskMeta from "./TaskMeta.svelte";
  import TaskTitle from "./TaskTitle.svelte";

  let { children: content, open = $bindable(), ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

<parts.Root {...props} bind:open
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<parts.Trigger
        ><parts.Icon
        /><TaskTitle
        /><TaskMeta
      /></parts.Trigger
      ><parts.Content
        ><TaskList
      /></parts.Content
    >{/if}{/snippet}</parts.Root>
