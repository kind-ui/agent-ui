import { type ConversationStatus, createConversationController } from "@kind-ui/agent-ui/core";
import { createMemo, createSignal, For, flush, onSettled, Show } from "solid-js";
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
} from "../../../../src/solid/conversation.js";
import { type ConversationStates, retryRecorder } from "../../shared/conversation.js";
import { expose } from "../../shared/expose.js";

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

function Bubble(props: { message: Message }) {
  // A streamed token gives the message a new object with the same id; the memo keeps the attribute from being written.
  const id = createMemo(() => props.message.id);
  return (
    <Show when={props.message.role === "user"} fallback={<p data-message={id()}>{props.message.text}</p>}>
      <p
        data-message={id()}
        class="ms-auto w-fit max-w-[80%] rounded-2xl bg-[var(--kind-color-hover)] px-3.5 py-2"
      >
        {props.message.text}
      </p>
    </Show>
  );
}

function Row(props: { message: Message; index: number }) {
  return (
    <ConversationRow value={props.message.id} index={props.index}>
      <Bubble message={props.message} />
    </ConversationRow>
  );
}

function Chat(props: { count: number; virtualize?: boolean }) {
  const [all, setAll] = createSignal(messages(0, props.count));
  const controller = createConversationController();
  onSettled(() => {
    let appended = props.count;
    let older = 0;
    expose({
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
  });
  return (
    <Conversation
      aria-label="Conversation"
      messageCount={all().length}
      virtualize={props.virtualize ?? false}
      rowKey={(index) => all()[index]?.id ?? String(index)}
      controller={controller}
      class="m-4 h-[28rem] w-[32rem] rounded-xl border border-[var(--kind-color-border)]"
    >
      <ConversationViewport>
        <ConversationContent>
          {props.virtualize
            ? (state) => (
                <For each={state.rows} keyed={(r) => r.index}>
                  {(r) => (
                    <Show when={all()[r().index]}>{(m) => <Row message={m()} index={r().index} />}</Show>
                  )}
                </For>
              )
            : [
                <For each={all()} keyed={(m) => m.id}>
                  {(m, i) => <Row message={m()} index={i()} />}
                </For>,
                <ConversationEmpty>No messages yet.</ConversationEmpty>,
              ]}
        </ConversationContent>
      </ConversationViewport>
      <ConversationJump />
    </Conversation>
  );
}

function Remount() {
  const [shown, setShown] = createSignal(true);
  onSettled(() =>
    expose({
      kindRemount: () => {
        setShown((current) => !current);
        flush();
      },
    }),
  );
  return (
    <Show when={shown()}>
      <Chat count={31} />
    </Show>
  );
}

function States(props: { initial: ConversationStatus; canRetry?: boolean }) {
  const [view, setView] = createSignal<{ status: ConversationStatus; count: number; error?: string }>({
    status: props.initial,
    count: 0,
  });
  const retry = retryRecorder();
  onSettled(() => {
    const states: ConversationStates = {
      set: (status, count = 0, error) => setView({ status, count, ...(error !== undefined && { error }) }),
      resolveRetry: retry.resolveRetry,
      rejectRetry: retry.rejectRetry,
      retries: retry.retries,
    };
    expose({ kindConversationStates: states });
  });
  return (
    <Conversation
      aria-label="Conversation"
      messageCount={view().count}
      status={view().status}
      error={view().error}
      onRetry={props.canRetry === false ? undefined : retry.onRetry}
      class="m-4 h-[28rem] w-[32rem] max-w-[calc(100%-2rem)] rounded-xl border border-[var(--kind-color-border)]"
    >
      <ConversationViewport>
        <ConversationContent>
          <For each={messages(0, view().count)} keyed={(m) => m.id}>
            {(m, i) => <Row message={m()} index={i()} />}
          </For>
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
  "error-plain": () => <States initial="error" canRetry={false} />,
  welcome: () => <States initial="ready" />,
};
