import { type ConversationStatus, createConversationController } from "@kind-ui/agent-ui/core";
import { memo, useEffect, useState } from "react";
import { flushSync } from "react-dom";
import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationEmptyDescription,
  ConversationEmptyTitle,
  ConversationError,
  ConversationJump,
  ConversationLoading,
  ConversationRow,
  ConversationSkeleton,
  ConversationViewport,
} from "../../../../src/react/conversation.js";
import { type ConversationStates, retryRecorder } from "../../shared/conversation.js";

type Message = { id: string; role: "user" | "assistant"; text: string };

const lines = [
  "How do I keep a chat scrolled to the newest reply?",
  "Follow the end while the reader is at the bottom, and let go the moment they scroll up. A jump control brings them back, with a count of what arrived while they were away.",
  "And long histories?",
  "Render only the rows in view and measure each one as it mounts, so the scrollbar stays steady.",
];

const message = (serial: number, prefix = "m"): Message => ({
  id: `${prefix}${serial}`,
  role: serial % 2 === 0 ? "user" : "assistant",
  text: lines[serial % lines.length] as string,
});
const messages = (from: number, count: number, prefix?: string) =>
  Array.from({ length: count }, (_, i) => message(from + i, prefix));

function Bubble({ message }: { message: Message }) {
  return message.role === "user" ? (
    <p
      data-message={message.id}
      className="ms-auto w-fit max-w-[80%] rounded-2xl bg-[var(--kind-color-hover)] px-3.5 py-2"
    >
      {message.text}
    </p>
  ) : (
    <p data-message={message.id}>{message.text}</p>
  );
}

const Row = memo(function Row({ message, index }: { message: Message; index: number }) {
  return (
    <ConversationRow value={message.id} index={index}>
      <Bubble message={message} />
    </ConversationRow>
  );
});

function Chat({ count, virtualize = false }: { count: number; virtualize?: boolean }) {
  const [all, setAll] = useState(() => messages(0, count));
  const [controller] = useState(createConversationController);
  useEffect(() => {
    let appended = count;
    let older = 0;
    Object.assign(window, {
      kindConversation: {
        append: (n = 1) => {
          const added = messages(appended, n);
          appended += n;
          setAll((list) => [...list, ...added]);
        },
        prepend: (n = 1) => {
          const added = messages(older, n, "o");
          older += n;
          controller.prepend();
          setAll((list) => [...added, ...list]);
        },
        stream: (chunk: string) =>
          setAll((list) => list.map((m, i) => (i === list.length - 1 ? { ...m, text: m.text + chunk } : m))),
        remove: (n = 1) => setAll((list) => list.slice(0, -n)),
      },
    });
  }, [count, controller]);
  const row = (m: Message, index: number, key: string | number = m.id) => (
    <Row key={key} message={m} index={index} />
  );
  return (
    <Conversation
      aria-label="Conversation"
      messageCount={all.length}
      virtualize={virtualize}
      rowKey={(index) => all[index]?.id ?? String(index)}
      controller={controller}
      className="m-4 h-[28rem] w-[32rem] rounded-xl border border-[var(--kind-color-border)]"
    >
      <ConversationViewport>
        <ConversationContent>
          {virtualize
            ? ({ rows }) =>
                rows.flatMap((r) => (all[r.index] ? [row(all[r.index] as Message, r.index, r.index)] : []))
            : [
                ...all.map((m, i) => row(m, i)),
                <ConversationEmpty key="empty">No messages yet.</ConversationEmpty>,
              ]}
        </ConversationContent>
      </ConversationViewport>
      <ConversationJump />
    </Conversation>
  );
}

function Remount() {
  const [shown, setShown] = useState(true);
  useEffect(() => {
    Object.assign(window, { kindRemount: () => flushSync(() => setShown((current) => !current)) });
  }, []);
  return shown ? <Chat count={31} /> : null;
}

function States({ initial }: { initial: ConversationStatus }) {
  const [view, setView] = useState<{ status: ConversationStatus; count: number; error?: string }>({
    status: initial,
    count: 0,
  });
  const [retry] = useState(retryRecorder);
  useEffect(() => {
    const states: ConversationStates = {
      set: (status, count = 0, error) => setView({ status, count, ...(error !== undefined && { error }) }),
      resolveRetry: retry.resolveRetry,
      rejectRetry: retry.rejectRetry,
      retries: retry.retries,
    };
    Object.assign(window, { kindConversationStates: states });
  }, [retry]);
  return (
    <Conversation
      aria-label="Conversation"
      messageCount={view.count}
      status={view.status}
      {...(view.error !== undefined && { error: view.error })}
      onRetry={retry.onRetry}
      className="m-4 h-[28rem] w-[32rem] max-w-[calc(100%-2rem)] rounded-xl border border-[var(--kind-color-border)]"
    >
      <ConversationViewport>
        <ConversationContent>
          {messages(0, view.count).map((m, i) => (
            <Row key={m.id} message={m} index={i} />
          ))}
          <ConversationSkeleton />
          <ConversationLoading />
          <ConversationError />
          <ConversationEmpty>
            <ConversationEmptyTitle>What can I help with?</ConversationEmptyTitle>
            <ConversationEmptyDescription>
              Ask about your code, your docs or your last deploy.
            </ConversationEmptyDescription>
          </ConversationEmpty>
        </ConversationContent>
      </ConversationViewport>
      <ConversationJump />
    </Conversation>
  );
}

export const cases = {
  chat: () => <Chat count={31} />,
  empty: () => <Chat count={0} />,
  "chat-10": () => <Chat count={10} />,
  "chat-500": () => <Chat count={500} />,
  virtual: () => <Chat count={1000} virtualize />,
  remount: () => <Remount />,
  loading: () => <States initial="loading" />,
  error: () => <States initial="error" />,
  welcome: () => <States initial="ready" />,
};
