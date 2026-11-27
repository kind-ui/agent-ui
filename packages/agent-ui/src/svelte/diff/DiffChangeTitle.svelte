<!-- The change's words, then its error, Undo, Keep and outcome, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import DiffChangeError from "./DiffChangeError.svelte";
  import DiffChangeKeep from "./DiffChangeKeep.svelte";
  import DiffChangeOutcome from "./DiffChangeOutcome.svelte";
  import DiffChangeUndo from "./DiffChangeUndo.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.ChangeTitle> = $props();
</script>

{#snippet fallback({ text }: { text: string })}<span data-diff-change-text="">{text}</span><DiffChangeError
  /><DiffChangeUndo /><DiffChangeKeep /><DiffChangeOutcome />{/snippet}

<parts.ChangeTitle {...props} children={children ?? fallback} />
