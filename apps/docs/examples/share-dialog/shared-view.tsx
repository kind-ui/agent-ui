import {
  Conversation,
  ConversationContent,
  ConversationRow,
  ConversationViewport,
} from "@/components/ui/conversation";
import { Message, MessageContent } from "@/components/ui/message";
import { Notice } from "@/components/ui/notice";

const messages = [
  { id: "m1", role: "user", text: "The nightly export failed again. Can you take a look?" },
  {
    id: "m2",
    role: "assistant",
    text: "Every run since Wednesday stopped after 30 seconds waiting on the reports service, which got slower, not down.",
  },
  { id: "m3", role: "user", text: "So we just raise the timeout?" },
  {
    id: "m4",
    role: "assistant",
    text: "That gets tonight's run through. I'd also retry each page with backoff and alert when a run takes over an hour.",
  },
] as const;

export default function SharedViewExample() {
  return (
    <div className="flex w-full max-w-xl flex-col gap-3">
      <Notice
        label="This is a shared copy of a chat."
        actions={
          <button type="button" data-kind-button="" className="self-start">
            Continue this chat
          </button>
        }
      />
      <Conversation
        aria-label="Shared chat"
        messageCount={messages.length}
        className="h-72 rounded-xl border border-[var(--kind-color-border)]"
      >
        <ConversationViewport>
          <ConversationContent>
            {messages.map((message, index) => (
              <ConversationRow key={message.id} value={message.id} index={index}>
                <Message
                  aria-label={message.role === "user" ? "User message" : "Assistant message"}
                  messageRole={message.role}
                  text={message.text}
                >
                  <MessageContent>{message.text}</MessageContent>
                </Message>
              </ConversationRow>
            ))}
          </ConversationContent>
        </ConversationViewport>
      </Conversation>
    </div>
  );
}
