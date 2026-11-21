<script module lang="ts">
  export const variants = ["all", "reduced"];

  const accepts: { resolve(): void; reject(): void }[] = [];
</script>

<script lang="ts">
  import type { PlanOptions } from "@kind-ui/agent-ui/core";
  import { Plan } from "../../../../src/svelte/plan/index.js";
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

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  let items: Item[] = $state.raw(initial);
  let accepting = $state(true);

  const onAccept = () => new Promise<void>((resolve, reject) => accepts.push({ resolve, reject }));

  expose({
    kindAccepts: accepts,
    kindStopAccepting: () => (accepting = false),
    kindItems: {
      setStatus: (id: string, status: Item["status"]) =>
        (items = items.map((item) => (item.id === id ? { ...item, status } : item))),
      append: (item: Item) => (items = [...items, item]),
      remove: (id: string) => (items = items.filter((item) => item.id !== id)),
    },
  });
</script>

<div class="flex w-[28rem] flex-col gap-4 p-6">
  <Plan
    id="plan"
    label="Migration plan"
    status="awaiting-input"
    {items}
    motion={variant === "reduced" ? "reduced" : undefined}
    onAccept={accepting ? onAccept : undefined}
  />
  <Plan id="quick" label="Quick plan" items={quickItems} agentConfirm={false} onAccept={() => {}} />
  <Plan id="readonly" label="Read-only plan" items={readonlyItems} />
</div>
