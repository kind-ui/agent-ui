"use client";
import type { MessageAuthor, Thread } from "@kind-ui/agent-ui";
import { createConversationController, dayKey, isContinuation } from "@kind-ui/agent-ui/core";
import { memo, useMemo, useState, useSyncExternalStore } from "react";
import { ConnectionStatus } from "@/components/ui/connection-status";
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
} from "@/components/ui/conversation";
import { ConversationSearch } from "@/components/ui/conversation-search";
import { DaySeparator } from "@/components/ui/day-separator";
import { Markdown } from "@/components/ui/markdown";
import {
  Message,
  MessageAuthor as MessageAuthorName,
  MessageAvatar,
  MessageContent,
  MessageHeader,
  MessageTime,
} from "@/components/ui/message";
import { Sidebar, SidebarHandle, SidebarInset, SidebarPanel, SidebarTrigger } from "@/components/ui/sidebar";
import { ThreadList } from "@/components/ui/thread-list";
import { ThreadSearch } from "@/components/ui/thread-search";
import FullComposer from "../composer/full";

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

const ChatRow = memo(function ChatRow({ row, index }: { row: Row; index: number }) {
  return (
    <ConversationRow value={row.id} index={index}>
      {"line" in row ? (
        <Message
          aria-label={row.line.role === "user" ? "Your message" : "Assistant message"}
          messageRole={row.line.role}
          text={row.line.text}
          author={row.line.author}
          continued={row.continued}
          createdAt={row.line.createdAt}
          now={now}
          timeZone={timeZone}
        >
          {row.line.author && (
            <>
              <MessageAvatar />
              <MessageHeader>
                <MessageAuthorName />
                <MessageTime />
              </MessageHeader>
            </>
          )}
          <MessageContent>
            <Markdown source={row.line.text} />
          </MessageContent>
        </Message>
      ) : (
        <DaySeparator date={row.date} timeZone={timeZone} relative={false} />
      )}
    </ConversationRow>
  );
});

const subscribe = (change: () => void) => {
  window.addEventListener("online", change);
  window.addEventListener("offline", change);
  return () => {
    window.removeEventListener("online", change);
    window.removeEventListener("offline", change);
  };
};

export default function ChatShellExample() {
  const [threads, setThreads] = useState(initialThreads);
  const [current, setCurrent] = useState("export");
  const [lines, setLines] = useState(initialLines);
  const [controller] = useState(createConversationController);
  const [searching, setSearching] = useState(false);
  const [marks, setMarks] = useState<readonly number[]>([]);
  const online = useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );

  const thread = threads.find((item) => item.id === current);
  const rows = useMemo(() => toRows(lines[current] ?? []), [lines, current]);
  const searchable = useMemo(
    () => rows.map((row) => ({ id: row.id, text: "line" in row ? row.line.text : "" })),
    [rows],
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
    setLines((all) => ({ ...all, [current]: [...(all[current] ?? []), line] }));
    update(current, { updatedAt: line.createdAt });
  };

  return (
    <Sidebar label="Chats" defaultSize="200px" minSize="180px" className="h-[640px] w-full overflow-hidden">
      <SidebarPanel>
        <div className="flex h-12 shrink-0 items-center px-2">
          <ThreadSearch threads={threads} now={now} timeZone={timeZone} onSelect={open} onNew={create} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col px-2 pb-2">
          <div className="min-h-0 flex-1">
            <ThreadList
              threads={threads}
              value={current}
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
                const rest = threads.filter((item) => item.id !== id);
                setThreads(rest);
                if (id !== current) return;
                if (rest[0]) open(rest[0].id);
                else create("");
              }}
            />
          </div>
        </div>
      </SidebarPanel>
      <SidebarHandle />
      <SidebarInset className="bg-[var(--kind-color-raised)]">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b border-[var(--kind-color-border)] px-3">
          <SidebarTrigger />
          <h2 className="m-0 min-w-0 flex-1 truncate text-sm font-medium">{thread?.title ?? "New chat"}</h2>
          <button
            type="button"
            data-kind-icon-button=""
            aria-label="Find in chat"
            title="Find in chat"
            onClick={() => setSearching(true)}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
        </header>
        <div className="relative min-h-0 flex-1">
          <ConversationSearch
            messages={searchable}
            conversation={controller}
            open={searching}
            onOpenChange={setSearching}
            onMarksChange={setMarks}
          />
          <Conversation
            key={current}
            aria-label="Conversation"
            messageCount={rows.length}
            controller={controller}
            marks={marks}
            className="h-full"
          >
            <ConversationViewport>
              <ConversationContent>
                {rows.map((row, index) => (
                  <ChatRow key={row.id} row={row} index={index} />
                ))}
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
            <ConnectionStatus state={online ? "online" : "offline"} />
          </Conversation>
        </div>
        <div className="mx-auto w-full max-w-[var(--kind-chat-max-width)] p-3">
          <FullComposer
            disabled={!online}
            placeholder={online ? "Ask anything…" : "Offline"}
            onSubmit={(draft) => send(draft.text)}
          />
        </div>
      </SidebarInset>
    </Sidebar>
  );
}
