<!-- Calls `onNew`. Reads "New chat" unless you pass children. Rendered only while `onNew` is set. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.New> = $props();
</script>

{#snippet fallback()}<span data-thread-list-icon="new" aria-hidden="true"></span>New chat{/snippet}

<parts.New {...props} children={children ?? fallback} />
