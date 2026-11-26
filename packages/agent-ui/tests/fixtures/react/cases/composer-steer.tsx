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

function Steer({ params, submitOn }: { params: URLSearchParams; submitOn?: "enter" | "mod-enter" }) {
  const [running, setRunning] = useState(!params.has("idle"));
  const [{ onSubmit }] = useState(recorder);
  const [{ onSteer, onStop }] = useState(steerRecorder);
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

function SendNow() {
  const [items, setItems] = useState<QueueItem[]>(steerQueue);
  const [onSend] = useState(sendRecorder);
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
  steer: (params: URLSearchParams) => <Steer params={params} />,
  "steer-mod-enter": (params: URLSearchParams) => <Steer params={params} submitOn="mod-enter" />,
  queue: () => <SendNow />,
};
