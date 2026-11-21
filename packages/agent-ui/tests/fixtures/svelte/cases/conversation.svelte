<script module lang="ts">
  export const variants = [
    "chat",
    "empty",
    "chat-10",
    "chat-500",
    "virtual",
    "remount",
    "loading",
    "error",
    "error-plain",
    "welcome",
  ];
</script>

<script lang="ts">
  import {
    type ConversationState,
    type ConversationStatus,
    createConversationController,
  } from "@kind-ui/agent-ui/core";
  import { flushSync } from "svelte";
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
  } from "../../../../src/svelte/conversation/index.js";
  import { type ConversationStates, retryRecorder } from "../../shared/conversation.js";
  import { expose } from "../../shared/expose.js";

  type Message = { id: string; role: "user" | "assistant"; text: string };

  let { variant }: { variant: string; params: URLSearchParams } = $props();

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

  const counts: Record<string, number> = {
    chat: 31,
    empty: 0,
    "chat-10": 10,
    "chat-500": 500,
    virtual: 1000,
    remount: 31,
  };
  const initials: Record<string, ConversationStatus> = { loading: "loading", error: "error", "error-plain": "error" };
  const frame = "m-4 h-[28rem] w-[32rem] rounded-xl border border-[var(--kind-color-border)]";

  let count = $derived(counts[variant] ?? 0);
  let virtualize = $derived(variant === "virtual");
  let all = $derived(messages(0, count));
  let controller = $state.raw(createConversationController());
  let shown = $state(true);
  let appended: number | undefined;
  let older = 0;

  let view: { status: ConversationStatus; count: number; error?: string } = $derived({
    status: initials[variant] ?? "ready",
    count: 0,
  });
  const retry = retryRecorder();
  let canRetry = $derived(variant !== "error-plain");

  const states: ConversationStates = {
    set: (status, count = 0, error) => (view = { status, count, ...(error !== undefined && { error }) }),
    resolveRetry: retry.resolveRetry,
    rejectRetry: retry.rejectRetry,
    retries: retry.retries,
  };
  expose({
    kindConversationStates: states,
    kindConversation: {
      append: (n = 1) => {
        appended ??= count;
        const added = messages(appended, n);
        appended += n;
        all = [...all, ...added];
      },
      prepend: (n = 1) => {
        const added = messages(older, n, "o");
        older += n;
        controller.prepend();
        all = [...added, ...all];
      },
      stream: (chunk: string) =>
        (all = all.map((m, i) => (i === all.length - 1 ? { ...m, text: m.text + chunk } : m))),
      remove: (n = 1) => (all = all.slice(0, -n)),
    },
    kindRemount: () =>
      flushSync(() => {
        shown = !shown;
        if (!shown) return;
        all = messages(0, count);
        controller = createConversationController();
        appended = undefined;
        older = 0;
      }),
  });
</script>

{#snippet bubble(message: Message)}
  {#if message.role === "user"}
    <p
      data-message={message.id}
      class="ms-auto w-fit max-w-[80%] rounded-2xl bg-[var(--kind-color-hover)] px-3.5 py-2"
    >
      {message.text}
    </p>
  {:else}
    <p data-message={message.id}>{message.text}</p>
  {/if}
{/snippet}

{#snippet row(message: Message, index: number)}
  <ConversationRow value={message.id} {index}>{@render bubble(message)}</ConversationRow>
{/snippet}

{#if variant in counts}
  {#if shown}
    <Conversation
      aria-label="Conversation"
      messageCount={all.length}
      {virtualize}
      rowKey={(index: number) => all[index]?.id ?? String(index)}
      {controller}
      class={frame}
    >
      <ConversationViewport>
        <ConversationContent>
          {#snippet children({ rows }: Pick<ConversationState, "rows">)}
            {#if virtualize}
              {#each rows as r (r.index)}
                {@const m = all[r.index]}
                {#if m}{@render row(m, r.index)}{/if}
              {/each}
            {:else}
              {#each all as m, i (m.id)}{@render row(m, i)}{/each}<ConversationEmpty
              >No messages yet.</ConversationEmpty>
            {/if}
          {/snippet}
        </ConversationContent>
      </ConversationViewport
      ><ConversationJump />
    </Conversation>
  {/if}
{:else}
  <Conversation
    aria-label="Conversation"
    messageCount={view.count}
    status={view.status}
    error={view.error}
    onRetry={canRetry ? retry.onRetry : undefined}
    class="m-4 h-[28rem] w-[32rem] max-w-[calc(100%-2rem)] rounded-xl border border-[var(--kind-color-border)]"
  >
    <ConversationViewport>
      <ConversationContent>
        {#each messages(0, view.count) as m, i (m.id)}{@render row(m, i)}{/each}<ConversationSkeleton
                /><ConversationLoading
        /><ConversationError
        /><ConversationEmpty>
          <ConversationEmptyTitle>What can I help with?</ConversationEmptyTitle
          ><ConversationEmptyDescription>Ask about your code, your docs or your last deploy.</ConversationEmptyDescription>
        </ConversationEmpty>
      </ConversationContent>
    </ConversationViewport
    ><ConversationJump />
  </Conversation>
{/if}
