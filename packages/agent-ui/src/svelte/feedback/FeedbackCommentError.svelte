<!-- "Comment not sent. Try again." after `onComment` rejects, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.CommentError> = $props();
</script>

{#snippet fallback()}Comment not sent. Try again.{/snippet}

<parts.CommentError {...props} children={children ?? fallback} />
