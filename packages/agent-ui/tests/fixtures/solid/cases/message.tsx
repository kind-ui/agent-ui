import type { Message as MessageData, MessageStatus, RetryState } from "@kind-ui/agent-ui";
import type { MessageRegenerateDetails } from "@kind-ui/agent-ui/core";
import type { JSX } from "@solidjs/web";
import { createSignal, For, flush, onSettled } from "solid-js";
import {
  Conversation,
  ConversationContent,
  ConversationRow,
  ConversationViewport,
} from "../../../../src/solid/conversation.js";
import { KindAvatar, KindAvatarFallback } from "../../../../src/solid/internal/avatar.js";
import { KindMenuItem } from "../../../../src/solid/internal/menu.js";
import { KindToolbar, KindToolbarButton } from "../../../../src/solid/internal/toolbar.js";
import { Markdown } from "../../../../src/solid/markdown.js";
import {
  Message,
  MessageAuthor,
  MessageAvatar,
  MessageBranch,
  MessageBranchLabel,
  MessageBranchNext,
  MessageBranchPrevious,
  MessageContent,
  MessageCopy,
  MessageDelivery,
  MessageDuration,
  MessageEdit,
  MessageEditor,
  MessageHeader,
  MessageOutcome,
  MessageRegenerate,
  MessageRegenerateContent,
  MessageRetrying,
  MessageTime,
  MessageToolbar,
} from "../../../../src/solid/message.js";
import { expose } from "../../shared/expose.js";
import { answer } from "../../shared/markdown.js";
import {
  author,
  authored,
  delivered,
  outcomeError,
  outcomeText,
  regenerateOptions,
  retrying,
  timing,
} from "../../shared/message.js";

const replies = [
  "Retry with exponential backoff, and cap the number of attempts.",
  "Queue the request and retry it from a background job.",
  "Fail fast and let the caller decide whether to retry.",
];
const question = "How should the client handle a flaky upstream?";

const calls: string[] = [];
expose({ kindMessage: { calls } });

function Actions(props: { children?: JSX.Element }) {
  return (
    <KindToolbar aria-label="Message actions">
      <MessageCopy>
        <KindToolbarButton aria-label="Copy" />
      </MessageCopy>
      {props.children}
    </KindToolbar>
  );
}

const regenerateButton = (props: Record<string, unknown>) => (
  <KindToolbarButton aria-label="Regenerate" {...props} />
);

function Assistant(props: { callbacks: boolean }) {
  const [branch, setBranch] = createSignal(0);
  const text = () => replies[branch()] as string;
  const callbacks = {
    get branchIndex() {
      return branch();
    },
    branchCount: replies.length,
    onBranchChange: (index: number) => setBranch(index),
    onRegenerate: () => calls.push("regenerate"),
    onCopy: (value: string) => calls.push(`copy:${value}`),
  };
  return (
    <Message
      aria-label="Assistant message"
      messageRole="assistant"
      text={text()}
      {...(props.callbacks ? callbacks : {})}
    >
      <MessageAvatar>
        <KindAvatar>
          <KindAvatarFallback>AI</KindAvatarFallback>
        </KindAvatar>
      </MessageAvatar>
      <MessageContent>
        <Markdown source={text()} />
      </MessageContent>
      <MessageToolbar>
        <MessageBranch>
          <MessageBranchPrevious />
          <MessageBranchLabel />
          <MessageBranchNext />
        </MessageBranch>
        <Actions>
          <MessageRegenerate>{regenerateButton}</MessageRegenerate>
        </Actions>
      </MessageToolbar>
    </Message>
  );
}

function CustomRows() {
  return (
    <MessageRegenerateContent>
      {(state) => (
        <For each={state.options} keyed={(option) => option.id}>
          {(option) => (
            <KindMenuItem value={option().id} label={option().label}>
              {option().label.toUpperCase()}
            </KindMenuItem>
          )}
        </For>
      )}
    </MessageRegenerateContent>
  );
}

function WithOptions(props: { refusing?: boolean; custom?: boolean }) {
  const [status, setStatus] = createSignal<MessageStatus>("complete");
  onSettled(() =>
    expose({
      kindRegenerate: {
        status: (value: MessageStatus) => {
          setStatus(value);
          flush();
        },
      },
    }),
  );
  return (
    <Message
      aria-label="Assistant message"
      status={status()}
      text={replies[0]}
      regenerateOptions={regenerateOptions}
      onRegenerate={(_text: string, details: MessageRegenerateDetails) => {
        calls.push(`regenerate:${details.optionId ?? ""}:${details.reason}:${details.source}`);
        if (props.refusing) details.cancel();
      }}
    >
      <MessageContent>{replies[0]}</MessageContent>
      <MessageToolbar>
        <Actions>
          <MessageRegenerate menuContent={props.custom ? <CustomRows /> : undefined}>
            {regenerateButton}
          </MessageRegenerate>
        </Actions>
      </MessageToolbar>
    </Message>
  );
}

function User(props: { initial?: string }) {
  const [text, setText] = createSignal(props.initial ?? question);
  return (
    <Message
      aria-label="User message"
      messageRole="user"
      text={text()}
      onEdit={(next: string) => {
        calls.push(`edit:${next}`);
        setText(next);
      }}
    >
      <MessageContent>{text()}</MessageContent>
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
  const [reply, setReply] = createSignal<{ text: string; status: MessageStatus }>({
    text: "",
    status: "streaming",
  });
  onSettled(() =>
    expose({
      kindMessage: {
        calls,
        source: answer,
        append: (chunk: string) => {
          setReply((current) => ({ ...current, text: current.text + chunk }));
          flush();
        },
        finish: () => {
          setReply((current) => ({ ...current, status: "complete" }));
          flush();
        },
      },
    }),
  );
  return (
    <Conversation
      aria-label="Conversation"
      messageCount={2}
      class="m-4 h-[40rem] w-[44rem] rounded-xl border border-[var(--kind-color-border)]"
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
              status={reply().status}
              text={reply().text}
              onRegenerate={() => calls.push("regenerate")}
            >
              <MessageContent>
                <Markdown source={reply().text} streaming={reply().status === "streaming"} />
              </MessageContent>
              <MessageToolbar>
                <Actions>
                  <MessageRegenerate>{regenerateButton}</MessageRegenerate>
                </Actions>
              </MessageToolbar>
            </Message>
          </ConversationRow>
        </ConversationContent>
      </ConversationViewport>
    </Conversation>
  );
}

function Authored(props: { clock?: boolean }) {
  return (
    <div class="m-4 flex w-[36rem] flex-col gap-2">
      <For each={authored}>
        {(entry) => {
          const { id, text, ...rest } = entry;
          return (
            <Message
              id={id}
              aria-label={`Message ${id}`}
              text={text}
              author={author}
              timeZone={timing.timeZone}
              {...(props.clock ? {} : { now: timing.now })}
              {...rest}
            >
              <MessageAvatar />
              <MessageHeader>
                <MessageAuthor />
                <MessageTime />
                <MessageDuration />
              </MessageHeader>
              <MessageContent>{text}</MessageContent>
            </Message>
          );
        }}
      </For>
    </div>
  );
}

type Deferred = { resolve(): void; reject(): void };

function Outcomes() {
  const [statuses, setStatuses] = createSignal<Record<string, MessageStatus>>({
    stopped: "streaming",
    failed: "streaming",
    earlier: "error",
  });
  const deferred: Deferred[] = [];
  onSettled(() =>
    expose({
      kindOutcome: {
        calls,
        status: (id: string, value: MessageStatus) => {
          setStatuses((current) => ({ ...current, [id]: value }));
          flush();
        },
        settle: (ok: boolean) => deferred.shift()?.[ok ? "resolve" : "reject"](),
      },
    }),
  );
  const wait = (name: string) => (details: { reason: string; source: string }) => {
    calls.push(`${name}:${details.reason}:${details.source}`);
    return new Promise<void>((resolve, reject) => deferred.push({ resolve, reject }));
  };
  const rows = [
    { id: "stopped", label: "Stopped answer", props: { onContinue: wait("continue") } },
    { id: "failed", label: "Failed answer", props: { onRetry: wait("retry"), error: outcomeError } },
    { id: "earlier", label: "Earlier answer", props: { onRetry: wait("retry") } },
  ];
  return (
    <div class="m-4 flex w-[36rem] flex-col gap-6">
      <For each={rows}>
        {(row) => (
          <Message
            id={row.id}
            aria-label={row.label}
            status={statuses()[row.id]}
            text={outcomeText}
            {...row.props}
          >
            <MessageContent>{outcomeText}</MessageContent>
            <MessageOutcome />
          </Message>
        )}
      </For>
      <input aria-label="Reply" class="w-full" />
    </div>
  );
}

function Delivery() {
  const [deliveries, setDeliveries] = createSignal<Record<string, MessageData["delivery"]>>({
    steered: "steered",
    queued: "queued",
  });
  const [retry, setRetry] = createSignal<RetryState | undefined>(retrying);
  const [status, setStatus] = createSignal<MessageStatus>("streaming");
  const deferred: Deferred[] = [];
  onSettled(() =>
    expose({
      kindDelivery: {
        calls,
        deliver: (id: string, value: MessageData["delivery"] | null) => {
          setDeliveries((current) => ({ ...current, [id]: value ?? undefined }));
          flush();
        },
        retry: (value: RetryState | null) => {
          setRetry(() => value ?? undefined);
          flush();
        },
        status: (value: MessageStatus) => {
          setStatus(value);
          flush();
        },
        settle: (ok: boolean) => deferred.shift()?.[ok ? "resolve" : "reject"](),
      },
    }),
  );
  const withdraw = (details: { reason: string; source: string }) => {
    calls.push(`withdraw:${details.reason}:${details.source}`);
    return new Promise<void>((resolve, reject) => deferred.push({ resolve, reject }));
  };
  const rows = [
    { id: "steered", label: "Steered message", props: {} },
    { id: "queued", label: "Queued message", props: { onWithdraw: withdraw } },
  ] as const;
  return (
    <div class="m-4 flex w-[36rem] flex-col gap-6">
      <For each={rows}>
        {(row) => (
          <Message
            id={row.id}
            aria-label={row.label}
            messageRole="user"
            text={delivered[row.id]}
            delivery={deliveries()[row.id]}
            {...row.props}
          >
            <MessageHeader>
              <MessageDelivery />
            </MessageHeader>
            <MessageContent>{delivered[row.id]}</MessageContent>
          </Message>
        )}
      </For>
      <Message
        id="answer"
        aria-label="Retrying answer"
        status={status()}
        text={delivered.answer}
        retry={retry()}
        onRetry={() => calls.push("retry")}
      >
        <MessageContent>{delivered.answer}</MessageContent>
        <MessageRetrying />
        <MessageOutcome />
      </Message>
      <input aria-label="Reply" class="w-full" />
    </div>
  );
}

export const cases = {
  all: () => (
    <div class="m-4 flex w-[36rem] flex-col gap-6">
      <User />
      <Assistant callbacks />
    </div>
  ),
  "no-callbacks": () => (
    <div class="m-4 w-[36rem]">
      <Assistant callbacks={false} />
    </div>
  ),
  chat: () => <Chat />,
  options: () => (
    <div class="m-4 w-[36rem]">
      <WithOptions />
    </div>
  ),
  refusing: () => (
    <div class="m-4 w-[36rem]">
      <WithOptions refusing />
    </div>
  ),
  author: () => <Authored />,
  "author-clock": () => <Authored clock />,
  outcomes: () => <Outcomes />,
  delivery: () => <Delivery />,
  "custom-rows": () => (
    <div class="m-4 w-[36rem]">
      <WithOptions custom />
    </div>
  ),
};
