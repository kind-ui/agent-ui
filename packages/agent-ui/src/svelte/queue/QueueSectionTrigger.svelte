<!-- The section's title and count, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.SectionTrigger> = $props();
</script>

<parts.SectionTrigger {...props}>
  {#snippet children(state)}{#if content}{@render content(state)}{:else}<span data-title="">{state.title}</span><span
        data-count="">{state.count}</span
      >{/if}{/snippet}
</parts.SectionTrigger>
