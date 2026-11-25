import type { MessageStatus } from "@kind-ui/agent-ui";
import { createEffect, createSignal } from "solid-js";
import { Message, MessageContent, MessageRetrying } from "@/components/ui/solid/message";

const text = "Switching to the staging database before the";
const later = (seconds: number) => new Date(Date.now() + seconds * 1000).toISOString();

export default function MessageRetryingExample() {
  const [attempt, setAttempt] = createSignal(1);
  const [status, setStatus] = createSignal<MessageStatus>("streaming");
  const [retryAt, setRetryAt] = createSignal(later(5));

  // Each try fails until the third, which finishes the answer.
  createEffect(
    () => ({ attempt: attempt(), retryAt: retryAt(), status: status() }),
    (current) => {
      if (current.status !== "streaming") return;
      const timer = setTimeout(() => {
        if (current.attempt === 3) return setStatus("complete");
        setAttempt(current.attempt + 1);
        setRetryAt(later(5));
      }, Date.parse(current.retryAt) - Date.now());
      return () => clearTimeout(timer);
    },
  );

  return (
    <div class="flex w-full max-w-xl flex-col">
      <Message
        aria-label="Assistant message"
        messageRole="assistant"
        status={status()}
        text={text}
        retry={
          status() === "streaming"
            ? { attempt: attempt(), maxAttempts: 5, retryAt: retryAt(), reason: "Rate limited" }
            : undefined
        }
      >
        <MessageContent>{status() === "complete" ? `${text} migrations run.` : text}</MessageContent>
        <MessageRetrying />
      </Message>
    </div>
  );
}
