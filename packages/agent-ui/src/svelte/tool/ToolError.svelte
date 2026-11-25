<!-- The `error` message while the status is `error`, then Retry, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import ToolRetryButton from "./ToolRetryButton.svelte";

  let { children: content, ...props }: ComponentProps<typeof parts.Error> = $props();
</script>

<parts.Error {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<span data-tool-error-message=""
        >{state.message}</span
      ><ToolRetryButton
    />{/if}{/snippet}</parts.Error>
