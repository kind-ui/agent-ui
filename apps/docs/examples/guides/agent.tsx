"use client";
import { useChat } from "@ai-sdk/react";
import type { Part } from "@kind-ui/agent-ui";
import { fromUIMessages, toApprovalResponse } from "@kind-ui/agent-ui/adapters/ai-sdk";
import { lastAssistantMessageIsCompleteWithApprovalResponses } from "ai";
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
import { Message, MessageContent } from "@/components/ui/message";
import { Reasoning } from "@/components/ui/reasoning";
import { Tool } from "@/components/ui/tool";

export default function Chat() {
  const { messages, status, error, sendMessage, stop, addToolApprovalResponse } = useChat({
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithApprovalResponses,
  });
  const rendered = fromUIMessages(messages, { status, error });

  const renderPart = (part: Part) => {
    if (part.type === "text") {
      return <Markdown key={part.id} source={part.text} streaming={part.state === "streaming"} />;
    }
    if (part.type === "reasoning") {
      return (
        <Reasoning
          key={part.id}
          status={part.state === "streaming" ? "running" : "complete"}
          text={part.text}
        />
      );
    }
    if (part.type === "step" && part.step.kind === "tool") {
      const { call, error } = part.step;
      const approval = call.approval;
      return (
        <Tool
          key={part.id}
          call={call}
          error={error}
          onApprove={() =>
            approval && addToolApprovalResponse(toApprovalResponse(approval, { approved: true }))
          }
          onDeny={() =>
            approval && addToolApprovalResponse(toApprovalResponse(approval, { approved: false }))
          }
        />
      );
    }
    return null;
  };

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
                >
                  <MessageContent>{message.parts.map(renderPart)}</MessageContent>
                </Message>
              </ConversationRow>
            ))}
            <ConversationEmpty>
              <ConversationEmptyTitle>Ask the agent to clean up merged branches</ConversationEmptyTitle>
            </ConversationEmpty>
          </ConversationContent>
        </ConversationViewport>
        <ConversationJump />
      </Conversation>
      <Composer aria-label="Message" onSubmit={(draft) => sendMessage({ text: draft.text })} onStop={stop}>
        <ComposerInput aria-label="Prompt" placeholder="Clean up merged branches" />
        <ComposerSubmit />
        <ComposerStop />
      </Composer>
    </div>
  );
}
