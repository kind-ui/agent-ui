<!--
  The line's code, in `ins` or `del` with its changed words marked and hidden words for screen readers, or a collapsed
  run's `DiffCollapsed` and `DiffCollapsedText`, unless you pass children.
-->
<script lang="ts">
  import type { DiffLineView, DiffPiece } from "@kind-ui/agent-ui/core";
  import type { ComponentProps } from "svelte";
  import DiffCollapsed from "./DiffCollapsed.svelte";
  import DiffCollapsedText from "./DiffCollapsedText.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Code> = $props();
</script>

{#snippet run(pieces: readonly DiffPiece[])}{#each pieces as piece}<span
      style:color={piece.color}
      data-diff-changed={piece.changed ? "" : undefined}
      data-italic={piece.fontStyle === "italic" ? "" : undefined}
      data-bold={piece.fontStyle === "bold" ? "" : undefined}>{piece.text}</span
    >{/each}{/snippet}

{#snippet fallback({ line }: { line: DiffLineView | undefined })}{#if line?.kind === "collapsed"}<DiffCollapsed
    /><DiffCollapsedText />{:else if line}{#if line.prefix}<span data-diff-hidden="">{`${line.prefix} `}</span
      >{/if}{#if line.kind === "add"}<ins>{@render run(line.pieces)}</ins>{:else if line.kind === "remove"}<del
        >{@render run(line.pieces)}</del
      >{:else}{@render run(line.pieces)}{/if}{/if}{/snippet}

<parts.Code {...props} children={children ?? fallback} />
