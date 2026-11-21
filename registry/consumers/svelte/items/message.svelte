<script lang="ts">
  import { KindToolbar, KindToolbarButton } from "../components/ui/svelte/internal/toolbar/index.js";
  import { Message, MessageContent, MessageCopy, MessageToolbar } from "../components/ui/svelte/message/index.js";
</script>

<Message aria-label="Reply" messageRole="assistant" text="Retry with backoff.">
  <MessageContent>Retry with backoff.</MessageContent>
  <MessageToolbar>
    <KindToolbar aria-label="Reply actions">
      <MessageCopy>
        <KindToolbarButton aria-label="Copy" />
      </MessageCopy>
    </KindToolbar>
  </MessageToolbar>
</Message>
