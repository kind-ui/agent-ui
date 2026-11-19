"use client";
import { useState } from "react";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/composer";
import { ConnectionStatus } from "@/components/ui/connection-status";
import {
  Conversation,
  ConversationContent,
  ConversationRow,
  ConversationViewport,
} from "@/components/ui/conversation";

type Connection = "online" | "reconnecting" | "offline";

const messages = [
  { id: "m1", role: "user", text: "Why did the deploy to staging stop halfway?" },
  {
    id: "m2",
    role: "assistant",
    text: "The migration step timed out waiting for a lock on the orders table. A long report query was holding it.",
  },
  { id: "m3", role: "user", text: "Can you rerun it once the query finishes?" },
];

const states: Connection[] = ["online", "reconnecting", "offline"];

const inFiveSeconds = () => new Date(Date.now() + 5000).toISOString();

export default function ConnectionStatusExample() {
  const [state, setState] = useState<Connection>("reconnecting");
  const [retryAt, setRetryAt] = useState(inFiveSeconds);

  const choose = (next: Connection) => {
    if (next === "reconnecting") setRetryAt(inFiveSeconds());
    setState(next);
  };
  const retry = () =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        setState("online");
        resolve();
      }, 800);
    });

  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <fieldset className="flex gap-1 self-start border-0 p-0 text-sm">
        <legend className="sr-only">Connection</legend>
        {states.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={state === option}
            onClick={() => choose(option)}
            className="w-28 rounded-md border border-[var(--kind-color-border)] py-1 capitalize aria-pressed:bg-[var(--kind-color-hover)]"
          >
            {option}
          </button>
        ))}
      </fieldset>
      <Conversation
        aria-label="Conversation"
        messageCount={messages.length}
        className="h-56 rounded-xl border border-[var(--kind-color-border)]"
      >
        <ConversationViewport>
          <ConversationContent>
            {messages.map((message, index) => (
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
        <ConnectionStatus state={state} retryAt={retryAt} onRetry={retry} />
      </Conversation>
      <Composer aria-label="Message" disabled={state === "offline"}>
        <ComposerInput aria-label="Prompt" placeholder={state === "offline" ? "Offline" : "Ask anything"} />
        <ComposerSubmit />
      </Composer>
    </div>
  );
}
