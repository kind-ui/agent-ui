import type { ComposerDraft, ComposerSteerDetails, QueueItem, QueueSendDetails } from "@kind-ui/agent-ui/core";
import { expose } from "./expose.js";

type Steer = { text: string; mode: string; source: string; resolve: () => void; reject: () => void };
type Send = { id: string; reason: string; source: string; resolve: () => void; reject: () => void };

/** Each steer waits until the test settles it through `window.kindSteer`; Stop presses count there too. */
export function steerRecorder() {
  const steers: Steer[] = [];
  const stops: number[] = [];
  const onSteer = (draft: ComposerDraft, { mode, source }: ComposerSteerDetails) =>
    new Promise<void>((resolve, reject) =>
      steers.push({ text: draft.text, mode, source, resolve, reject: () => reject(new Error("failed")) }),
    );
  const onStop = () => void stops.push(steers.length);
  expose({ kindSteer: { steers, stops } });
  return { onSteer, onStop };
}

export const steerQueue: QueueItem[] = [
  { id: "a", status: "pending", title: "Also check the logs" },
  { id: "b", status: "pending", title: "Then open a PR" },
  { id: "c", status: "complete", title: "Read the schema" },
];

/** Each Send now waits until the test settles it through `window.kindSend`. */
export function sendRecorder() {
  const sends: Send[] = [];
  const onSend = (id: string, { reason, source }: QueueSendDetails) =>
    new Promise<void>((resolve, reject) =>
      sends.push({ id, reason, source, resolve, reject: () => reject(new Error("failed")) }),
    );
  expose({ kindSend: { sends } });
  return onSend;
}
