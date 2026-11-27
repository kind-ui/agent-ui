<!--
  Shown after the content while `retry` is set and the request hasn't failed: a running mark, the reason, the
  countdown and attempt, then Retry now and Cancel, unless you pass children.
-->
<script lang="ts">
  import type { ComponentProps } from "svelte";
  import MessageCancelRetry from "./MessageCancelRetry.svelte";
  import MessageRetryingReason from "./MessageRetryingReason.svelte";
  import MessageRetryingText from "./MessageRetryingText.svelte";
  import MessageRetryNow from "./MessageRetryNow.svelte";
  import { parts } from "./parts.js";

  let { children, ...props }: ComponentProps<typeof parts.Retrying> = $props();
</script>

{#snippet retrying()}
  <parts.RetryingIcon
  /><span><MessageRetryingReason /> <MessageRetryingText /></span
  ><MessageRetryNow
  /><MessageCancelRetry />
{/snippet}

<parts.Retrying {...props} children={children ?? retrying} />
