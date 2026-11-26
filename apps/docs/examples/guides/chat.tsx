"use client";
import { useChat } from "@ai-sdk/react";
import { fromUIMessages } from "@kind-ui/agent-ui/adapters/ai-sdk";
import { Composer, ComposerInput, ComposerStop, ComposerSubmit } from "@/components/ui/composer";
import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationEmptyTitle,
  ConversationJump,
  ConversationRow,
  ConversationViewport,
} from "@/components/ui/conversation";
import { Markdown } from "@/components/ui/markdown";
import { Message, MessageContent, MessageOutcome } from "@/components/ui/message";

export default function Chat() {
  const { messages, status, error, sendMessage, stop, regenerate } = useChat();
  const rendered = fromUIMessages(messages, { status, error });

  return (
    <div className="flex h-96 flex-col gap-3">
      <Conversation aria-label="Chat" messageCount={rendered.length} className="min-h-0 flex-1">
        <ConversationViewport>
          <ConversationContent>
            {rendered.map((message, index) => (
              <ConversationRow key={message.id} value={message.id} index={index}>
                <Message
                  aria-label={message.role === "user" ? "Your message" : "Assistant message"}
                  messageRole={message.role}
                  status={message.status}
                  error={message.error?.message}
                  onRetry={() => regenerate()}
                >
                  <MessageContent>
                    {message.parts.map((part) =>
                      part.type === "text" ? (
                        <Markdown key={part.id} source={part.text} streaming={part.state === "streaming"} />
                      ) : null,
                    )}
                  </MessageContent>
                  <MessageOutcome />
                </Message>
              </ConversationRow>
            ))}
            <ConversationEmpty>
              <ConversationEmptyTitle>Ask anything</ConversationEmptyTitle>
            </ConversationEmpty>
          </ConversationContent>
        </ConversationViewport>
        <ConversationJump />
      </Conversation>
      <Composer aria-label="Message" onSubmit={(draft) => sendMessage({ text: draft.text })} onStop={stop}>
        <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
        <ComposerSubmit />
        <ComposerStop />
      </Composer>
    </div>
  );
}
