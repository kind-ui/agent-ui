<!--
  A form whose content is a File Input drop zone: files attach by choosing, dropping, or pasting while focus is in it.
  Name it with `aria-label`.
-->
<script lang="ts">
  import type { ComposerRootState } from "@kind-ui/agent-ui/core";
  import { FileInput, FileInputDropzone } from "@ui-sdk/svelte/file-input";
  import type { ComponentProps, Snippet } from "svelte";
  import { parts } from "./parts.js";

  let {
    children: content,
    value = $bindable(),
    ...props
  }: ComponentProps<typeof parts.Root> & { children?: Snippet } = $props();
</script>

<parts.Root {...props} bind:value>
  {#snippet children({ fileInput })}
    <FileInput {...fileInput}>
      <FileInputDropzone>{@render content?.()}</FileInputDropzone>
    </FileInput>
  {/snippet}
</parts.Root>
