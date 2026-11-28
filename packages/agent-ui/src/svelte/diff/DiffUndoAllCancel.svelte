<!-- "Cancel", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.UndoAllCancel> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.UndoAllCancel {...props} children={children ?? fallback} />
