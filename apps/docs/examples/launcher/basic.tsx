"use client";
import { type CSSProperties, useState } from "react";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/composer";
import {
  Conversation,
  ConversationContent,
  ConversationRow,
  ConversationViewport,
} from "@/components/ui/conversation";
import { Launcher } from "@/components/ui/launcher";

const greeting = [{ id: "m1", role: "assistant", text: "Hi! Ask me anything about your billing exports." }];

export default function LauncherExample() {
  const [messages, setMessages] = useState(greeting);
  const [unread, setUnread] = useState(1);

  return (
    // A launcher sits in the page's corner. Here it sits in the preview's corner instead.
    <div className="relative h-[26rem] w-full">
      <Launcher
        label="Assistant"
        unread={unread}
        onOpenChange={(open) => open && setUnread(0)}
        style={
          {
            position: "absolute",
            "--kind-launcher-inset": "0px",
            "--kind-launcher-width": "20rem",
            "--kind-launcher-height": "20rem",
          } as CSSProperties
        }
      >
        <Conversation aria-label="Conversation" messageCount={messages.length} className="min-h-0 flex-1">
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
        </Conversation>
        <Composer
          aria-label="Message"
          onSubmit={({ text }) =>
            setMessages((current) => [...current, { id: `m${current.length + 1}`, role: "user", text }])
          }
        >
          <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
          <ComposerSubmit />
        </Composer>
      </Launcher>
    </div>
  );
}
