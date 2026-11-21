<script lang="ts">
  import type { MessageStatus } from "@kind-ui/agent-ui";
  import { Message, MessageContent, MessageOutcome } from "@/components/ui/svelte/message/index.js";

  const wait = () => new Promise((resolve) => setTimeout(resolve, 800));

  let stopped: { status: MessageStatus; text: string } = $state({
    status: "aborted",
    text: "Start with the slowest query: it scans the whole orders table",
  });
  let failed: { status: MessageStatus; text: string } = $state({ status: "error", text: "" });
</script>

<div class="flex w-full max-w-xl flex-col gap-6">
  <Message
    aria-label="Assistant message"
    messageRole="assistant"
    status={stopped.status}
    text={stopped.text}
    onContinue={async () => {
      await wait();
      stopped = {
        status: "complete",
        text: `${stopped.text}, so an index on customer_id brings it under 10 ms.`,
      };
    }}
  >
    <MessageContent>{stopped.text}</MessageContent>
    <MessageOutcome />
  </Message>
  <Message
    aria-label="Assistant message"
    messageRole="assistant"
    status={failed.status}
    text={failed.text}
    error="The model is overloaded. Try again in a moment."
    onRetry={async () => {
      await wait();
      failed = { status: "complete", text: "Add the index, then run the query again to compare." };
    }}
  >
    <MessageContent>{failed.text}</MessageContent>
    <MessageOutcome />
  </Message>
</div>
