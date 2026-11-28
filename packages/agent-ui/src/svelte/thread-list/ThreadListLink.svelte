<!-- A thread's link: its title and its one mark, then its second line, unless you pass children. -->
<script lang="ts">
  import type { ThreadListLinkState, ThreadListSummaryState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Link> = $props();
</script>

{#snippet fallback({ value, title }: ThreadListLinkState)}<span data-thread-list-title="">{title}</span><parts.Status
    {value}
  /><parts.Unread {value} /><parts.Summary {value} children={summary} />{/snippet}

{#snippet summary({ lead, pieces }: ThreadListSummaryState)}{lead}{#if lead && pieces.length > 0}{" · "}{/if}{#each pieces as piece, index (index)}{#if index % 2}<code
        >{piece}</code
      >{:else}{piece}{/if}{/each}{/snippet}

<parts.Link {...props} children={children ?? fallback} />
