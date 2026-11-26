<!-- Who did it, unless you pass children. Rendered only with an `actor`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Actor> = $props();
</script>

{#snippet fallback({ name }: { name: string })}{name}{/snippet}

<parts.Actor {...props} children={children ?? fallback} />
