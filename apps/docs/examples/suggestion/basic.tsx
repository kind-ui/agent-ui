"use client";
import { useState } from "react";
import { Suggestion } from "@/components/ui/suggestion";

const suggestions = [
  { id: "summarize", label: "Summarize this thread" },
  { id: "reply", label: "Draft a reply", description: "Short and friendly" },
  { id: "questions", label: "List the open questions" },
  { id: "issues", label: "Find related issues" },
  { id: "tests", label: "Suggest a test plan" },
];

export default function SuggestionExample() {
  const [prompt, setPrompt] = useState<string>();
  return (
    <div className="flex w-full max-w-md flex-col gap-3">
      <Suggestion
        suggestions={suggestions}
        onPick={(id) => setPrompt(suggestions.find((suggestion) => suggestion.id === id)?.label)}
      />
      <p className="text-sm text-[var(--kind-color-muted)]">
        {prompt ? `Sent: ${prompt}` : "Nothing sent yet."}
      </p>
    </div>
  );
}
