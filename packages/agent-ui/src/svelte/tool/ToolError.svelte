<!-- The `error` message while the status is `error`, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Error> = $props();
</script>

<parts.Error {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}{state.message}{/if}{/snippet}</parts.Error>
