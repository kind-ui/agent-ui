"use client";
import type { MessageStatus, RetryState } from "@kind-ui/agent-ui";
import { useEffect, useState } from "react";
import { Message, MessageContent, MessageOutcome, MessageRetrying } from "@/components/ui/message";

const text = "Retry with exponential backoff, and cap the number of attempts. The client should";
const first: RetryState = { attempt: 1, maxAttempts: 3, retryAfter: 4, reason: "Rate limited" };

export default function MessageRetryingExample() {
  const [status, setStatus] = useState<MessageStatus>("streaming");
  const [retry, setRetry] = useState<RetryState | undefined>(first);

  const next = (current: RetryState) => {
    if (current.attempt === current.maxAttempts) setStatus("error");
    else setRetry({ ...current, attempt: current.attempt + 1 });
  };
  // Each attempt fails here, once its countdown ends.
  useEffect(() => {
    if (status !== "streaming" || !retry) return;
    const timer = setTimeout(() => next(retry), (retry.retryAfter ?? 0) * 1000);
    return () => clearTimeout(timer);
  }, [status, retry]);

  return (
    <div className="w-full max-w-xl">
      <Message
        aria-label="Assistant message"
        status={status}
        text={text}
        retry={retry}
        onRetryNow={() => retry && next(retry)}
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
