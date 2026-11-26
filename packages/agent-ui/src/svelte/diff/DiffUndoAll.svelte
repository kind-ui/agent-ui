<!-- Asks before undoing every undecided file. "Undo all", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.UndoAll> = $props();
</script>

{#snippet fallback({ text }: { text: string })}{text}{/snippet}

<parts.UndoAll {...props} children={children ?? fallback} />
