<!--
  A UI SDK Progress, read as a quiet corner label like "Creating image · 42%" until the image loads, unless you pass
  children.
-->
<script lang="ts">
  import type { GeneratedImageProgressState } from "@kind-ui/agent-ui/core";
  import {
    Progress,
    ProgressIndicator,
    ProgressLabel,
    ProgressTrack,
    ProgressValue,
  } from "@ui-sdk/svelte/progress";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Progress> = $props();
</script>

{#snippet fallback({ value, label }: GeneratedImageProgressState)}
  <Progress {value}
    ><ProgressLabel>{label}</ProgressLabel><ProgressValue /><ProgressTrack><ProgressIndicator /></ProgressTrack
    ></Progress>
{/snippet}

<parts.Progress {...props} children={children ?? fallback} />
