"use client";
import type { QueueItem } from "@kind-ui/agent-ui";
import { useState } from "react";
import {
  Composer,
  ComposerInput,
  ComposerSendMenu,
  ComposerStop,
  ComposerSubmit,
} from "@/components/ui/composer";
import { Queue } from "@/components/ui/queue";

let next = 1;

export default function SteerExample() {
  const [running, setRunning] = useState(true);
  const [queued, setQueued] = useState<QueueItem[]>([
    { id: "0", status: "pending", title: "Then add a test for the expired session case" },
  ]);
  const drop = (id: string) => setQueued((items) => items.filter((item) => item.id !== id));

  return (
    <Composer
      aria-label="Message"
      running={running}
      onSubmit={() => setRunning(true)}
      onStop={() => setRunning(false)}
      onSteer={(draft, { mode }) => {
        if (mode === "queue")
          setQueued((items) => [...items, { id: String(next++), status: "pending", title: draft.text }]);
      }}
    >
      <Queue label="Queued messages" items={queued} onSend={drop} onEdit={drop} onRemove={drop} />
      <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
      <ComposerSubmit />
      <ComposerStop />
      <ComposerSendMenu />
    </Composer>
  );
}
