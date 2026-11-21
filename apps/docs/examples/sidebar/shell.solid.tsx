import type { MessageAuthor, Thread } from "@kind-ui/agent-ui";
import { createConversationController, dayKey, isContinuation } from "@kind-ui/agent-ui/core";
import { createMemo, createSignal, For, onSettled, Show } from "solid-js";
import { ConnectionStatus } from "@/components/ui/solid/connection-status";
import {
  Conversation,
  ConversationContent,
  ConversationEmpty,
  ConversationEmptyDescription,
  ConversationEmptyTitle,
  ConversationJump,
  ConversationMarks,
  ConversationRow,
  ConversationViewport,
} from "@/components/ui/solid/conversation";
import { ConversationSearch } from "@/components/ui/solid/conversation-search";
import { DaySeparator } from "@/components/ui/solid/day-separator";
import { Markdown } from "@/components/ui/solid/markdown";
import {
  Message,
  MessageAuthor as MessageAuthorName,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageTime,
} from "@/components/ui/solid/message";
import {
  Sidebar,
  SidebarHandle,
  SidebarInset,
  SidebarPanel,
  SidebarTrigger,
} from "@/components/ui/solid/sidebar";
import { ThreadList } from "@/components/ui/solid/thread-list";
import { ThreadSearch } from "@/components/ui/solid/thread-search";
import FullComposer from "../composer/full.solid";

const now = "2026-11-18T12:00:00Z";
const timeZone = "UTC";

type Line = {
  id: string;
  role: "user" | "assistant";
  text: string;
  createdAt: string;
  author?: MessageAuthor;
};

const assistant: MessageAuthor = { id: "assistant", name: "Assistant" };

const initialThreads: Thread[] = (
  [
    { id: "release", title: "Release checklist", updatedAt: "2026-11-10T09:00:00Z", pinned: true },
    { id: "export", title: "Nightly export timeouts", updatedAt: "2026-11-18T10:30:00Z" },
    { id: "launch", title: "Draft the launch post", updatedAt: "2026-11-18T08:00:00Z", status: "running" },
    { id: "build", title: "Why the build is slow", updatedAt: "2026-11-17T16:00:00Z", unread: true },
    { id: "tests", title: "Flaky checkout tests", updatedAt: "2026-11-14T09:20:00Z" },
    { id: "pricing", title: "Compare pricing tiers", updatedAt: "2026-11-02T18:40:00Z" },
    { id: "schema", title: "Migrate the user schema", updatedAt: "2026-09-21T14:00:00Z" },
  ] satisfies Thread[]
).map((thread) => ({ ...thread, href: `#${thread.id}` }));

const initialLines: Record<string, Line[]> = {
  export: [
    {
      id: "m1",
      role: "user",
      createdAt: "2026-11-17T17:40:00Z",
      text: "The nightly **billing** export failed again. Can you take a look?",
    },
    {
      id: "m2",
      role: "assistant",
      author: assistant,
      createdAt: "2026-11-17T17:41:00Z",
      text: "Since Wednesday, every run has stopped after 30 seconds waiting on the reports service:\n\n- its median response time went from 4 to 41 seconds\n- it was slow, not down",
    },
    {
      id: "m3",
      role: "user",
      createdAt: "2026-11-18T10:28:00Z",
      text: "Did last night's run go through?",
    },
    {
      id: "m4",
      role: "assistant",
      author: assistant,
      createdAt: "2026-11-18T10:29:00Z",
      text: "Yes. It retried two pages with backoff and finished in 48 minutes.",
    },
    {
      id: "m5",
      role: "assistant",
      author: assistant,
      createdAt: "2026-11-18T10:30:00Z",
      text: "I also opened a pull request that alerts when a **billing** run takes longer than an hour.",
    },
  ],
};

type Row = { id: string; date: string } | { id: string; line: Line; continued: boolean };

// A day separator goes before the first message of each day, so it takes a row of its own.
const toRows = (lines: Line[]): Row[] =>
  lines.flatMap((line, index): Row[] => {
    const previous = lines[index - 1];
    const row = {
      id: line.id,
      line,
      continued: isContinuation(previous, line),
    };
    return previous && dayKey(previous.createdAt, timeZone) === dayKey(line.createdAt, timeZone)
      ? [row]
      : [{ id: `day-${dayKey(line.createdAt, timeZone)}`, date: line.createdAt }, row];
  });

function ChatRow(props: { row: Row; index: number }) {
  const line = () => ("line" in props.row ? props.row : undefined);
  return (
    <ConversationRow value={props.row.id} index={props.index}>
      <Show
        when={line()}
        fallback={
          <DaySeparator date={(props.row as { date: string }).date} timeZone={timeZone} relative={false} />
        }
      >
        {(row) => (
          <Message
            aria-label={row().line.role === "user" ? "Your message" : "Assistant message"}
            messageRole={row().line.role}
            text={row().line.text}
            author={row().line.author}
            continued={row().continued}
            createdAt={row().line.createdAt}
            now={now}
            timeZone={timeZone}
          >
            <Show when={row().line.author}>
              <MessageAvatar />
              <MessageHeader>
                <MessageAuthorName />
                <MessageTime />
              </MessageHeader>
            </Show>
            <MessageContent>
              <Markdown source={row().line.text} />
            </MessageContent>
          </Message>
        )}
      </Show>
    </ConversationRow>
  );
}

export default function ChatShellExample() {
  const [threads, setThreads] = createSignal(initialThreads);
  const [current, setCurrent] = createSignal("export");
  const [lines, setLines] = createSignal(initialLines);
  const controller = createConversationController();
  const [searching, setSearching] = createSignal(false);
  const [marks, setMarks] = createSignal<readonly number[]>([]);
  const [online, setOnline] = createSignal(true);
  onSettled(() => {
    const change = () => setOnline(navigator.onLine);
    change();
    window.addEventListener("online", change);
    window.addEventListener("offline", change);
    return () => {
      window.removeEventListener("online", change);
      window.removeEventListener("offline", change);
    };
  });

  const thread = () => threads().find((item) => item.id === current());
  const rows = createMemo(() => toRows(lines()[current()] ?? []));
  const searchable = createMemo(() =>
    rows().map((row) => ({ id: row.id, text: "line" in row ? row.line.text : "" })),
  );
  const update = (id: string, change: Partial<Thread>) =>
    setThreads((items) => items.map((item) => (item.id === id ? { ...item, ...change } : item)));
  const open = (id: string) => {
    setCurrent(id);
    setSearching(false);
    update(id, { unread: false });
  };
  const create = (title: string) => {
    const id = crypto.randomUUID();
    setThreads((items) => [
      { id, title: title.trim() || "New chat", updatedAt: new Date().toISOString(), href: `#${id}` },
      ...items,
    ]);
    open(id);
  };
  const send = (text: string) => {
    const line: Line = {
      id: crypto.randomUUID(),
      role: "user",
      text,
      createdAt: new Date().toISOString(),
    };
    setLines((all) => ({ ...all, [current()]: [...(all[current()] ?? []), line] }));
    update(current(), { updatedAt: line.createdAt });
  };

  return (
    <Sidebar label="Chats" defaultSize="200px" minSize="180px" class="h-[640px] w-full overflow-hidden">
      <SidebarPanel>
        <div class="flex h-12 shrink-0 items-center px-2">
          <ThreadSearch threads={threads()} now={now} timeZone={timeZone} onSelect={open} onNew={create} />
        </div>
        <div class="flex min-h-0 flex-1 flex-col px-2 pb-2">
          <div class="min-h-0 flex-1">
            <ThreadList
              threads={threads()}
              value={current()}
              now={now}
              timeZone={timeZone}
              onSelect={(id, details) => {
                details.cancel();
                open(id);
              }}
              onNew={() => create("")}
              onRename={(id, { title }) => update(id, { title })}
              onPinChange={(id, { pinned }) => update(id, { pinned })}
              onDelete={(id) => {
                const rest = threads().filter((item) => item.id !== id);
                setThreads(rest);
                if (id !== current()) return;
                if (rest[0]) open(rest[0].id);
                else create("");
              }}
            />
          </div>
        </div>
      </SidebarPanel>
      <SidebarHandle />
      <SidebarInset class="bg-[var(--kind-color-raised)]">
        <header class="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--kind-color-border)] px-3">
          <SidebarTrigger />
          <h2 class="m-0 min-w-0 flex-1 truncate text-sm font-medium">{thread()?.title ?? "New chat"}</h2>
          <button
            type="button"
            data-kind-icon-button=""
            aria-label="Find in chat"
            title="Find in chat"
            onClick={() => setSearching(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </header>
        <div class="relative min-h-0 flex-1">
          <ConversationSearch
            messages={searchable()}
            conversation={controller}
            open={searching()}
            onOpenChange={setSearching}
            onMarksChange={setMarks}
          />
          {/* Keyed by the chat, so each chat gets a conversation of its own. */}
          <Show when={current()} keyed>
            <Conversation
              aria-label="Conversation"
              messageCount={rows().length}
              controller={controller}
              marks={marks()}
              class="h-full"
            >
              <ConversationViewport>
                <ConversationContent>
                  <For each={rows()} keyed={(row) => row.id}>
                    {(row, index) => <ChatRow row={row()} index={index()} />}
                  </For>
                  <ConversationEmpty>
                    <ConversationEmptyTitle>What can I help with?</ConversationEmptyTitle>
                    <ConversationEmptyDescription>
                      Ask anything to start this chat.
                    </ConversationEmptyDescription>
                  </ConversationEmpty>
                </ConversationContent>
              </ConversationViewport>
              <ConversationJump />
              <ConversationMarks />
              <ConnectionStatus state={online() ? "online" : "offline"} />
            </Conversation>
          </Show>
        </div>
        <div class="mx-auto w-full max-w-[var(--kind-chat-max-width)] p-3">
          <FullComposer
            disabled={!online()}
            placeholder={online() ? "Ask anything…" : "Offline"}
            onSubmit={(draft) => send(draft.text)}
          />
        </div>
      </SidebarInset>
    </Sidebar>
  );
}
