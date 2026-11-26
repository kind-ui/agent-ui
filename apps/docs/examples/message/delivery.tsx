"use client";
import type { MessageOptions } from "@kind-ui/agent-ui/core";
import { useState } from "react";
import { Composer, ComposerInput, ComposerSubmit } from "@/components/ui/composer";
import { Message, MessageContent, MessageDelivery } from "@/components/ui/message";

type Sent = { id: string; text: string; delivery: MessageOptions["delivery"] };

const wait = () => new Promise((resolve) => setTimeout(resolve, 600));

export default function MessageDeliveryExample() {
  const [sent, setSent] = useState<Sent[]>([
    { id: "steer", text: "Use the session table, not a cookie", delivery: "steering" },
    { id: "queued", text: "Then add a test for the expired session case", delivery: "queued" },
    { id: "failed", text: "Also log failed refreshes", delivery: "not-sent" },
  ]);
  const update = (id: string, next: Partial<Sent> | null) =>
    setSent((all) => all.flatMap((m) => (m.id !== id ? [m] : next ? [{ ...m, ...next }] : [])));

  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <Message aria-label="Assistant message">
        <MessageContent>I'll store the session in a signed cookie and check it on each request.</MessageContent>
      </Message>
      {sent.map((message) => (
        <Message
          key={message.id}
          aria-label="Your message"
          messageRole="user"
          text={message.text}
          delivery={message.delivery}
          onWithdraw={async () => {
            await wait();
            update(message.id, null);
          }}
          onResend={async () => {
            await wait();
            update(message.id, { delivery: undefined });
          }}
        >
          <MessageContent>{message.text}</MessageContent>
          <MessageDelivery />
        </Message>
      ))}
      <Composer aria-label="Message" onSubmit={() => {}}>
        <ComposerInput aria-label="Prompt" placeholder="Withdrawn messages come back here" />
        <ComposerSubmit />
      </Composer>
    </div>
  );
}
