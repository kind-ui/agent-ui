import type { QueueItem } from "@kind-ui/agent-ui";
import type { QueueOptions } from "@kind-ui/agent-ui/core";
import { createSignal, flush, onSettled } from "solid-js";
import { Queue } from "../../../../src/solid/queue.js";
import { expose } from "../../shared/expose.js";

const initial: QueueItem[] = [
  { id: "a", status: "pending", title: "Write the migration" },
  { id: "b", status: "pending", title: "Update the docs", description: "README and the API page" },
  { id: "c", status: "pending", title: "Run the tests" },
  { id: "d", status: "complete", title: "Read the schema" },
];

type Call = { type: "reorder" | "remove"; id: string; index?: number; reason: string; source: string };

function Queues(props: { editable?: boolean; removeLater?: boolean; motion?: QueueOptions["motion"] }) {
  const [items, setItems] = createSignal(initial);
  onSettled(() =>
    expose({
      kindCalls: [],
      kindQueue: {
        remove: (id: string) => setItems((all) => all.filter((item) => item.id !== id)),
        add: (item: QueueItem) => setItems((all) => [...all, item]),
        refresh: () => {
          setItems((all) => [...all]);
          flush();
        },
        renew: (id: string) => {
          setItems((all) => all.map((item) => (item.id === id ? { ...item } : item)));
          flush();
        },
        complete: (id: string) =>
          setItems((all) =>
            all.map((item) => (item.id === id ? { ...item, status: "complete" as const } : item)),
          ),
      },
    }),
  );
  const log = (call: Call) => (window as unknown as { kindCalls: Call[] }).kindCalls.push(call);
  const onReorder: QueueOptions["onReorder"] = (id, { index, reason, source }) => {
    log({ type: "reorder", id, index, reason, source });
    setItems((all) => {
      const rest = all.filter((item) => item.id !== id);
      rest.splice(index, 0, all.find((item) => item.id === id) as QueueItem);
      return rest;
    });
  };
  const onRemove: QueueOptions["onRemove"] = (id, { reason, source }) => {
    log({ type: "remove", id, reason, source });
    if (!props.removeLater) setItems((all) => all.filter((item) => item.id !== id));
  };
  const editable = () => props.editable ?? true;
  return (
    <div class="flex w-[24rem] flex-col gap-4 p-6">
      <Queue
        id="queue"
        label="Queue"
        items={items()}
        motion={props.motion}
        onReorder={editable() ? onReorder : undefined}
        onRemove={editable() ? onRemove : undefined}
      />
    </div>
  );
}

export const cases = {
  all: () => <Queues />,
  readonly: () => <Queues editable={false} />,
  "remove-later": () => <Queues removeLater />,
  reduced: () => <Queues motion="reduced" />,
  none: () => <Queues motion="none" />,
};
