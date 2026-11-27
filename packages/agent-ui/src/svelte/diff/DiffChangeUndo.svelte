<!-- Undoes the change. "Undo", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.ChangeUndo> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.ChangeUndo {...props} children={children ?? fallback} />
