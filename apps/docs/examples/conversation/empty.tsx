"use client";
import { useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationEmptyDescription,
  ConversationEmptyTitle,
  ConversationViewport,
} from "@/components/ui/conversation";
import { Suggestion } from "@/components/ui/suggestion";

const suggestions = [
  { id: "summarize", label: "Summarize this repository" },
  { id: "issues", label: "Find good first issues" },
  { id: "tests", label: "Explain the failing test" },
];

export default function ConversationEmptyExample() {
  const [prompt, setPrompt] = useState<string>();
  return (
    <Conversation
      aria-label="Conversation"
      messageCount={0}
      className="h-80 w-full max-w-xl rounded-xl border border-[var(--kind-color-border)]"
    >
      <ConversationViewport>
        <ConversationContent>
          <ConversationEmpty>
            <ConversationEmptyTitle>What can I help with?</ConversationEmptyTitle>
            <ConversationEmptyDescription>
              {prompt ? `Sent: ${prompt}` : "Ask about this repository, or start from a suggestion."}
            </ConversationEmptyDescription>
            <Suggestion
              suggestions={suggestions}
              onPick={(id) => setPrompt(suggestions.find((suggestion) => suggestion.id === id)?.label)}
            />
          </ConversationEmpty>
        </ConversationContent>
      </ConversationViewport>
    </Conversation>
  );
}
