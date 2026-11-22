<script lang="ts">
  import type { ConversationStatus } from "@kind-ui/agent-ui/core";
  import {
    Conversation,
    ConversationContent,
    ConversationError,
    ConversationLoading,
    ConversationRow,
    ConversationSkeleton,
    ConversationViewport,
  } from "@/components/ui/svelte/conversation/index.js";

  const messages = [
    { id: "m1", role: "user", text: "Why did last night's deploy roll back?" },
    {
      id: "m2",
      role: "assistant",
      text: "The health check on the new version timed out after 60 seconds, so the deploy rolled back on its own. The service took 75 seconds to warm its cache.",
    },
    { id: "m3", role: "user", text: "Can we raise the check's timeout?" },
    { id: "m4", role: "assistant", text: "Yes. I'd set it to 120 seconds and keep the retries at three." },
  ];

  const statuses: ConversationStatus[] = ["loading", "error", "ready"];

  const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

  let status: ConversationStatus = $state("loading");
</script>

<div class="flex w-full max-w-xl flex-col gap-3">
  <div class="flex gap-2">
    {#each statuses as value (value)}
      <button
        type="button"
        aria-pressed={status === value}
        onclick={() => (status = value)}
        class="rounded-md border border-[var(--kind-color-border)] px-2.5 py-1 text-sm capitalize aria-pressed:bg-[var(--kind-color-selected)]"
      >
        {value}
      </button>
    {/each}
  </div>
  <Conversation
    aria-label="Conversation"
    messageCount={messages.length}
    {status}
    onRetry={async () => {
      await wait(600);
      status = "loading";
      await wait(1200);
      status = "ready";
    }}
    class="h-80 w-full rounded-xl border border-[var(--kind-color-border)]"
  >
    <ConversationViewport>
      <ConversationContent>
        <ConversationSkeleton />
        <ConversationLoading />
        <ConversationError />
        {#if status === "ready"}
          {#each messages as message, index (message.id)}
            <ConversationRow value={message.id} {index}>
              <p
                class={message.role === "user"
                  ? "ms-auto w-fit max-w-[80%] rounded-2xl bg-[var(--kind-color-bubble)] px-3.5 py-2"
                  : undefined}
              >
                {message.text}
              </p>
            </ConversationRow>
          {/each}
        {/if}
      </ConversationContent>
    </ConversationViewport>
  </Conversation>
</div>
