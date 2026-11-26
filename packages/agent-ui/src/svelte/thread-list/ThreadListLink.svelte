<!--
  A thread's link: its title, its status and unread marks, then its summary and progress under them, unless you pass
  children.
-->
<script lang="ts">
  import type {
    ThreadListDescriptionState,
    ThreadListLinkState,
    ThreadListProgressState,
  } from "@kind-ui/agent-ui/core";
  import { Progress, ProgressIndicator, ProgressTrack } from "@ui-sdk/svelte/progress";
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Link> = $props();
</script>

{#snippet description({ summary, progress }: ThreadListDescriptionState)}{#if summary}<span
      data-thread-list-summary="">{summary}</span
    >{/if}{#if progress}<span data-thread-list-progress-text="">{progress}</span>{/if}{/snippet}

<!-- Named only for UI SDK's check: the bar is hidden, and the description has its words. -->
{#snippet progressBar({ value }: ThreadListProgressState)}<Progress {value} aria-label="Progress"
    ><ProgressTrack><ProgressIndicator /></ProgressTrack></Progress
  >{/snippet}

{#snippet fallback({ value, title }: ThreadListLinkState)}<span data-thread-list-title="">{title}</span><parts.Status
    {value}
  /><parts.Unread {value} /><parts.Description {value} children={description} /><parts.Progress
    {value}
    children={progressBar}
  />{/snippet}

<parts.Link {...props} children={children ?? fallback} />
