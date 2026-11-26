import type { QueueItem } from "@kind-ui/agent-ui";
import type { ComposerSteerMode } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/react/agent";
import { useEffect, useState } from "react";
import { flushSync } from "react-dom";
import {
  Composer,
  ComposerAttach,
  ComposerInput,
  ComposerSteerMenu,
  ComposerStop,
  ComposerSubmit,
} from "../../../../src/react/composer.js";
import { Queue } from "../../../../src/react/queue.js";
import { recorder } from "../../shared/composer.js";
import { sendRecorder, steerQueue, steerRecorder } from "../../shared/composer-steer.js";
import { expose } from "../../shared/expose.js";

// Recorders are made once per page, outside render: StrictMode runs a `useState` initializer twice, and the second
// would expose lists the component doesn't write to.
type Recorders = ReturnType<typeof recorder> & ReturnType<typeof steerRecorder>;

function Steer({
  params,
  submitOn,
  onSubmit,
  onSteer,
  onStop,
}: { params: URLSearchParams; submitOn?: "enter" | "mod-enter" } & Recorders) {
  const [running, setRunning] = useState(!params.has("idle"));
  useEffect(() => expose({ setRunning: (next: boolean) => flushSync(() => setRunning(next)) }), []);
  return (
    <div className="mx-auto max-w-xl p-6">
      <Composer
        aria-label="Message"
        submitOn={submitOn ?? "enter"}
        running={running}
        onSubmit={onSubmit}
        onStop={onStop}
        {...(params.has("no-steer") ? {} : { onSteer })}
        {...(params.has("mode") ? { steerMode: params.get("mode") as ComposerSteerMode } : {})}
      >
        <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
        <ComposerAttach />
        <ComposerSubmit />
        <ComposerSteerMenu />
        <ComposerStop />
      </Composer>
    </div>
  );
}

function SendNow({ onSend }: { onSend: ReturnType<typeof sendRecorder> }) {
  const [items, setItems] = useState<QueueItem[]>(steerQueue);
  useEffect(
    () =>
      expose({
        kindQueue: { remove: (id: string) => setItems((all) => all.filter((item) => item.id !== id)) },
      }),
    [],
  );
  return (
    <div className="flex w-[24rem] flex-col gap-4 p-6">
      <Queue label="Queue" items={items} onSend={onSend} />
    </div>
  );
}

// An agent needs a person for every composer action, unless the test permits it.
export const allow = (step: AgentAction) => !step.confirm || (window as { permit?: boolean }).permit === true;

export const cases = {
  steer: (params: URLSearchParams) => <Steer params={params} {...recorder()} {...steerRecorder()} />,
  "steer-mod-enter": (params: URLSearchParams) => (
    <Steer params={params} submitOn="mod-enter" {...recorder()} {...steerRecorder()} />
  ),
  queue: () => <SendNow onSend={sendRecorder()} />,
};
