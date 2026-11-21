<script lang="ts">
  import { dayKey } from "@kind-ui/agent-ui/core";
  import {
    Conversation,
    ConversationContent,
    ConversationRow,
    ConversationViewport,
  } from "@/components/ui/svelte/conversation/index.js";
  import { DaySeparator } from "@/components/ui/svelte/day-separator/index.js";

  const timeZone = "America/Los_Angeles";

  const messages = [
    {
      id: "m1",
      role: "user",
      createdAt: "2026-11-16T17:40:00Z",
      text: "Can you check why the nightly export failed?",
    },
    {
      id: "m2",
      role: "assistant",
      createdAt: "2026-11-16T17:41:00Z",
      text: "Every run since last week stopped after 30 seconds waiting on the reports service.",
    },
    { id: "m3", role: "user", createdAt: "2026-11-17T16:05:00Z", text: "Did last night's run go through?" },
    {
      id: "m4",
      role: "assistant",
      createdAt: "2026-11-17T16:06:00Z",
      text: "Yes. It retried two pages and finished in 48 minutes.",
    },
  ];

  type Row = { id: string; date: string } | { id: string; message: (typeof messages)[number] };

  const rows = messages.flatMap((message, index): Row[] => {
    const day = dayKey(message.createdAt, timeZone);
    const previous = messages[index - 1];
    const newDay = !previous || dayKey(previous.createdAt, timeZone) !== day;
    return newDay
      ? [
          { id: `day-${day}`, date: message.createdAt },
          { id: message.id, message },
        ]
      : [{ id: message.id, message }];
  });
</script>

<Conversation
  aria-label="Conversation"
  messageCount={rows.length}
  class="h-80 w-full max-w-xl rounded-xl border border-[var(--kind-color-border)]"
>
  <ConversationViewport>
    <ConversationContent>
      {#each rows as row, index (row.id)}
        <ConversationRow value={row.id} {index}>
          {#if "message" in row}
            <p
              class={row.message.role === "user"
                ? "ms-auto w-fit max-w-[80%] rounded-2xl bg-[var(--kind-color-hover)] px-3.5 py-2"
                : undefined}
            >
              {row.message.text}
            </p>
          {:else}
            <DaySeparator date={row.date} {timeZone} />
          {/if}
        </ConversationRow>
      {/each}
    </ConversationContent>
  </ConversationViewport>
</Conversation>
