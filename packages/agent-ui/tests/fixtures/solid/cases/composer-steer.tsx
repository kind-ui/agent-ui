import type { QueueItem } from "@kind-ui/agent-ui";
import type { ComposerSteerMode } from "@kind-ui/agent-ui/core";
import type { AgentAction } from "@ui-sdk/solid/agent";
import { createSignal, flush, onSettled } from "solid-js";
import {
  Composer,
  ComposerAttach,
  ComposerInput,
  ComposerSteerMenu,
  ComposerStop,
  ComposerSubmit,
} from "../../../../src/solid/composer.js";
import { Queue } from "../../../../src/solid/queue.js";
import { recorder } from "../../shared/composer.js";
import { sendRecorder, steerQueue, steerRecorder } from "../../shared/composer-steer.js";
import { expose } from "../../shared/expose.js";

function Steer(props: { params: URLSearchParams; submitOn?: "enter" | "mod-enter" }) {
  const [running, setRunning] = createSignal(!props.params.has("idle"));
  const { onSubmit } = recorder();
  const { onSteer, onStop } = steerRecorder();
  onSettled(() =>
    expose({
      setRunning: (next: boolean) => {
        setRunning(next);
        flush();
      },
    }),
  );
  return (
    <div class="mx-auto max-w-xl p-6">
      <Composer
        aria-label="Message"
        submitOn={props.submitOn ?? "enter"}
        running={running()}
        onSubmit={onSubmit}
        onStop={onStop}
        {...(props.params.has("no-steer") ? {} : { onSteer })}
        {...(props.params.has("mode") ? { steerMode: props.params.get("mode") as ComposerSteerMode } : {})}
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
  const [items, setItems] = createSignal<QueueItem[]>(steerQueue);
  const onSend = sendRecorder();
  onSettled(() =>
    expose({
      kindQueue: { remove: (id: string) => setItems((all) => all.filter((item) => item.id !== id)) },
    }),
  );
  return (
    <div class="flex w-[24rem] flex-col gap-4 p-6">
      <Queue label="Queue" items={items()} onSend={onSend} />
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
