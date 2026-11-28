<!-- When the limit resets, like "Resets Tuesday at 9:00 AM.", unless you pass a `children` snippet. Rendered only with `resetsAt`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./index.js";

  let { children, ...props }: ComponentProps<typeof parts.Reset> = $props();
</script>

{#snippet text(state: { text: string })}{state.text}{/snippet}

<parts.Reset {...props} children={children ?? text} />
