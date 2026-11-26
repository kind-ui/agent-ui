"use client";
import { useRef, useState } from "react";
import {
  Composer,
  ComposerInput,
  ComposerSteerMenu,
  ComposerStop,
  ComposerSubmit,
} from "@/components/ui/composer";
import { Queue } from "@/components/ui/queue";

type Queued = { id: string; status: "pending"; title: string };

export default function ComposerSteerExample() {
  const [running, setRunning] = useState(false);
  const [queued, setQueued] = useState<Queued[]>([]);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const run = () => {
    setRunning(true);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setRunning(false), 8000);
  };

  return (
    <div className="flex w-full flex-col gap-3">
      {queued.length > 0 ? (
        <Queue
          label="Queued follow-ups"
          items={queued}
          onRemove={(id) => setQueued((all) => all.filter((item) => item.id !== id))}
          // Sending now steers the running turn with the follow-up.
          onSend={(id) => setQueued((all) => all.filter((item) => item.id !== id))}
        />
      ) : null}
      <Composer
        aria-label="Message"
        running={running}
        onSubmit={run}
        onStop={() => setRunning(false)}
        onSteer={(draft, { mode }) => {
          if (mode === "queue")
            setQueued((all) => [...all, { id: crypto.randomUUID(), status: "pending", title: draft.text }]);
        }}
      >
        <ComposerInput aria-label="Prompt" placeholder="Send, then steer while it runs" />
        <ComposerSubmit />
        <ComposerSteerMenu />
        <ComposerStop />
      </Composer>
    </div>
  );
}
