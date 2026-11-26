"use client";
import { useState } from "react";
import { Queue } from "@/components/ui/queue";

const followUps = [
  { id: "logs", status: "pending" as const, title: "Also check the server logs" },
  { id: "pr", status: "pending" as const, title: "Then open a pull request" },
];

export default function QueueSendNowExample() {
  const [items, setItems] = useState(followUps);

  return (
    <Queue
      label="Queued follow-ups"
      items={items}
      // Your app steers the running turn with the item, then drops it from the queue.
      onSend={(id) =>
        new Promise<void>((resolve) =>
          setTimeout(() => {
            setItems((current) => current.filter((item) => item.id !== id));
            resolve();
          }, 600),
        )
      }
      onRemove={(id) => setItems((current) => current.filter((item) => item.id !== id))}
    />
  );
}
