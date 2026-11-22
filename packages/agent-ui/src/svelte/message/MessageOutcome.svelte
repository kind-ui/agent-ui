<!--
  Shown after the content once the response stopped or failed: its mark, its words, then Retry or Continue, unless
  you pass children.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import MessageContinue from "./MessageContinue.svelte";
  import MessageOutcomeText from "./MessageOutcomeText.svelte";
  import MessageRetry from "./MessageRetry.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Outcome> = $props();
</script>

{#snippet outcome()}
  <parts.OutcomeIcon
  /><MessageOutcomeText
  /><MessageRetry
  /><MessageContinue />
{/snippet}

<parts.Outcome {...props} children={children ?? outcome} />
