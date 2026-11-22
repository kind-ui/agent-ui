<script lang="ts">
  import { KindToolbar, KindToolbarButton } from "@/components/ui/svelte/internal/toolbar/index.js";
  import {
    Message,
    MessageBranch,
    MessageBranchLabel,
    MessageBranchNext,
    MessageBranchPrevious,
    MessageContent,
    MessageCopy,
    MessageEdit,
    MessageEditor,
    MessageRegenerate,
    MessageToolbar,
  } from "@/components/ui/svelte/message/index.js";

  const replies = [
    "Retry with exponential backoff, and cap the number of attempts.",
    "Queue the request and retry it from a background job.",
    "Fail fast and let the caller decide whether to retry.",
  ];

  let question = $state("How should the client handle a flaky upstream?");
  let branches = $state({ index: 0, count: 2 });
  let reply = $derived(replies[branches.index] as string);
</script>

<div class="flex w-full max-w-xl flex-col gap-6">
  <Message
    aria-label="User message"
    messageRole="user"
    text={question}
    onEdit={(text: string) => (question = text)}
  >
    <MessageContent>{question}</MessageContent>
    <MessageEditor />
    <MessageToolbar>
      <KindToolbar aria-label="Message actions">
        <MessageCopy>
          <KindToolbarButton aria-label="Copy" />
        </MessageCopy>
        <MessageEdit>
          <KindToolbarButton aria-label="Edit" />
        </MessageEdit>
      </KindToolbar>
    </MessageToolbar>
  </Message>
  <Message
    aria-label="Assistant message"
    messageRole="assistant"
    text={reply}
    branchIndex={branches.index}
    branchCount={branches.count}
    onBranchChange={(index: number) => (branches = { ...branches, index })}
    onRegenerate={() => {
      const count = Math.min(branches.count + 1, replies.length);
      branches = { index: count - 1, count };
    }}
  >
    <MessageContent>{reply}</MessageContent>
    <MessageToolbar>
      <MessageBranch>
        <MessageBranchPrevious />
        <MessageBranchLabel />
        <MessageBranchNext />
      </MessageBranch>
      <KindToolbar aria-label="Message actions">
        <MessageCopy>
          <KindToolbarButton aria-label="Copy" />
        </MessageCopy>
        <MessageRegenerate>
          {#snippet children(props: Record<string, unknown>)}<KindToolbarButton
              {...props}
              aria-label="Regenerate"
            />{/snippet}
        </MessageRegenerate>
      </KindToolbar>
    </MessageToolbar>
  </Message>
</div>
