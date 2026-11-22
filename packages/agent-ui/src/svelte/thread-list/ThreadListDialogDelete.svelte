<!-- Calls `onDelete`. Reads "Delete" unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.DialogDelete> = $props();
</script>

{#snippet fallback()}Delete{/snippet}

<parts.DialogDelete {...props} children={children ?? fallback} />
