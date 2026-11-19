"use client";
import { useState } from "react";
import { KindToolbar, KindToolbarButton } from "@/components/ui/internal/toolbar";
import {
  Message,
  MessageContent,
  MessageCopy,
  MessageRegenerate,
  MessageToolbar,
} from "@/components/ui/message";

const reply = "Retry with exponential backoff, and cap the number of attempts.";

const regenerateOptions = [
  { id: "details", label: "Add details" },
  { id: "concise", label: "More concise", description: "Keep it to one sentence" },
  {
    id: "model",
    label: "Try with another model",
    items: [
      { id: "model-fast", label: "Fast model" },
      { id: "model-deep", label: "Deep model" },
    ],
  },
];

export default function MessageRegenerateOptionsExample() {
  const [chosen, setChosen] = useState("Nothing yet");

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <Message
        aria-label="Assistant message"
        messageRole="assistant"
        text={reply}
        regenerateOptions={regenerateOptions}
        onRegenerate={(_text, { optionId }) => setChosen(optionId ?? "Try again")}
      >
        <MessageContent>{reply}</MessageContent>
        <MessageToolbar>
          <KindToolbar aria-label="Message actions">
            <MessageCopy>
              <KindToolbarButton aria-label="Copy" />
            </MessageCopy>
            <MessageRegenerate>
              <KindToolbarButton aria-label="Regenerate" />
            </MessageRegenerate>
          </KindToolbar>
        </MessageToolbar>
      </Message>
      <p className="text-sm text-[var(--kind-color-muted)]">Last regenerated with: {chosen}</p>
    </div>
  );
}
