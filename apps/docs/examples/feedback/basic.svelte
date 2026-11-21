<script lang="ts">
  import { Feedback } from "@/components/ui/svelte/feedback/index.js";
  import { KindToolbar, KindToolbarButton } from "@/components/ui/svelte/internal/toolbar/index.js";
  import { Message, MessageContent, MessageCopy, MessageToolbar } from "@/components/ui/svelte/message/index.js";

  const reply = "Retry with exponential backoff, and cap the number of attempts.";

  let commentSent = $state(false);

  const onComment = () =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        commentSent = true;
        resolve();
      }, 600);
    });
</script>

<Message aria-label="Assistant message" messageRole="assistant" text={reply} class="w-full max-w-xl">
  <MessageContent>{reply}</MessageContent>
  <MessageToolbar>
    <KindToolbar aria-label="Message actions">
      <MessageCopy>
        <KindToolbarButton aria-label="Copy" />
      </MessageCopy>
    </KindToolbar>
    <Feedback {commentSent} {onComment} />
  </MessageToolbar>
</Message>
