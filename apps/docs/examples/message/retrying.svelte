<script lang="ts">
  import type { MessageStatus, RetryState } from "@kind-ui/agent-ui";
  import {
    Message,
    MessageContent,
    MessageOutcome,
    MessageRetrying,
  } from "@/components/ui/svelte/message/index.js";

  const text = "Retry with exponential backoff, and cap the number of attempts. The client should";
  const first: RetryState = { attempt: 1, maxAttempts: 3, retryAfter: 4, reason: "Rate limited" };

  let status: MessageStatus = $state("streaming");
  let retry: RetryState | undefined = $state.raw(first);

  const next = () => {
    if (!retry) return;
    if (retry.attempt === retry.maxAttempts) status = "error";
    else retry = { ...retry, attempt: retry.attempt + 1 };
  };
  // Each attempt fails here, once its countdown ends.
  $effect(() => {
    if (status !== "streaming" || !retry) return;
    const timer = setTimeout(next, (retry.retryAfter ?? 0) * 1000);
    return () => clearTimeout(timer);
  });
</script>

<div class="w-full max-w-xl">
  <Message
    aria-label="Assistant message"
    {status}
    {text}
    {retry}
    onRetryNow={next}
    onCancelRetry={() => {
      retry = undefined;
      status = "aborted";
    }}
    onRetry={() => {
      retry = first;
      status = "streaming";
    }}
  >
    <MessageContent>{text}</MessageContent>
    <MessageRetrying />
    <MessageOutcome />
  </Message>
</div>
