<!--
  The line's code with its changed words marked, a hunk's header, or a collapsed run's `DiffCollapsed` and
  `DiffCollapsedText`, unless you pass children.
-->
<script lang="ts">
  import type { DiffPiece } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import DiffCollapsed from "./DiffCollapsed.svelte";
  import DiffCollapsedText from "./DiffCollapsedText.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Code> = $props();
</script>

{#snippet fallback({ kind, text, pieces }: { kind: string; text: string; pieces: readonly DiffPiece[] })}
  {#if kind === "collapsed"}<DiffCollapsed /><DiffCollapsedText />{:else if kind === "hunk"}{text}{:else}{#each pieces as piece}<svelte:element
        this={piece.changed ? "mark" : "span"}
        style:color={piece.color}
        data-italic={piece.fontStyle === "italic" ? "" : undefined}
        data-bold={piece.fontStyle === "bold" ? "" : undefined}>{piece.text}</svelte:element
      >{/each}{/if}
{/snippet}

<parts.Code {...props} children={children ?? fallback} />
