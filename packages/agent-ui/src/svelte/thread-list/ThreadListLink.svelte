<!-- A thread's link: its title, then its status and unread marks, unless you pass children. -->
<script lang="ts">
  import type { ThreadListLinkState } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Link> = $props();
</script>

{#snippet fallback({ value, title }: ThreadListLinkState)}<span data-thread-list-title="">{title}</span><parts.Status
    {value}
  /><parts.Unread {value} />{/snippet}

<parts.Link {...props} children={children ?? fallback} />
