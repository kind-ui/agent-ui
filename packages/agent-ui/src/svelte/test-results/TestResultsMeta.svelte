<!-- The run's duration, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Meta> = $props();
</script>

{#snippet fallback({ duration }: { duration: string })}{duration}{/snippet}

<parts.Meta {...props} children={children ?? fallback} />
