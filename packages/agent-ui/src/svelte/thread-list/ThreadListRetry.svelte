<!-- Calls `onLoadMore` again. Reads "Retry" unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Retry> = $props();
</script>

{#snippet fallback()}Retry{/snippet}

<parts.Retry {...props} children={children ?? fallback} />
