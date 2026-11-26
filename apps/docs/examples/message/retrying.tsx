"use client";
import type { MessageStatus } from "@kind-ui/agent-ui";
import { useEffect, useState } from "react";
import { Message, MessageContent, MessageRetrying } from "@/components/ui/message";

const text = "Switching to the staging database before the";
const later = (seconds: number) => new Date(Date.now() + seconds * 1000).toISOString();

export default function MessageRetryingExample() {
  const [attempt, setAttempt] = useState(1);
  const [status, setStatus] = useState<MessageStatus>("streaming");
  const [retryAt, setRetryAt] = useState(() => later(5));

  // Each try fails until the third, which finishes the answer.
  useEffect(() => {
    if (status !== "streaming") return;
    const timer = setTimeout(() => {
      if (attempt === 3) return setStatus("complete");
      setAttempt(attempt + 1);
      setRetryAt(later(5));
    }, Date.parse(retryAt) - Date.now());
    return () => clearTimeout(timer);
  }, [attempt, retryAt, status]);

  return (
    <div className="flex w-full max-w-xl flex-col">
      <Message
        aria-label="Assistant message"
        messageRole="assistant"
        status={status}
        text={text}
        retry={
          status === "streaming" ? { attempt, maxAttempts: 5, retryAt, reason: "Rate limited" } : undefined
        }
      >
        <MessageContent>{status === "complete" ? `${text} migrations run.` : text}</MessageContent>
        <MessageRetrying />
      </Message>
    </div>
  );
}
