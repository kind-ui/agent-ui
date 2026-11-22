<!--
  A UI SDK Progress of the items done, labeled "3 of 5 steps", unless you pass children. Not in the default parts,
  whose meta says the same.
-->
<script lang="ts">
  import { Progress, ProgressIndicator, ProgressLabel, ProgressTrack } from "@ui-sdk/svelte/progress";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children: content, ...props }: ComponentProps<typeof parts.Progress> = $props();
</script>

<parts.Progress {...props}
  >{#snippet children(state)}{#if content}{@render content(state)}{:else}<Progress value={state.value}
        ><ProgressLabel>{state.label}</ProgressLabel
        ><ProgressTrack
          ><ProgressIndicator
        /></ProgressTrack
      ></Progress
    >{/if}{/snippet}</parts.Progress>
