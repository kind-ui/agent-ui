<!-- "Thanks for your feedback", unless you pass children. Rendered while `commentSent` is set. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Thanks> = $props();
</script>

{#snippet fallback()}Thanks for your feedback{/snippet}

<parts.Thanks {...props} children={children ?? fallback} />
