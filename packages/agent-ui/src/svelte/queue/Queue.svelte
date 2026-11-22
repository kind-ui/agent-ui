<!--
  The agent's queue: pending items under Queued, complete ones under Completed, each with a count. Any `children`
  replace the default sections.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import QueueInstructions from "./QueueInstructions.svelte";
  import QueueList from "./QueueList.svelte";
  import QueueSectionTrigger from "./QueueSectionTrigger.svelte";

  let { children, ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet section(value: "pending" | "complete")}<parts.Section {value}
    ><QueueSectionTrigger
    /><parts.SectionContent
      ><QueueList
    /></parts.SectionContent
  ></parts.Section
>{/snippet}{#snippet fallback()}{@render section("pending")}{@render section("complete")}<QueueInstructions
/>{/snippet}<parts.Root {...props} children={children ?? fallback} />
