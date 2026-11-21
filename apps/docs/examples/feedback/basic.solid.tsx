import { createSignal } from "solid-js";
import { Feedback } from "@/components/ui/solid/feedback";
import { KindToolbar, KindToolbarButton } from "@/components/ui/solid/internal/toolbar";
import { Message, MessageContent, MessageCopy, MessageToolbar } from "@/components/ui/solid/message";

const reply = "Retry with exponential backoff, and cap the number of attempts.";

export default function FeedbackExample() {
  const [commentSent, setCommentSent] = createSignal(false);

  return (
    <Message aria-label="Assistant message" messageRole="assistant" text={reply} class="w-full max-w-xl">
      <MessageContent>{reply}</MessageContent>
      <MessageToolbar>
        <KindToolbar aria-label="Message actions">
          <MessageCopy>
            <KindToolbarButton aria-label="Copy" />
          </MessageCopy>
        </KindToolbar>
        <Feedback
          commentSent={commentSent()}
          onComment={() =>
            new Promise<void>((resolve) => {
              setTimeout(() => {
                setCommentSent(true);
                resolve();
              }, 600);
            })
          }
        />
      </MessageToolbar>
    </Message>
  );
}
