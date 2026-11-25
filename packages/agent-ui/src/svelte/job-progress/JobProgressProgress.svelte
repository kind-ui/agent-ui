<!--
  A UI SDK Progress of the `value`, labelled by the stage, unless you pass children. Indeterminate without one. Its
  track carries `data-agent-hidden`, which keeps the Progress out of the agent snapshot.
-->
<script lang="ts">
  import {
    Progress,
    ProgressIndicator,
    ProgressLabel,
    ProgressTrack,
    ProgressValue,
  } from "@ui-sdk/svelte/progress";
  import type { ComponentProps } from "svelte";
  import JobProgressStage from "./JobProgressStage.svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Progress> = $props();
</script>

<parts.Progress {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<Progress value={state.value}
        ><ProgressLabel
          ><JobProgressStage
        /></ProgressLabel
        ><ProgressValue
        /><ProgressTrack data-agent-hidden=""
          ><ProgressIndicator
        /></ProgressTrack
      ></Progress
    >{/if}{/snippet}</parts.Progress>
