<script lang="ts">
  import { createConversationController } from "@kind-ui/agent-ui/core";
  import {
    Conversation,
    ConversationContent,
    ConversationMarks,
    ConversationRow,
    ConversationViewport,
  } from "@/components/ui/svelte/conversation/index.js";
  import { ConversationSearch } from "@/components/ui/svelte/conversation-search/index.js";
  import { Markdown } from "@/components/ui/svelte/markdown/index.js";

  const messages = [
    { id: "m1", role: "user", text: "The nightly **billing** export failed again. Can you take a look?" },
    { id: "m2", role: "assistant", text: "Sure. Which job is it, and when did it last succeed?" },
    { id: "m3", role: "user", text: "`billing-export`. It last succeeded on Tuesday." },
    {
      id: "m4",
      role: "assistant",
      text: "Since Wednesday, every run has stopped after 30 seconds waiting on the reports service:\n\n- its median response time went from 4 to 41 seconds\n- it was slow, not down",
    },
    { id: "m5", role: "user", text: "So we just raise the timeout?" },
    {
      id: "m6",
      role: "assistant",
      text: "That gets tonight's run through, but the next slow night fails again. I'd **retry** each page with backoff and alert when a run takes longer than an hour.",
    },
    { id: "m7", role: "user", text: "Do that, and open a pull request against the billing service." },
    {
      id: "m8",
      role: "assistant",
      text: "Done. The pull request adds the retry and the alert, with a test that replays Wednesday's slow responses.",
    },
  ];

  const controller = createConversationController();
  let marks: readonly number[] = $state.raw([]);
</script>

<div class="relative h-[360px] w-full max-w-xl">
  <ConversationSearch
    {messages}
    conversation={controller}
    defaultOpen
    defaultQuery="billing"
    onMarksChange={(next) => (marks = next)}
  />
  <Conversation
    aria-label="Conversation"
    messageCount={messages.length}
    {controller}
    {marks}
    class="h-full rounded-xl border border-[var(--kind-color-border)]"
  >
    <ConversationViewport>
      <ConversationContent>
        {#each messages as message, index (message.id)}
          <ConversationRow value={message.id} {index}>
            <div
              class={message.role === "user"
                ? "ms-auto w-fit max-w-[80%] rounded-2xl bg-[var(--kind-color-hover)] px-3.5 py-2"
                : undefined}
            >
              <Markdown source={message.text} />
            </div>
          </ConversationRow>
        {/each}
      </ConversationContent>
    </ConversationViewport>
    <ConversationMarks />
  </Conversation>
</div>
