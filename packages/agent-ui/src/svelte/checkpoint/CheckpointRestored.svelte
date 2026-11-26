<!--
  "Restored code and conversation" with a check and what it brought back, in Restore's place once the host restores
  the checkpoint, unless you pass children.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Restored> = $props();
</script>

{#snippet fallback({ outcome, meta }: { outcome: string; meta: string })}<span
    aria-hidden="true"
    data-status-mark=""
    data-status="complete"
  ></span>{outcome}{#if meta}<span data-checkpoint-outcome-meta="">{meta}</span>{/if}{/snippet}

<parts.Restored {...props} children={children ?? fallback} />
