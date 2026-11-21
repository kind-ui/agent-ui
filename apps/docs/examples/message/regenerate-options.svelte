<script lang="ts">
  import type { MessageRegenerateDetails } from "@kind-ui/agent-ui/core";
  import { KindToolbar, KindToolbarButton } from "@/components/ui/svelte/internal/toolbar/index.js";
  import {
    Message,
    MessageContent,
    MessageCopy,
    MessageRegenerate,
    MessageToolbar,
  } from "@/components/ui/svelte/message/index.js";

  const reply = "Retry with exponential backoff, and cap the number of attempts.";

  const regenerateOptions = [
    { id: "details", label: "Add details" },
    { id: "concise", label: "More concise", description: "Keep it to one sentence" },
    {
      id: "model",
      label: "Try with another model",
      items: [
        { id: "model-fast", label: "Fast model" },
        { id: "model-deep", label: "Deep model" },
      ],
    },
  ];

  let chosen = $state("Nothing yet");
</script>

<div class="flex w-full max-w-xl flex-col gap-3">
  <Message
    aria-label="Assistant message"
    messageRole="assistant"
    text={reply}
    {regenerateOptions}
    onRegenerate={(_text: string, { optionId }: MessageRegenerateDetails) => (chosen = optionId ?? "Try again")}
  >
    <MessageContent>{reply}</MessageContent>
    <MessageToolbar>
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
  <p class="text-sm text-[var(--kind-color-muted)]">Last regenerated with: {chosen}</p>
</div>
