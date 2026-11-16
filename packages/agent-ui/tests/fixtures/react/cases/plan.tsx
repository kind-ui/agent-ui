import type { PlanOptions } from "@kind-ui/agent-ui/core";
import { useEffect, useState } from "react";
import { Plan } from "../../../../src/react/plan.js";

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

// Each accept waits until the test settles it.
const accepts: { resolve(): void; reject(): void }[] = [];

function Plans({ motion }: { motion?: PlanOptions["motion"] }) {
  const [items, setItems] = useState(initial);
  const [accepting, setAccepting] = useState(true);
  useEffect(() => {
    Object.assign(window, {
      kindAccepts: accepts,
      kindStopAccepting: () => setAccepting(false),
      kindItems: {
        setStatus: (id: string, status: Item["status"]) =>
          setItems((all) => all.map((item) => (item.id === id ? { ...item, status } : item))),
        append: (item: Item) => setItems((all) => [...all, item]),
        remove: (id: string) => setItems((all) => all.filter((item) => item.id !== id)),
      },
    });
  }, []);
  return (
    <div className="flex w-[28rem] flex-col gap-4 p-6">
      <Plan
        id="plan"
        label="Migration plan"
        status="awaiting-input"
        items={items}
        motion={motion}
        onAccept={
          accepting
            ? () => new Promise<void>((resolve, reject) => accepts.push({ resolve, reject }))
            : undefined
        }
      />
      <Plan
        id="quick"
        label="Quick plan"
        items={initial.slice(0, 2)}
        agentConfirm={false}
        onAccept={() => {}}
      />
      <Plan id="readonly" label="Read-only plan" items={initial.slice(0, 1)} />
    </div>
  );
}

export const cases = { all: () => <Plans />, reduced: () => <Plans motion="reduced" /> };
