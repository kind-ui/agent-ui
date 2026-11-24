"use client";

import { useChat } from "@ai-sdk/react";
import { useState } from "react";
import { Step, StepContent, StepIcon, StepTitle, StepTrigger } from "@/components/ui/step";
import { createMockTransport } from "./mock";

// A test-only block: one Step that says hello through the mock transport.
export function Hello() {
  const [transport] = useState(() => createMockTransport());
  const { messages, sendMessage, status } = useChat({ transport });
  const reply = messages
    .filter((message) => message.role === "assistant")
    .flatMap((message) => message.parts)
    .map((part) => (part.type === "text" ? part.text : ""))
    .join("");
  const running = status === "submitted" || status === "streaming";
  return (
    <main className="mx-auto flex h-dvh max-w-lg flex-col justify-center gap-3 p-6">
      <Step status={running ? "running" : reply ? "complete" : "pending"} defaultOpen>
        <StepTrigger>
          <StepIcon />
          <StepTitle>Hello</StepTitle>
        </StepTrigger>
        <StepContent>
          <p>{reply || "Nothing yet."}</p>
        </StepContent>
      </Step>
      <button type="button" data-kind-button="" onClick={() => sendMessage({ text: "Hello" })}>
        Say hello
      </button>
    </main>
  );
}
