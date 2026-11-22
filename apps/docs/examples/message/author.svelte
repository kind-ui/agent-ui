<script lang="ts">
  import { isContinuation } from "@kind-ui/agent-ui/core";
  import {
    Message,
    MessageAuthor,
    MessageAvatar,
    MessageContent,
    MessageDuration,
    MessageHeader,
    MessageTime,
  } from "@/components/ui/svelte/message/index.js";

  const assistant = { id: "assistant", name: "Build Assistant" };

  const first = {
    author: assistant,
    createdAt: "2026-11-17T09:41:00Z",
    durationSeconds: 4,
    text: "The deploy failed because the migration timed out.",
  };

  const second = {
    author: assistant,
    createdAt: "2026-11-17T09:42:30Z",
    durationSeconds: 72,
    text: "I split the migration into batches of 1,000 rows, and the deploy passed.",
  };
</script>

<div class="flex w-full max-w-xl flex-col gap-4">
  {#each [first, second] as message, index (message.createdAt)}
    <Message
      aria-label="Assistant message"
      messageRole="assistant"
      text={message.text}
      author={message.author}
      continued={index > 0 && isContinuation(first, message)}
      createdAt={message.createdAt}
      durationSeconds={message.durationSeconds}
      timeZone="UTC"
    >
      <MessageAvatar />
      <MessageHeader>
        <MessageAuthor />
        <MessageTime />
        <MessageDuration />
      </MessageHeader>
      <MessageContent>{message.text}</MessageContent>
    </Message>
  {/each}
</div>
