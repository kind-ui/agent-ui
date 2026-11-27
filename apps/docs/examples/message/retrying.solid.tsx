import type { MessageStatus, RetryState } from "@kind-ui/agent-ui";
import { createEffect, createSignal } from "solid-js";
import { Message, MessageContent, MessageOutcome, MessageRetrying } from "@/components/ui/solid/message";

const text = "Retry with exponential backoff, and cap the number of attempts. The client should";
const first: RetryState = { attempt: 1, maxAttempts: 3, retryAfter: 4, reason: "Rate limited" };

export default function MessageRetryingExample() {
  const [status, setStatus] = createSignal<MessageStatus>("streaming");
  const [retry, setRetry] = createSignal<RetryState | undefined>(first);

  const next = () => {
    const current = retry();
    if (!current) return;
    if (current.attempt === current.maxAttempts) setStatus("error");
    else setRetry({ ...current, attempt: current.attempt + 1 });
  };
  // Each attempt fails here, once its countdown ends.
  createEffect(
    () => [status(), retry()] as const,
    ([current, attempt]) => {
      if (current !== "streaming" || !attempt) return;
      const timer = setTimeout(next, (attempt.retryAfter ?? 0) * 1000);
      return () => clearTimeout(timer);
    },
  );

  return (
    <div class="w-full max-w-xl">
      <Message
        aria-label="Assistant message"
        status={status()}
        text={text}
        retry={retry()}
        onRetryNow={next}
        onCancelRetry={() => {
          setRetry(undefined);
          setStatus("aborted");
        }}
        onRetry={() => {
          setRetry(first);
          setStatus("streaming");
        }}
      >
        <MessageContent>{text}</MessageContent>
        <MessageRetrying />
        <MessageOutcome />
      </Message>
    </div>
  );
}
