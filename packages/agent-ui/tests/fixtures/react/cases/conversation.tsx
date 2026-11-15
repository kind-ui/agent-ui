import { createConversationController } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationJump,
  ConversationRow,
  ConversationViewport,
} from "../../../../src/react/conversation.js";

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
    <ConversationRow key={key} value={m.id} index={index}>
      <Bubble message={m} />
    </ConversationRow>
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

export const cases = {
  chat: () => <Chat count={31} />,
  empty: () => <Chat count={0} />,
  virtual: () => <Chat count={1000} virtualize />,
};
