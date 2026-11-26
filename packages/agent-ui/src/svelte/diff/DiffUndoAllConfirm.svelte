<!-- Undoes every undecided file. "Undo all", unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.UndoAllConfirm> = $props();
</script>

{#snippet fallback({ text }: { text: string })}<span
    data-kind-pending-mark=""
    data-status-mark=""
    data-status="running"
    aria-hidden="true"
  ></span>{text}{/snippet}

<parts.UndoAllConfirm {...props} children={children ?? fallback} />
