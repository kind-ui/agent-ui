<!-- Compacts the conversation. Rendered while `onCompact` is set and nothing is compacting. -->
<script lang="ts">
  import { WORDS } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Compact> = $props();
</script>

{#snippet text()}{WORDS.compact}{/snippet}

<parts.Compact {...props} children={children ?? text} />
