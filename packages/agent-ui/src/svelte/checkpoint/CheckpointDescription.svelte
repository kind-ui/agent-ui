<!-- The `description`, unless you pass children. Rendered only with one. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Description> = $props();
</script>

{#snippet fallback({ description }: { description: string })}{description}{/snippet}

<parts.Description {...props} children={children ?? fallback} />
