<script lang="ts">
  import { createConversationController } from "@kind-ui/agent-ui/core";
  import { ConnectionStatus } from "../../../../../src/svelte/connection-status/index.js";
  import {
    Conversation,
    ConversationContent,
    ConversationError,
    ConversationLoading,
    ConversationMarks,
    ConversationRow,
    ConversationSkeleton,
    ConversationViewport,
  } from "../../../../../src/svelte/conversation/index.js";
  import { ConversationSearch } from "../../../../../src/svelte/conversation-search/index.js";
  import { DaySeparator } from "../../../../../src/svelte/day-separator/index.js";
  import {
    Message,
    MessageAuthor,
    MessageAvatar,
    MessageContent,
    MessageHeader,
    MessageOutcome,
  } from "../../../../../src/svelte/message/index.js";
  import { ShareDialog } from "../../../../../src/svelte/share-dialog/index.js";
  import {
    Sidebar,
    SidebarHandle,
    SidebarInset,
    SidebarPanel,
    SidebarTrigger,
  } from "../../../../../src/svelte/sidebar/index.js";
  import { ThreadList } from "../../../../../src/svelte/thread-list/index.js";
  import { ThreadSearch } from "../../../../../src/svelte/thread-search/index.js";
  import { type agentHost, shellMessages } from "../../../shared/agent.js";
  import { author, outcomeError, outcomeText } from "../../../shared/message.js";
  import { shareLink } from "../../../shared/share-dialog.js";
  import { NOW, threads } from "../../../shared/thread-list.js";

  let { host, confirm }: { host: ReturnType<typeof agentHost>; confirm: boolean } = $props();

  type Details = Parameters<ReturnType<typeof agentHost>["change"]>[1];

  let link: string | undefined = $state();
  const controller = createConversationController();
  let marks: readonly number[] = $state.raw([]);
  let history: "error" | "loading" = $state("error");
  const settle = (action: string, set: string | undefined) => (details: { source: string }) =>
    host
      .decide(action)(details)
      .then(() => {
        link = set;
      });
  const retryHistory = (details: { source: string }) =>
    host
      .decide("conversation-retry")(details)
      .then(() => {
        history = "loading";
      });
</script>

<div class="flex w-[40rem] flex-col gap-8 p-6">
  <section id="thread-list" data-case="thread-list" class="flex h-[22rem] flex-col">
    <ThreadList
      {threads}
      value="t2"
      now={NOW}
      timeZone="UTC"
      onSelect={(_id: string, details: Details) => host.change("thread-select", details)}
      onNew={host.decide("thread-new")}
      onRename={host.decide("thread-rename")}
      onPinChange={host.decide("thread-pin")}
      onShare={host.decide("thread-share")}
      onDelete={host.decide("thread-delete")}
    />
  </section
  ><section id="thread-search" data-case="thread-search">
    <ThreadSearch
      {threads}
      now={NOW}
      timeZone="UTC"
      onOpenChange={(_open: boolean, details: Details) => host.change("thread-search", details)}
      onQueryChange={(_query: string, details: Details) => host.change("thread-search-query", details)}
      onSelect={(_id: string, details: Details) => host.change("thread-search-select", details)}
      onNew={host.decide("thread-search-new")}
    />
  </section
  ><section id="sidebar" data-case="sidebar">
    <Sidebar
      label="History"
      class="h-48"
      onOpenChange={(_open: boolean, details: Details) => host.change("sidebar", details)}
    >
      <SidebarPanel><p class="p-2">Earlier chats</p></SidebarPanel
      ><SidebarHandle
      /><SidebarInset><SidebarTrigger /></SidebarInset>
    </Sidebar>
  </section
  ><section id="share" data-case="share-dialog">
    <ShareDialog
      defaultVisibility="link"
      {link}
      agentConfirm={confirm}
      onOpenChange={(_open: boolean, details: Details) => host.change("share", details)}
      onVisibilityChange={(_value: string, details: Details) => host.change("share-visibility", details)}
      onCreateLink={settle("share-create", shareLink)}
      onRevoke={settle("share-revoke", undefined)}
      onCopy={host.decide("share-copy")}
    />
  </section
  ><section id="day" data-case="day-separator">
    <DaySeparator date="2026-11-18T09:30:00Z" timeZone="UTC" />
  </section
  ><section id="failed" data-case="message">
    <Message
      aria-label="Failed answer"
      messageRole="assistant"
      status="error"
      error={outcomeError}
      text={outcomeText}
      {author}
      onRetry={host.decide("message-retry")}
    >
      <MessageAvatar
      /><MessageHeader><MessageAuthor /></MessageHeader
      ><MessageContent>{outcomeText}</MessageContent
      ><MessageOutcome />
    </Message>
  </section
  ><section id="earlier" data-case="conversation">
    <Conversation aria-label="Earlier chat" messageCount={0} status={history} onRetry={retryHistory} class="h-40">
      <ConversationViewport>
        <ConversationContent><ConversationSkeleton /><ConversationLoading /><ConversationError /></ConversationContent>
      </ConversationViewport>
    </Conversation>
  </section
  ><section id="connection" data-case="connection-status" class="relative h-16">
    <ConnectionStatus state="offline" onRetry={host.decide("connection-retry")} />
  </section
  ><section id="find" data-case="conversation-search" class="relative">
    <ConversationSearch
      messages={shellMessages}
      conversation={controller}
      defaultOpen
      motion="none"
      onMarksChange={(next: readonly number[]) => (marks = next)}
      onQueryChange={(_query: string, details: Details) => host.change("find-query", details)}
      onOpenChange={(_open: boolean, details: Details) => host.change("find", details)}
    /><Conversation
      aria-label="Found chat"
      messageCount={shellMessages.length}
      {controller}
      {marks}
      motion="none"
      class="h-48"
    >
      <ConversationViewport>
        <ConversationContent>
          {#each shellMessages as message, index (message.id)}
            <ConversationRow value={message.id} {index}><p>{message.text}</p></ConversationRow>
          {/each}
        </ConversationContent>
      </ConversationViewport
      ><ConversationMarks />
    </Conversation>
  </section>
</div>
