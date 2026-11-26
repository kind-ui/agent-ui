import type { QueueItem } from "@kind-ui/agent-ui";
import type { AgentAction } from "@ui-sdk/solid/agent";
import { createSignal, flush, onSettled } from "solid-js";
import { AddMenu } from "../../../../src/solid/add-menu.js";
import {
  Composer,
  ComposerInput,
  ComposerSendMenu,
  ComposerStop,
  ComposerSubmit,
} from "../../../../src/solid/composer.js";
import { ModelControl } from "../../../../src/solid/model-control.js";
import { Queue } from "../../../../src/solid/queue.js";
import { addItems } from "../../shared/add-menu.js";
import { queuedMessages, steerHost, steerText } from "../../shared/composer-steer.js";
import { expose } from "../../shared/expose.js";
import { levels, models } from "../../shared/model-control.js";

// `shared/full-composer.ts`'s `controls`, in the kebab-case keys a Solid `style` takes.
const controls = {
  "grid-area": "attach",
  display: "flex",
  "flex-wrap": "wrap",
  "align-items": "center",
  gap: "6px",
  "min-width": "0",
};

/**
 * A composer while a turn runs. `?text` starts with a draft, `?mode=queue` sends after the turn, `?queue` docks two
 * queued messages, `?folded` folds them, `?idle` has no turn running and `?pending` disables Send now.
 */
function Steer(props: { params: URLSearchParams }) {
  const params = props.params;
  const [running, setRunning] = createSignal(!params.has("idle"));
  const [items, setItems] = createSignal<QueueItem[]>(params.has("queue") ? queuedMessages : []);
  const host = steerHost(params, {
    items,
    setItems: (next) => {
      setItems(next);
      flush();
    },
    setRunning: (next) => setRunning(next),
  });
  onSettled(() => {
    expose({
      setRunning: (next: boolean) => {
        setRunning(next);
        flush();
      },
    });
  });
  return (
    <div class="mx-auto max-w-xl p-6">
      <Composer
        aria-label="Message"
        running={running()}
        onSubmit={() => undefined}
        onStop={host.onStop}
        onSteer={host.onSteer}
        steerMode={params.get("mode") === "queue" ? "queue" : "steer"}
        defaultValue={{ text: params.has("text") ? steerText : "", tokens: [], attachments: [] }}
      >
        <Queue
          label="Queued messages"
          items={items()}
          defaultOpenSections={params.has("folded") ? [] : ["pending"]}
          onSend={host.onSend}
          onEdit={host.onEdit}
          onRemove={host.onRemove}
          {...(params.has("pending")
            ? { sendDisabledReason: "Available after you answer the pending request" }
            : {})}
        />
        <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
        <div style={controls}>
          <AddMenu items={addItems} onAction={() => undefined} />
          <ModelControl models={models} levels={levels} defaultModel="opus" defaultEffort="high" />
        </div>
        <ComposerSubmit />
        <ComposerStop />
        <ComposerSendMenu />
      </Composer>
    </div>
  );
}

// An agent needs a person for every composer action, unless the test permits it.
export const allow = (step: AgentAction) => !step.confirm || (window as { permit?: boolean }).permit === true;

export const cases = {
  steer: (params: URLSearchParams) => <Steer params={params} />,
  text: () => <Steer params={new URLSearchParams("text")} />,
  docked: () => <Steer params={new URLSearchParams("queue&text")} />,
};
