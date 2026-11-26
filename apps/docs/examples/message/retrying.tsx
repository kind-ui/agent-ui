"use client";
import type { MessageStatus, RetryState } from "@kind-ui/agent-ui";
import { useEffect, useState } from "react";
import { Message, MessageContent, MessageOutcome, MessageRetrying } from "@/components/ui/message";

const text = "Retry with exponential backoff, and cap the number of attempts. The client should";
const first: RetryState = { attempt: 1, maxAttempts: 3, retryAfter: 4, reason: "Rate limited" };

export default function MessageRetryingExample() {
  const [status, setStatus] = useState<MessageStatus>("streaming");
  const [retry, setRetry] = useState<RetryState | undefined>(first);

  const next = () => {
    if (!retry) return;
    if (retry.attempt === retry.maxAttempts) setStatus("error");
    else setRetry({ ...retry, attempt: retry.attempt + 1 });
  };
  // Each attempt fails here, once its countdown ends.
  useEffect(() => {
    if (status !== "streaming" || !retry) return;
    const timer = setTimeout(next, (retry.retryAfter ?? 0) * 1000);
    return () => clearTimeout(timer);
  });

  return (
    <div className="w-full max-w-xl">
      <Message
        aria-label="Assistant message"
        status={status}
        text={text}
        retry={retry}
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
