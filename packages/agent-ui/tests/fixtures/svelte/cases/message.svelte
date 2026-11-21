<script module lang="ts">
  import { expose } from "../../shared/expose.js";

  export const variants = [
    "all",
    "no-callbacks",
    "chat",
    "options",
    "refusing",
    "author",
    "author-clock",
    "outcomes",
    "custom-rows",
  ];

  const calls: string[] = [];
  expose({ kindMessage: { calls } });
</script>

<script lang="ts">
  import type { MessageStatus } from "@kind-ui/agent-ui";
  import type { MessageRegenerateDetails } from "@kind-ui/agent-ui/core";
  import { flushSync, type Snippet } from "svelte";
  import {
    Conversation,
    ConversationContent,
    ConversationRow,
    ConversationViewport,
  } from "../../../../src/svelte/conversation/index.js";
  import { KindAvatar, KindAvatarFallback } from "../../../../src/svelte/internal/avatar/index.js";
  import { KindMenuItem } from "../../../../src/svelte/internal/menu/index.js";
  import { KindToolbar, KindToolbarButton } from "../../../../src/svelte/internal/toolbar/index.js";
  import { Markdown } from "../../../../src/svelte/markdown/index.js";
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
    MessageDuration,
    MessageEdit,
    MessageEditor,
    MessageHeader,
    MessageOutcome,
    MessageRegenerate,
    MessageRegenerateContent,
    MessageTime,
    MessageToolbar,
  } from "../../../../src/svelte/message/index.js";
  import { answer } from "../../shared/markdown.js";
  import {
    author,
    authored,
    outcomeError,
    outcomeText,
    regenerateOptions,
    timing,
  } from "../../shared/message.js";

  type Deferred = { resolve(): void; reject(): void };

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const replies = [
    "Retry with exponential backoff, and cap the number of attempts.",
    "Queue the request and retry it from a background job.",
    "Fail fast and let the caller decide whether to retry.",
  ];
  const question = "How should the client handle a flaky upstream?";

  let branch = $state(0);
  let userText = $state(question);
  let status: MessageStatus = $state("complete");
  let reply: { text: string; status: MessageStatus } = $state.raw({ text: "", status: "streaming" });
  let statuses: Record<string, MessageStatus> = $state.raw({
    stopped: "streaming",
    failed: "streaming",
    earlier: "error",
  });
  const deferred: Deferred[] = [];

  let refusing = $derived(variant === "refusing");
  let clock = $derived(variant === "author-clock");

  expose({
    kindMessage: {
      calls,
      source: answer,
      append: (chunk: string) => flushSync(() => (reply = { ...reply, text: reply.text + chunk })),
      finish: () => flushSync(() => (reply = { ...reply, status: "complete" })),
    },
    kindRegenerate: { status: (value: MessageStatus) => flushSync(() => (status = value)) },
    kindOutcome: {
      calls,
      status: (id: string, value: MessageStatus) => flushSync(() => (statuses = { ...statuses, [id]: value })),
      settle: (ok: boolean) => deferred.shift()?.[ok ? "resolve" : "reject"](),
    },
  });

  const wait = (name: string) => (details: { reason: string; source: string }) => {
    calls.push(`${name}:${details.reason}:${details.source}`);
    return new Promise<void>((resolve, reject) => deferred.push({ resolve, reject }));
  };
  const outcomeRows = [
    { id: "stopped", label: "Stopped answer", props: { onContinue: wait("continue") } },
    { id: "failed", label: "Failed answer", props: { onRetry: wait("retry"), error: outcomeError } },
    { id: "earlier", label: "Earlier answer", props: { onRetry: wait("retry") } },
  ];
</script>

{#snippet actions(extra?: Snippet)}
  <KindToolbar aria-label="Message actions">
    <MessageCopy>
      <KindToolbarButton aria-label="Copy" />
    </MessageCopy
    >{@render extra?.()}
  </KindToolbar>
{/snippet}

{#snippet regenerate()}
  <MessageRegenerate>
    {#snippet children(props: Record<string, unknown>)}<KindToolbarButton {...props} aria-label="Regenerate" />{/snippet}
  </MessageRegenerate>
{/snippet}

{#snippet assistant(callbacks: boolean)}
  {@const text = replies[branch] as string}
  <Message
    aria-label="Assistant message"
    messageRole="assistant"
    {text}
    {...callbacks
      ? {
          branchIndex: branch,
          branchCount: replies.length,
          onBranchChange: (index: number) => (branch = index),
          onRegenerate: () => calls.push("regenerate"),
          onCopy: (value: string) => calls.push(`copy:${value}`),
        }
      : {}}
  >
    <MessageAvatar>
      <KindAvatar>
        <KindAvatarFallback>AI</KindAvatarFallback>
      </KindAvatar>
    </MessageAvatar
    ><MessageContent>
      <Markdown source={text} />
    </MessageContent
    ><MessageToolbar>
      <MessageBranch>
        <MessageBranchPrevious
        /><MessageBranchLabel
        /><MessageBranchNext />
      </MessageBranch
      >{@render actions(regenerate)}
    </MessageToolbar>
  </Message>
{/snippet}

{#snippet customRows()}
  <MessageRegenerateContent>
    {#snippet children({ options })}
      {#each options as option (option.id)}
        <KindMenuItem value={option.id} label={option.label}>{option.label.toUpperCase()}</KindMenuItem>
      {/each}
    {/snippet}
  </MessageRegenerateContent>
{/snippet}

{#snippet regenerateMenu(custom: boolean)}
  <MessageRegenerate {...custom ? { menuContent: customRows } : {}}>
    {#snippet children(props)}<KindToolbarButton {...props} aria-label="Regenerate" />{/snippet}
  </MessageRegenerate>
{/snippet}

{#snippet plainMenu()}{@render regenerateMenu(false)}{/snippet}

{#snippet customMenu()}{@render regenerateMenu(true)}{/snippet}

{#snippet withOptions(custom: boolean)}
  <div class="m-4 w-[36rem]">
    <Message
      aria-label="Assistant message"
      {status}
      text={replies[0]}
      {regenerateOptions}
      onRegenerate={(_text: string, details: MessageRegenerateDetails) => {
        calls.push(`regenerate:${details.optionId ?? ""}:${details.reason}:${details.source}`);
        if (refusing) details.cancel();
      }}
    >
      <MessageContent>{replies[0]}</MessageContent
      ><MessageToolbar>
        {@render actions(custom ? customMenu : plainMenu)}
      </MessageToolbar>
    </Message>
  </div>
{/snippet}

{#snippet edit()}
  <MessageEdit>
    <KindToolbarButton aria-label="Edit" />
  </MessageEdit>
{/snippet}

{#snippet user()}
  <Message
    aria-label="User message"
    messageRole="user"
    text={userText}
    onEdit={(next: string) => {
      calls.push(`edit:${next}`);
      userText = next;
    }}
  >
    <MessageContent>{userText}</MessageContent
    ><MessageEditor
    /><MessageToolbar>
      {@render actions(edit)}
    </MessageToolbar>
  </Message>
{/snippet}

{#if variant === "all"}
  <div class="m-4 flex w-[36rem] flex-col gap-6">
    {@render user()}{@render assistant(true)}
  </div>
{:else if variant === "no-callbacks"}
  <div class="m-4 w-[36rem]">{@render assistant(false)}</div>
{:else if variant === "chat"}
  <Conversation
    aria-label="Conversation"
    messageCount={2}
    class="m-4 h-[40rem] w-[44rem] rounded-xl border border-[var(--kind-color-border)]"
  >
    <ConversationViewport>
      <ConversationContent>
        <ConversationRow value="q" index={0}>{@render user()}</ConversationRow
        ><ConversationRow value="a" index={1}>
          <Message
            aria-label="Assistant message"
            messageRole="assistant"
            status={reply.status}
            text={reply.text}
            onRegenerate={() => calls.push("regenerate")}
          >
            <MessageContent>
              <Markdown source={reply.text} streaming={reply.status === "streaming"} />
            </MessageContent
            ><MessageToolbar>{@render actions(regenerate)}</MessageToolbar>
          </Message>
        </ConversationRow>
      </ConversationContent>
    </ConversationViewport>
  </Conversation>
{:else if variant === "options" || variant === "refusing"}
  {@render withOptions(false)}
{:else if variant === "custom-rows"}
  {@render withOptions(true)}
{:else if variant === "author" || variant === "author-clock"}
  <div class="m-4 flex w-[36rem] flex-col gap-2">
    {#each authored as { id, text, ...rest } (id)}
      <Message
        {id}
        aria-label={`Message ${id}`}
        {text}
        {author}
        timeZone={timing.timeZone}
        {...clock ? {} : { now: timing.now }}
        {...rest}
      >
        <MessageAvatar
        /><MessageHeader>
          <MessageAuthor
          /><MessageTime
          /><MessageDuration />
        </MessageHeader
        ><MessageContent>{text}</MessageContent>
      </Message>
    {/each}
  </div>
{:else}
  <div class="m-4 flex w-[36rem] flex-col gap-6">
    {#each outcomeRows as { id, label, props } (id)}
      <Message {id} aria-label={label} status={statuses[id]} text={outcomeText} {...props}>
        <MessageContent>{outcomeText}</MessageContent
        ><MessageOutcome />
      </Message>
    {/each}<input aria-label="Reply" class="w-full"
    />
  </div>
{/if}
