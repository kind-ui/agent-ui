<!--
  Calls `onAccept`. Reads "Accept plan", with a running mark while pending, unless you pass children. Rendered only
  while `onAccept` is set and the plan isn't accepted.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Accept> = $props();
</script>

<parts.Accept {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<span data-kind-pending-mark="" data-status-mark="" data-status="running" aria-hidden="true"></span
      >Accept plan{/if}{/snippet}</parts.Accept>
