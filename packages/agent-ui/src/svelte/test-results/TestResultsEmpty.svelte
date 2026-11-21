<!-- What shows when the filter lets no test through, like "No failed tests", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Empty> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.Empty {...props} children={children ?? fallback} />
