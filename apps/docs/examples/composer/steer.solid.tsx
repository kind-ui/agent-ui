import { createSignal, Show } from "solid-js";
import {
  Composer,
  ComposerInput,
  ComposerSteerMenu,
  ComposerStop,
  ComposerSubmit,
} from "@/components/ui/solid/composer";
import { Queue } from "@/components/ui/solid/queue";

type Queued = { id: string; status: "pending"; title: string };

export default function ComposerSteerExample() {
  const [running, setRunning] = createSignal(false);
  const [queued, setQueued] = createSignal<Queued[]>([]);
  let timer: ReturnType<typeof setTimeout> | undefined;
  const run = () => {
    setRunning(true);
    clearTimeout(timer);
    timer = setTimeout(() => setRunning(false), 8000);
  };

  return (
    <div class="flex w-full flex-col gap-3">
      <Show when={queued().length > 0}>
        <Queue
          label="Queued follow-ups"
          items={queued()}
          onRemove={(id) => setQueued((all) => all.filter((item) => item.id !== id))}
          // Sending now steers the running turn with the follow-up.
          onSend={(id) => setQueued((all) => all.filter((item) => item.id !== id))}
        />
      </Show>
      <Composer
        aria-label="Message"
        running={running()}
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
