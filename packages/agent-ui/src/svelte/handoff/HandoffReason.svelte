<!-- The `reason`, unless you pass children. Present only with one. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Reason> = $props();
</script>

{#snippet fallback({ reason }: { reason: string })}{reason}{/snippet}

<parts.Reason {...props} children={children ?? fallback} />
