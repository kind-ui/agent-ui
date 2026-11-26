<script lang="ts">
  import type { MessageStatus } from "@kind-ui/agent-ui";
  import { Message, MessageContent, MessageRetrying } from "@/components/ui/svelte/message/index.js";

  const text = "Switching to the staging database before the";
  const later = (seconds: number) => new Date(Date.now() + seconds * 1000).toISOString();

  let attempt = $state(1);
  let status: MessageStatus = $state("streaming");
  let retryAt = $state(later(5));

  // Each try fails until the third, which finishes the answer.
  $effect(() => {
    if (status !== "streaming") return;
    const timer = setTimeout(
      () => {
        if (attempt === 3) {
          status = "complete";
          return;
        }
        attempt += 1;
        retryAt = later(5);
      },
      Date.parse(retryAt) - Date.now(),
    );
    return () => clearTimeout(timer);
  });
</script>

<div class="flex w-full max-w-xl flex-col">
  <Message
    aria-label="Assistant message"
    messageRole="assistant"
    {status}
    {text}
    retry={status === "streaming" ? { attempt, maxAttempts: 5, retryAt, reason: "Rate limited" } : undefined}
  >
    <MessageContent>{status === "complete" ? `${text} migrations run.` : text}</MessageContent>
    <MessageRetrying />
  </Message>
</div>
