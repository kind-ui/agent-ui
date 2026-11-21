import { KindToolbar, KindToolbarButton } from "../components/ui/solid/internal/toolbar.js";
import { Message, MessageContent, MessageCopy, MessageToolbar } from "../components/ui/solid/message.js";

export default function MessageItem() {
  return (
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
  );
}
