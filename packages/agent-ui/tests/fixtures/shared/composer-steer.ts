import type { QueueItem } from "@kind-ui/agent-ui";
import type { ComposerDraft, ComposerSteerDetails, QueueItemActionDetails } from "@kind-ui/agent-ui/core";
import { expose } from "./expose.js";

type Call = { type: string; text?: string; id?: string; mode?: string; reason: string; source: string };

export const queuedMessages: QueueItem[] = [
  { id: "q1", status: "pending", title: "Then add a test for the expired session case" },
  { id: "q2", status: "pending", title: "Update the README section on auth once tests pass" },
];

export const steerText = "Use the session table, not a cookie";

export function steerHost(
  params: URLSearchParams,
  host: {
    items: () => QueueItem[];
    setItems: (items: QueueItem[]) => void;
    setRunning: (running: boolean) => void;
  },
) {
  const calls: Call[] = [];
  const held: { resolve: () => void; reject: () => void }[] = [];
  let next = 3;
  const settle = () =>
    params.has("hold")
      ? new Promise<void>((resolve, reject) =>
          held.push({ resolve, reject: () => reject(new Error("failed")) }),
        )
      : undefined;
  const without = (id: string) => host.setItems(host.items().filter((item) => item.id !== id));
  const handles = { calls, held };
  expose({ kindSteer: handles });
  return {
    handles,
    onSteer: (draft: ComposerDraft, { mode, reason, source }: ComposerSteerDetails) => {
      calls.push({ type: "steer", text: draft.text, mode, reason, source });
      if (mode === "queue")
        host.setItems([...host.items(), { id: `q${next++}`, status: "pending", title: draft.text }]);
      return settle();
    },
    onStop: () => {
      calls.push({ type: "stop", reason: "stop-press", source: "" });
      host.setRunning(false);
    },
    onSend: (id: string, { reason, source }: QueueItemActionDetails) => {
      calls.push({ type: "send", id, reason, source });
      without(id);
    },
    onEdit: (id: string, { reason, source }: QueueItemActionDetails) => {
      calls.push({ type: "edit", id, reason, source });
      without(id);
    },
    onRemove: (id: string, { reason, source }: { reason: string; source: string }) => {
      calls.push({ type: "remove", id, reason, source });
      without(id);
    },
  };
}
