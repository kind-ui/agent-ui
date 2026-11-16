import type { QueueItem } from "@kind-ui/agent-ui";
import type { QueueOptions } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Queue } from "../../../../src/react/queue.js";

const initial: QueueItem[] = [
  { id: "a", status: "pending", title: "Write the migration" },
  { id: "b", status: "pending", title: "Update the docs", description: "README and the API page" },
  { id: "c", status: "pending", title: "Run the tests" },
  { id: "d", status: "complete", title: "Read the schema" },
];

type Call = { type: "reorder" | "remove"; id: string; index?: number; reason: string; source: string };

function Queues({ editable = true, motion }: { editable?: boolean; motion?: QueueOptions["motion"] }) {
  const [items, setItems] = useState(initial);
  useEffect(() => {
    Object.assign(window, {
      kindCalls: [],
      kindQueue: {
        remove: (id: string) => setItems((all) => all.filter((item) => item.id !== id)),
        add: (item: QueueItem) => setItems((all) => [...all, item]),
        complete: (id: string) =>
          setItems((all) =>
            all.map((item) => (item.id === id ? { ...item, status: "complete" as const } : item)),
          ),
      },
    });
  }, []);
  const log = (call: Call) => (window as unknown as { kindCalls: Call[] }).kindCalls.push(call);
  const handlers: Pick<QueueOptions, "onReorder" | "onRemove"> = {
    onReorder: (id, { index, reason, source }) => {
      log({ type: "reorder", id, index, reason, source });
      setItems((all) => {
        const rest = all.filter((item) => item.id !== id);
        rest.splice(index, 0, all.find((item) => item.id === id) as QueueItem);
        return rest;
      });
    },
    onRemove: (id, { reason, source }) => {
      log({ type: "remove", id, reason, source });
      setItems((all) => all.filter((item) => item.id !== id));
    },
  };
  return (
    <div className="flex w-[24rem] flex-col gap-4 p-6">
      <Queue id="queue" label="Queue" items={items} motion={motion} {...(editable ? handlers : {})} />
    </div>
  );
}

export const cases = {
  all: () => <Queues />,
  readonly: () => <Queues editable={false} />,
  reduced: () => <Queues motion="reduced" />,
  none: () => <Queues motion="none" />,
};
