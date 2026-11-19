"use client";
import type { ConversationStatus } from "@kind-ui/agent-ui/core";
import { useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationError,
  ConversationLoading,
  ConversationRow,
  ConversationSkeleton,
  ConversationViewport,
} from "@/components/ui/conversation";

const messages = [
  { id: "m1", role: "user", text: "Why did last night's deploy roll back?" },
  {
    id: "m2",
    role: "assistant",
    text: "The health check on the new version timed out after 60 seconds, so the deploy rolled back on its own. The service took 75 seconds to warm its cache.",
  },
  { id: "m3", role: "user", text: "Can we raise the check's timeout?" },
  { id: "m4", role: "assistant", text: "Yes. I'd set it to 120 seconds and keep the retries at three." },
];

const statuses: ConversationStatus[] = ["loading", "error", "ready"];

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export default function ConversationStatesExample() {
  const [status, setStatus] = useState<ConversationStatus>("loading");
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <div className="flex gap-2">
        {statuses.map((value) => (
          <button
            key={value}
            type="button"
            aria-pressed={status === value}
            onClick={() => setStatus(value)}
            className="rounded-md border border-[var(--kind-color-border)] px-2.5 py-1 text-sm capitalize aria-pressed:bg-[var(--kind-color-hover)]"
          >
            {value}
          </button>
        ))}
      </div>
      <Conversation
        aria-label="Conversation"
        messageCount={messages.length}
        status={status}
        onRetry={async () => {
          await wait(600);
          setStatus("loading");
          await wait(1200);
          setStatus("ready");
        }}
        className="h-80 w-full rounded-xl border border-[var(--kind-color-border)]"
      >
        <ConversationViewport>
          <ConversationContent>
            <ConversationSkeleton />
            <ConversationLoading />
            <ConversationError />
            {status === "ready" &&
              messages.map((message, index) => (
                <ConversationRow key={message.id} value={message.id} index={index}>
                  <p
                    className={
                      message.role === "user"
                        ? "ms-auto w-fit max-w-[80%] rounded-2xl bg-[var(--kind-color-hover)] px-3.5 py-2"
                        : undefined
                    }
                  >
                    {message.text}
                  </p>
                </ConversationRow>
              ))}
          </ConversationContent>
        </ConversationViewport>
      </Conversation>
    </div>
  );
}
