import type { PlanOptions } from "@kind-ui/agent-ui/core";
import { createSignal, onSettled } from "solid-js";
import { Plan } from "../../../../src/solid/plan.js";
import { expose } from "../../shared/expose.js";

type Item = NonNullable<PlanOptions["items"]>[number];

const initial: Item[] = [
  { id: "audit", status: "complete", title: "Audit the current schema" },
  {
    id: "migrate",
    status: "running",
    title: "Add the new columns",
    description: "Nullable first, so the deploy needs no downtime.",
  },
  { id: "backfill", status: "pending", title: "Backfill existing rows" },
  { id: "cleanup", status: "skipped", title: "Drop the old columns" },
  { id: "verify", status: "pending", title: "Verify the counts" },
];

const quickItems = initial.slice(0, 2);
const readonlyItems = initial.slice(0, 1);

const accepts: { resolve(): void; reject(): void }[] = [];

function Plans(props: { motion?: PlanOptions["motion"] }) {
  const [items, setItems] = createSignal(initial);
  const [accepting, setAccepting] = createSignal(true);
  onSettled(() =>
    expose({
      kindAccepts: accepts,
      kindStopAccepting: () => setAccepting(false),
      kindItems: {
        setStatus: (id: string, status: Item["status"]) =>
          setItems((all) => all.map((item) => (item.id === id ? { ...item, status } : item))),
        append: (item: Item) => setItems((all) => [...all, item]),
        remove: (id: string) => setItems((all) => all.filter((item) => item.id !== id)),
      },
    }),
  );
  return (
    <div class="flex w-[28rem] flex-col gap-4 p-6">
      <Plan
        id="plan"
        label="Migration plan"
        status="awaiting-input"
        items={items()}
        motion={props.motion}
        onAccept={
          accepting()
            ? () => new Promise<void>((resolve, reject) => accepts.push({ resolve, reject }))
            : undefined
        }
      />
      <Plan id="quick" label="Quick plan" items={quickItems} agentConfirm={false} onAccept={() => {}} />
      <Plan id="readonly" label="Read-only plan" items={readonlyItems} />
    </div>
  );
}

export const cases = { all: () => <Plans />, reduced: () => <Plans motion="reduced" /> };
