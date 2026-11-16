"use client";
import { useState } from "react";
import { Feedback } from "@/components/ui/feedback";
import { KindToolbar, KindToolbarButton } from "@/components/ui/internal/toolbar";
import { Message, MessageContent, MessageCopy, MessageToolbar } from "@/components/ui/message";

const reply = "Retry with exponential backoff, and cap the number of attempts.";

export default function FeedbackExample() {
  const [commentSent, setCommentSent] = useState(false);

  return (
    <Message aria-label="Assistant message" messageRole="assistant" text={reply} className="w-full max-w-xl">
      <MessageContent>{reply}</MessageContent>
      <MessageToolbar>
        <KindToolbar aria-label="Message actions">
          <MessageCopy>
            <KindToolbarButton aria-label="Copy" />
          </MessageCopy>
        </KindToolbar>
        <Feedback
          commentSent={commentSent}
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
