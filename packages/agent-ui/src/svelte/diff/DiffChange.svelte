<!-- A change's header row, "Change 1 of 2 · line 19" with its Keep and Undo, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import DiffChangeTitle from "./DiffChangeTitle.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Change> = $props();
</script>

{#snippet fallback()}<DiffChangeTitle />{/snippet}

<parts.Change {...props} children={children ?? fallback} />
