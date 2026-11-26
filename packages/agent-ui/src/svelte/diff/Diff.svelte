<!--
  One file's changes, or a run's: a summary with Keep all and Undo all, then each file's row with its own Keep and
  Undo, opening to its lines. Any `children` replace the default parts.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import DiffKeepAll from "./DiffKeepAll.svelte";
  import DiffList from "./DiffList.svelte";
  import DiffSummaryCounts from "./DiffSummaryCounts.svelte";
  import DiffSummaryError from "./DiffSummaryError.svelte";
  import DiffSummaryOutcome from "./DiffSummaryOutcome.svelte";
  import DiffSummaryProgress from "./DiffSummaryProgress.svelte";
  import DiffSummaryTitle from "./DiffSummaryTitle.svelte";
  import DiffUndoAll from "./DiffUndoAll.svelte";
  import DiffUndoAllCancel from "./DiffUndoAllCancel.svelte";
  import DiffUndoAllConfirm from "./DiffUndoAllConfirm.svelte";
  import DiffUndoAllQuestion from "./DiffUndoAllQuestion.svelte";
  import { parts } from "./parts.js";

  let { children, open = $bindable(), ...props }: ComponentProps<typeof parts.Root> = $props();
</script>

{#snippet fallback()}<parts.Summary
    ><div data-diff-heading=""
      ><DiffSummaryTitle /><DiffSummaryCounts /><DiffSummaryProgress /><DiffSummaryOutcome /></div
    ><parts.SummaryMark /><parts.SummaryActions
      ><DiffUndoAllQuestion /><DiffUndoAll /><DiffKeepAll /><DiffUndoAllCancel /><DiffUndoAllConfirm
      /></parts.SummaryActions
    ><DiffSummaryError /></parts.Summary
  ><DiffList />{/snippet}

<parts.Root {...props} bind:open children={children ?? fallback} />
