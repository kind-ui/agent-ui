<!-- The segment whose id is `value`: its speaker, its time, and its text, unless you pass children. -->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import { parts } from "./parts.js";
  import TranscriptSpeaker from "./TranscriptSpeaker.svelte";
  import TranscriptText from "./TranscriptText.svelte";
  import TranscriptTime from "./TranscriptTime.svelte";

  let { children, ...props }: ComponentProps<typeof parts.Segment> = $props();
</script>

{#snippet fallback({ canSeek }: { canSeek: boolean })}<div data-transcript-header=""
    ><TranscriptSpeaker />{#if canSeek}<parts.Seek><TranscriptTime /></parts.Seek>{:else}<TranscriptTime
      />{/if}</div
  ><TranscriptText />{/snippet}

<parts.Segment {...props} children={children ?? fallback} />
