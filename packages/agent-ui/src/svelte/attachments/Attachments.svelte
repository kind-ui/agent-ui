<!--
  The `items` as chips, one Tab stop with arrow keys between them. Name it with `aria-label`. Without children, each
  of its `rows` gets an `Attachment`, so a removed chip fades out. To style the chips, pass a `children` snippet of
  `{ rows }` that renders an `Attachment` per row, with the item's `id` as its `value`; chips rendered from `items`
  instead leave at once.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import Attachment from "./Attachment.svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

<parts.Root {...props}>
  {#snippet children(state)}
    {#if content}
      {@render content(state)}
    {:else}
      {#each state.rows as row (row.item.id)}
        <Attachment value={row.item.id} />
      {/each}
    {/if}
  {/snippet}
</parts.Root>
