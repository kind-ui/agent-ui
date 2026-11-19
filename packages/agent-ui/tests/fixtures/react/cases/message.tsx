import type { MessageStatus } from "@kind-ui/agent-ui";
import type { MessageRegenerateDetails } from "@kind-ui/agent-ui/core";
import { type ReactNode, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import {
  Conversation,
  ConversationContent,
  ConversationRow,
  ConversationViewport,
} from "../../../../src/react/conversation.js";
import { KindAvatar, KindAvatarFallback } from "../../../../src/react/internal/avatar.js";
import { KindMenuItem } from "../../../../src/react/internal/menu.js";
import { KindToolbar, KindToolbarButton } from "../../../../src/react/internal/toolbar.js";
import { Markdown } from "../../../../src/react/markdown.js";
import {
  Message,
  MessageAvatar,
  MessageBranch,
  MessageBranchLabel,
  MessageBranchNext,
  MessageBranchPrevious,
  MessageContent,
  MessageCopy,
  MessageEdit,
  MessageEditor,
  MessageRegenerate,
  MessageRegenerateContent,
  MessageToolbar,
} from "../../../../src/react/message.js";
import { answer } from "../../shared/markdown.js";
import { regenerateOptions } from "../../shared/message.js";

const replies = [
  "Retry with exponential backoff, and cap the number of attempts.",
  "Queue the request and retry it from a background job.",
  "Fail fast and let the caller decide whether to retry.",
];
const question = "How should the client handle a flaky upstream?";

const calls: string[] = [];
Object.assign(window, { kindMessage: { calls } });

function Actions({ children }: { children?: ReactNode }) {
  return (
    <KindToolbar aria-label="Message actions">
      <MessageCopy>
        <KindToolbarButton aria-label="Copy" />
      </MessageCopy>
      {children}
    </KindToolbar>
  );
}

function Assistant({ callbacks }: { callbacks: boolean }) {
  const [branch, setBranch] = useState(0);
  const text = replies[branch] as string;
  return (
    <Message
      aria-label="Assistant message"
      messageRole="assistant"
      text={text}
      {...(callbacks
        ? {
            branchIndex: branch,
            branchCount: replies.length,
            onBranchChange: (index: number) => setBranch(index),
            onRegenerate: () => calls.push("regenerate"),
            onCopy: (value: string) => calls.push(`copy:${value}`),
          }
        : {})}
    >
      <MessageAvatar>
        <KindAvatar>
          <KindAvatarFallback>AI</KindAvatarFallback>
        </KindAvatar>
      </MessageAvatar>
      <MessageContent>
        <Markdown source={text} />
      </MessageContent>
      <MessageToolbar>
        <MessageBranch>
          <MessageBranchPrevious />
          <MessageBranchLabel />
          <MessageBranchNext />
        </MessageBranch>
        <Actions>
          <MessageRegenerate>
            <KindToolbarButton aria-label="Regenerate" />
          </MessageRegenerate>
        </Actions>
      </MessageToolbar>
    </Message>
  );
}

const customRows = (
  <MessageRegenerateContent>
    {({ options }) =>
      options.map((option) => (
        <KindMenuItem key={option.id} value={option.id} label={option.label}>
          {option.label.toUpperCase()}
        </KindMenuItem>
      ))
    }
  </MessageRegenerateContent>
);

function WithOptions({ refusing, custom }: { refusing?: boolean; custom?: boolean }) {
  const [status, setStatus] = useState<MessageStatus>("complete");
  useEffect(() => {
    Object.assign(window, {
      kindRegenerate: { status: (value: MessageStatus) => flushSync(() => setStatus(value)) },
    });
  }, []);
  return (
    <Message
      aria-label="Assistant message"
      status={status}
      text={replies[0]}
      regenerateOptions={regenerateOptions}
      onRegenerate={(_text: string, details: MessageRegenerateDetails) => {
        calls.push(`regenerate:${details.optionId ?? ""}:${details.reason}:${details.source}`);
        if (refusing) details.cancel();
      }}
    >
      <MessageContent>{replies[0]}</MessageContent>
      <MessageToolbar>
        <Actions>
          <MessageRegenerate {...(custom ? { menuContent: customRows } : {})}>
            <KindToolbarButton aria-label="Regenerate" />
          </MessageRegenerate>
        </Actions>
      </MessageToolbar>
    </Message>
  );
}

function User({ initial = question }: { initial?: string }) {
  const [text, setText] = useState(initial);
  return (
    <Message
      aria-label="User message"
      messageRole="user"
      text={text}
      onEdit={(next: string) => {
        calls.push(`edit:${next}`);
        setText(next);
      }}
    >
      <MessageContent>{text}</MessageContent>
      <MessageEditor />
      <MessageToolbar>
        <Actions>
          <MessageEdit>
            <KindToolbarButton aria-label="Edit" />
          </MessageEdit>
        </Actions>
      </MessageToolbar>
    </Message>
  );
}

function Chat() {
  const [reply, setReply] = useState<{ text: string; status: MessageStatus }>({
    text: "",
    status: "streaming",
  });
  useEffect(() => {
    Object.assign(window, {
      kindMessage: {
        calls,
        source: answer,
        append: (chunk: string) =>
          flushSync(() => setReply((current) => ({ ...current, text: current.text + chunk }))),
        finish: () => flushSync(() => setReply((current) => ({ ...current, status: "complete" }))),
      },
    });
  }, []);
  return (
    <Conversation
      aria-label="Conversation"
      messageCount={2}
      className="m-4 h-[40rem] w-[44rem] rounded-xl border border-[var(--kind-color-border)]"
    >
      <ConversationViewport>
        <ConversationContent>
          <ConversationRow value="q" index={0}>
            <User />
          </ConversationRow>
          <ConversationRow value="a" index={1}>
            <Message
              aria-label="Assistant message"
              messageRole="assistant"
              status={reply.status}
              text={reply.text}
              onRegenerate={() => calls.push("regenerate")}
            >
              <MessageContent>
                <Markdown source={reply.text} streaming={reply.status === "streaming"} />
              </MessageContent>
              <MessageToolbar>
                <Actions>
                  <MessageRegenerate>
                    <KindToolbarButton aria-label="Regenerate" />
                  </MessageRegenerate>
                </Actions>
              </MessageToolbar>
            </Message>
          </ConversationRow>
        </ConversationContent>
      </ConversationViewport>
    </Conversation>
  );
}

export const cases = {
  all: () => (
    <div className="m-4 flex w-[36rem] flex-col gap-6">
      <User />
      <Assistant callbacks />
    </div>
  ),
  "no-callbacks": () => (
    <div className="m-4 w-[36rem]">
      <Assistant callbacks={false} />
    </div>
  ),
  chat: () => <Chat />,
  options: () => (
    <div className="m-4 w-[36rem]">
      <WithOptions />
    </div>
  ),
  refusing: () => (
    <div className="m-4 w-[36rem]">
      <WithOptions refusing />
    </div>
  ),
  "custom-rows": () => (
    <div className="m-4 w-[36rem]">
      <WithOptions custom />
    </div>
  ),
};
