<!--
  While the call retries: "Retrying, attempt 2 of 5, in 4 sec" and the reason, after a running mark, unless you pass
  children.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Retry> = $props();
</script>

<parts.Retry {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<span
        data-status-mark=""
        data-status="running"
        aria-hidden="true"
      ></span>{state.text}{/if}{/snippet}</parts.Retry>
