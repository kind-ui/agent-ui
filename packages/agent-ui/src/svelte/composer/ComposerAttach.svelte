<!-- Opens the file picker. -->
<script lang="ts">
  import { FileInputTrigger } from "@ui-sdk/svelte/file-input";
  import type { ComponentProps } from "svelte";

  let props: ComponentProps<typeof FileInputTrigger> = $props();
</script>

<FileInputTrigger aria-label="Attach files" {...props} />
