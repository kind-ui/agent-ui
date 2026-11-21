<!-- "Add a comment", unless you pass children. Names the comment box; the styles keep it for assistive technology only. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Title> = $props();
</script>

{#snippet fallback()}Add a comment{/snippet}

<parts.Title {...props} children={children ?? fallback} />
