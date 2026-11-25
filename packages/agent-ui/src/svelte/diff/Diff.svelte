<!--
  One file's change as a unified diff: its path, what changed in words, Copy, Accept and Revert, then its lines with
  old and new numbers, changed words marked and long unchanged runs folded away. Any `children` replace the default
  parts.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import DiffAccept from "./DiffAccept.svelte";
  import DiffPath from "./DiffPath.svelte";
  import DiffRevert from "./DiffRevert.svelte";
  import DiffStats from "./DiffStats.svelte";
  import DiffStatus from "./DiffStatus.svelte";
  import DiffTable from "./DiffTable.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet fallback()}<parts.Header
    ><DiffPath /><DiffStatus /><DiffStats /><parts.Copy /><DiffRevert /><DiffAccept /></parts.Header
  ><parts.Viewport><DiffTable /></parts.Viewport>{/snippet}

<parts.Root {...props} children={children ?? fallback} />
