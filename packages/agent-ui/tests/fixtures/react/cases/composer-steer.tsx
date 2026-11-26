import type { QueueItem } from "@kind-ui/agent-ui";
import type { AgentAction } from "@ui-sdk/react/agent";
import { useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { AddMenu } from "../../../../src/react/add-menu.js";
import {
  Composer,
  ComposerInput,
  ComposerSendMenu,
  ComposerStop,
  ComposerSubmit,
} from "../../../../src/react/composer.js";
import { ModelControl } from "../../../../src/react/model-control.js";
import { Queue } from "../../../../src/react/queue.js";
import { addItems } from "../../shared/add-menu.js";
import { queuedMessages, steerHost, steerText } from "../../shared/composer-steer.js";
import { expose } from "../../shared/expose.js";
import { controls } from "../../shared/full-composer.js";
import { levels, models } from "../../shared/model-control.js";

function Steer({ params }: { params: URLSearchParams }) {
  const [running, setRunning] = useState(!params.has("idle"));
  const [items, setItems] = useState<QueueItem[]>(params.has("queue") ? queuedMessages : []);
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const [host] = useState(() =>
    steerHost(params, {
      items: () => itemsRef.current,
      setItems: (next) => flushSync(() => setItems(next)),
      setRunning: (next) => setRunning(next),
    }),
  );
  useEffect(() => expose({ setRunning: (next: boolean) => flushSync(() => setRunning(next)) }), []);
  return (
    <div className="mx-auto max-w-xl p-6">
      <Composer
        aria-label="Message"
        running={running}
        onSubmit={() => undefined}
        onStop={host.onStop}
        onSteer={host.onSteer}
        steerMode={params.get("mode") === "queue" ? "queue" : "steer"}
        defaultValue={{ text: params.has("text") ? steerText : "", tokens: [], attachments: [] }}
      >
        <Queue
          label="Queued messages"
          items={items}
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

export const allow = (step: AgentAction) => !step.confirm || (window as { permit?: boolean }).permit === true;

export const cases = {
  steer: (params: URLSearchParams) => <Steer params={params} />,
  text: () => <Steer params={new URLSearchParams("text")} />,
  docked: () => <Steer params={new URLSearchParams("queue&text")} />,
};
