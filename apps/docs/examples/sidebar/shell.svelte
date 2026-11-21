<script lang="ts">
  import type { MessageAuthor, Thread } from "@kind-ui/agent-ui";
  import { createConversationController, dayKey, isContinuation } from "@kind-ui/agent-ui/core";
  import { ConnectionStatus } from "@/components/ui/svelte/connection-status/index.js";
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
  } from "@/components/ui/svelte/conversation/index.js";
  import { ConversationSearch } from "@/components/ui/svelte/conversation-search/index.js";
  import { DaySeparator } from "@/components/ui/svelte/day-separator/index.js";
  import { Markdown } from "@/components/ui/svelte/markdown/index.js";
  import {
    Message,
    MessageAuthor as MessageAuthorName,
    MessageAvatar,
    MessageContent,
    MessageHeader,
    MessageTime,
  } from "@/components/ui/svelte/message/index.js";
  import {
    Sidebar,
    SidebarHandle,
    SidebarInset,
    SidebarPanel,
    SidebarTrigger,
  } from "@/components/ui/svelte/sidebar/index.js";
  import { ThreadList } from "@/components/ui/svelte/thread-list/index.js";
  import { ThreadSearch } from "@/components/ui/svelte/thread-search/index.js";
  import FullComposer from "../composer/full.svelte";

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
      const row = { id: line.id, line, continued: isContinuation(previous, line) };
      return previous && dayKey(previous.createdAt, timeZone) === dayKey(line.createdAt, timeZone)
        ? [row]
        : [{ id: `day-${dayKey(line.createdAt, timeZone)}`, date: line.createdAt }, row];
    });

  let threads = $state.raw(initialThreads);
  let current = $state("export");
  let lines = $state.raw(initialLines);
  const controller = createConversationController();
  let searching = $state(false);
  let marks: readonly number[] = $state.raw([]);
  let online = $state(true);

  $effect(() => {
    const change = () => (online = navigator.onLine);
    change();
    window.addEventListener("online", change);
    window.addEventListener("offline", change);
    return () => {
      window.removeEventListener("online", change);
      window.removeEventListener("offline", change);
    };
  });

  const thread = $derived(threads.find((item) => item.id === current));
  const rows = $derived(toRows(lines[current] ?? []));
  const searchable = $derived(rows.map((row) => ({ id: row.id, text: "line" in row ? row.line.text : "" })));

  const update = (id: string, change: Partial<Thread>) =>
    (threads = threads.map((item) => (item.id === id ? { ...item, ...change } : item)));
  const open = (id: string) => {
    current = id;
    searching = false;
    update(id, { unread: false });
  };
  const create = (title: string) => {
    const id = crypto.randomUUID();
    threads = [
      { id, title: title.trim() || "New chat", updatedAt: new Date().toISOString(), href: `#${id}` },
      ...threads,
    ];
    open(id);
  };
  const send = (text: string) => {
    const line: Line = { id: crypto.randomUUID(), role: "user", text, createdAt: new Date().toISOString() };
    lines = { ...lines, [current]: [...(lines[current] ?? []), line] };
    update(current, { updatedAt: line.createdAt });
  };
</script>

<Sidebar label="Chats" defaultSize="200px" minSize="180px" class="h-[640px] w-full overflow-hidden">
  <SidebarPanel>
    <div class="flex h-12 shrink-0 items-center px-2">
      <ThreadSearch {threads} {now} {timeZone} onSelect={open} onNew={create} />
    </div>
    <div class="flex min-h-0 flex-1 flex-col px-2 pb-2">
      <div class="min-h-0 flex-1">
        <ThreadList
          {threads}
          value={current}
          {now}
          {timeZone}
          onSelect={(id: string, details: { cancel(): void }) => {
            details.cancel();
            open(id);
          }}
          onNew={() => create("")}
          onRename={(id: string, { title }: { title: string }) => update(id, { title })}
          onPinChange={(id: string, { pinned }: { pinned: boolean }) => update(id, { pinned })}
          onDelete={(id: string) => {
            const rest = threads.filter((item) => item.id !== id);
            threads = rest;
            if (id !== current) return;
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
      <h2 class="m-0 min-w-0 flex-1 truncate text-sm font-medium">{thread?.title ?? "New chat"}</h2>
      <button
        type="button"
        data-kind-icon-button=""
        aria-label="Find in chat"
        title="Find in chat"
        onclick={() => (searching = true)}
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
        </svg>
      </button>
    </header>
    <div class="relative min-h-0 flex-1">
      <ConversationSearch
        messages={searchable}
        conversation={controller}
        bind:open={() => searching, (value: boolean) => (searching = value)}
        onMarksChange={(value: readonly number[]) => (marks = value)}
      />
      {#key current}
        <Conversation aria-label="Conversation" messageCount={rows.length} {controller} {marks} class="h-full">
          <ConversationViewport>
            <ConversationContent>
              {#each rows as row, index (row.id)}
                <ConversationRow value={row.id} {index}>
                  {#if "line" in row}
                    <Message
                      aria-label={row.line.role === "user" ? "Your message" : "Assistant message"}
                      messageRole={row.line.role}
                      text={row.line.text}
                      author={row.line.author}
                      continued={row.continued}
                      createdAt={row.line.createdAt}
                      {now}
                      {timeZone}
                    >
                      {#if row.line.author}
                        <MessageAvatar />
                        <MessageHeader>
                          <MessageAuthorName />
                          <MessageTime />
                        </MessageHeader>
                      {/if}
                      <MessageContent>
                        <Markdown source={row.line.text} />
                      </MessageContent>
                    </Message>
                  {:else}
                    <DaySeparator date={row.date} {timeZone} relative={false} />
                  {/if}
                </ConversationRow>
              {/each}
              <ConversationEmpty>
                <ConversationEmptyTitle>What can I help with?</ConversationEmptyTitle>
                <ConversationEmptyDescription>Ask anything to start this chat.</ConversationEmptyDescription>
              </ConversationEmpty>
            </ConversationContent>
          </ConversationViewport>
          <ConversationJump />
          <ConversationMarks />
          <ConnectionStatus state={online ? "online" : "offline"} />
        </Conversation>
      {/key}
    </div>
    <div class="mx-auto w-full max-w-[var(--kind-chat-max-width)] p-3">
      <FullComposer
        disabled={!online}
        placeholder={online ? "Ask anything…" : "Offline"}
        onSubmit={((draft: { text: string }) => send(draft.text)) as () => void}
      />
    </div>
  </SidebarInset>
</Sidebar>
