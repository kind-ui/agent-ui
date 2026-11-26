<!-- The file whose path is `value`: its row and its lines, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import DiffFileCounts from "./DiffFileCounts.svelte";
  import DiffFileError from "./DiffFileError.svelte";
  import DiffFileKeep from "./DiffFileKeep.svelte";
  import DiffFileNote from "./DiffFileNote.svelte";
  import DiffFileOldPath from "./DiffFileOldPath.svelte";
  import DiffFileOutcome from "./DiffFileOutcome.svelte";
  import DiffFilePath from "./DiffFilePath.svelte";
  import DiffFileStatus from "./DiffFileStatus.svelte";
  import DiffFileUndo from "./DiffFileUndo.svelte";
  import DiffShowAll from "./DiffShowAll.svelte";
  import DiffTable from "./DiffTable.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.File> = $props();
</script>

{#snippet fallback()}<parts.FileTrigger
    ><span data-diff-name=""><DiffFilePath /><DiffFileOldPath /></span><DiffFileStatus /><DiffFileCounts
    /><parts.FileMark /></parts.FileTrigger
  ><parts.FileActions><DiffFileError /><DiffFileUndo /><DiffFileKeep /><DiffFileOutcome /></parts.FileActions
  ><parts.FileContent
    ><DiffFileNote /><parts.Viewport><DiffTable /><DiffShowAll /></parts.Viewport></parts.FileContent
  >{/snippet}

<parts.File {...props} children={children ?? fallback} />
