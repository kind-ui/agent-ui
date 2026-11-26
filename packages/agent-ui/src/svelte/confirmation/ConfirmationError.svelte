<!-- "Decision not sent. Try again." while the host reports `submit-failed`, unless you pass children. -->
<script lang="ts">
  import { WORDS } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Error> = $props();
</script>

<parts.Error {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}{WORDS.notSentRetry}{/if}{/snippet}</parts.Error>
