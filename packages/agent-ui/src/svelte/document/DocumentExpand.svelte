<!-- "Show more", or "Show less" while expanded. Rendered only while the content overflows the preview. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Expand> = $props();
</script>

{#snippet fallback({ label }: { label: string })}{label}{/snippet}

<parts.Expand {...props} children={children ?? fallback} />
