<!-- "Undo all 4 files? This can't be undone.", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.UndoAllQuestion> = $props();
</script>

{#snippet fallback({ text, warning }: { text: string; warning: string })}{text}{" "}<span data-diff-warning=""
    >{warning}</span
  >{/snippet}

<parts.UndoAllQuestion {...props} children={children ?? fallback} />
