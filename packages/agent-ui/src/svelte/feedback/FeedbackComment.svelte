<!-- "Add a comment", unless you pass children. Opens the comment box. Rendered once there's a rating and `onComment`. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Comment> = $props();
</script>

{#snippet fallback()}Add a comment{/snippet}

<parts.Comment {...props} children={children ?? fallback} />
