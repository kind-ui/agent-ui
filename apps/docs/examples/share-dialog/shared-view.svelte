<script lang="ts">
  import {
    Conversation,
    ConversationContent,
    ConversationRow,
    ConversationViewport,
  } from "@/components/ui/svelte/conversation/index.js";
  import { Message, MessageContent } from "@/components/ui/svelte/message/index.js";
  import { Notice } from "@/components/ui/svelte/notice/index.js";

  const messages = [
    { id: "m1", role: "user", text: "The nightly export failed again. Can you take a look?" },
    {
      id: "m2",
      role: "assistant",
      text: "Every run since Wednesday stopped after 30 seconds waiting on the reports service, which got slower, not down.",
    },
    { id: "m3", role: "user", text: "So we just raise the timeout?" },
    {
      id: "m4",
      role: "assistant",
      text: "That gets tonight's run through. I'd also retry each page with backoff and alert when a run takes over an hour.",
    },
  ] as const;
</script>

<div class="flex w-full max-w-xl flex-col gap-3">
  <Notice label="This is a shared copy of a chat.">
    {#snippet actions()}
      <button type="button" data-kind-button="" class="self-start">Continue this chat</button>
    {/snippet}
  </Notice>
  <Conversation
    aria-label="Shared chat"
    messageCount={messages.length}
    class="h-72 rounded-xl border border-[var(--kind-color-border)]"
  >
    <ConversationViewport>
      <ConversationContent>
        {#each messages as message, index (message.id)}
          <ConversationRow value={message.id} {index}>
            <Message
              aria-label={message.role === "user" ? "User message" : "Assistant message"}
              messageRole={message.role}
              text={message.text}
            >
              <MessageContent>{message.text}</MessageContent>
            </Message>
          </ConversationRow>
        {/each}
      </ConversationContent>
    </ConversationViewport>
  </Conversation>
</div>
