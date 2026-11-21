<!-- One upload: the file's name and progress bar, what it's doing, and its action. -->
<script lang="ts">
  import type { UploadItemState } from "@kind-ui/agent-ui/core";
  import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack } from "@ui-sdk/svelte/progress";
  import type { ComponentProps } from "svelte";
  import { parts } from "./index.js";

  let props: ComponentProps<typeof parts.Item> & { children?: never } = $props();
</script>

<parts.Item {...props}>
  {#snippet children({ item, detail }: UploadItemState)}
    <span data-icon=""></span>
    <Progress value={item?.progress ?? null}>
      <ProgressLabel>{item?.name}</ProgressLabel>
      <ProgressTrack>
        <ProgressIndicator />
      </ProgressTrack>
    </Progress>
    <span data-detail="">{detail}</span>
    <parts.Action value={props.value} />
  {/snippet}
</parts.Item>
