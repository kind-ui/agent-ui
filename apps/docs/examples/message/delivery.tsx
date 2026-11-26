"use client";
import { useState } from "react";
import { Message, MessageContent, MessageDelivery, MessageHeader } from "@/components/ui/message";

const wait = () => new Promise((resolve) => setTimeout(resolve, 800));

export default function MessageDeliveryExample() {
  const [queued, setQueued] = useState(true);

  return (
    <div className="flex w-full max-w-xl flex-col gap-6">
      <Message
        aria-label="Your message"
        messageRole="user"
        delivery="steered"
        text="Use the staging database instead."
      >
        <MessageHeader>
          <MessageDelivery />
        </MessageHeader>
        <MessageContent>Use the staging database instead.</MessageContent>
      </Message>
      {queued ? (
        <Message
          aria-label="Your message"
          messageRole="user"
          delivery="queued"
          text="Then run the migrations."
          onWithdraw={async () => {
            await wait();
            setQueued(false);
          }}
        >
          <MessageHeader>
            <MessageDelivery />
          </MessageHeader>
          <MessageContent>Then run the migrations.</MessageContent>
        </Message>
      ) : null}
    </div>
  );
}
