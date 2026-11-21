<!-- A running mark and "Sending" while `onComment` is pending, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.CommentStatus> = $props();
</script>

{#snippet fallback()}<parts.CommentStatusIcon />Sending{/snippet}

<parts.CommentStatus {...props} children={children ?? fallback} />
