<!--
  The track beside the scrollbar that shows each message in `marks`, one `ConversationMark` per 4px step that holds
  one, unless you pass children. Hidden from assistive technology.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Marks> = $props();
</script>

{#snippet steps({ marks }: { marks: readonly number[] })}
  {#each marks as step (step)}<parts.Mark value={String(step)} />{/each}
{/snippet}

<parts.Marks {...props} children={children ?? steps} />
