<!--
  A File Input drop zone with a Browse button, then a row per item with its progress, and Cancel or Retry when the
  host offers them. Name it with `aria-label`.
-->
<script lang="ts">
  import type { UploaderListState, UploaderRootState } from "@kind-ui/agent-ui/core";
  import { FileInput, FileInputDropzone, FileInputTrigger } from "@ui-sdk/svelte/file-input";
  import type { ComponentProps } from "svelte";
  import { parts, UploaderItem } from "./index.js";

  let props: ComponentProps<typeof parts.Root> & { children?: never } = $props();
</script>

<parts.Root {...props}>
  {#snippet children({ fileInput }: UploaderRootState)}
    <FileInput {...fileInput}>
      <FileInputDropzone>
        <span data-upload-icon=""></span>
        <span data-hint="">Drop files here, or</span>
        <FileInputTrigger>browse</FileInputTrigger>
      </FileInputDropzone>
    </FileInput>
    <parts.List>
      {#snippet children({ rows }: UploaderListState)}
        {#each rows as row (row.item.id)}<UploaderItem value={row.item.id} />{/each}
      {/snippet}
    </parts.List>
  {/snippet}
</parts.Root>
