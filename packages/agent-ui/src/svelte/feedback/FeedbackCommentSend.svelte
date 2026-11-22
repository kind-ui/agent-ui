<!-- Sends the comment through `onComment`. Reads "Send" unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.CommentSend> = $props();
</script>

{#snippet fallback()}Send{/snippet}

<parts.CommentSend {...props} children={children ?? fallback} />
