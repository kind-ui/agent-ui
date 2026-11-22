<script module lang="ts">
  export const variants = ["all", "readonly", "remove-later", "reduced", "none"];
</script>

<script lang="ts">
  import type { QueueItem } from "@kind-ui/agent-ui";
  import type { QueueOptions } from "@kind-ui/agent-ui/core";
  import { flushSync } from "svelte";
  import { Queue } from "../../../../src/svelte/queue/index.js";
  import { expose } from "../../shared/expose.js";

  type Call = { type: "reorder" | "remove"; id: string; index?: number; reason: string; source: string };

  let { variant }: { variant: string; params: URLSearchParams } = $props();

  const editable = $derived(variant !== "readonly");
  const removeLater = $derived(variant === "remove-later");
  const motion = $derived<QueueOptions["motion"]>(
    variant === "reduced" ? "reduced" : variant === "none" ? "none" : undefined,
  );

  let items: QueueItem[] = $state.raw([
    { id: "a", status: "pending", title: "Write the migration" },
    { id: "b", status: "pending", title: "Update the docs", description: "README and the API page" },
    { id: "c", status: "pending", title: "Run the tests" },
    { id: "d", status: "complete", title: "Read the schema" },
  ]);

  const calls: Call[] = [];
  expose({
    kindCalls: calls,
    kindQueue: {
      remove: (id: string) => (items = items.filter((item) => item.id !== id)),
      add: (item: QueueItem) => (items = [...items, item]),
      refresh: () => flushSync(() => (items = [...items])),
      renew: (id: string) => flushSync(() => (items = items.map((item) => (item.id === id ? { ...item } : item)))),
      complete: (id: string) =>
        (items = items.map((item) => (item.id === id ? { ...item, status: "complete" as const } : item))),
    },
  });

  const onReorder: QueueOptions["onReorder"] = (id, { index, reason, source }) => {
    calls.push({ type: "reorder", id, index, reason, source });
    const rest = items.filter((item) => item.id !== id);
    rest.splice(index, 0, items.find((item) => item.id === id) as QueueItem);
    items = rest;
  };
  const onRemove: QueueOptions["onRemove"] = (id, { reason, source }) => {
    calls.push({ type: "remove", id, reason, source });
    if (!removeLater) items = items.filter((item) => item.id !== id);
  };
</script>

<div class="flex w-[24rem] flex-col gap-4 p-6">
  <Queue
    id="queue"
    label="Queue"
    {items}
    {motion}
    onReorder={editable ? onReorder : undefined}
    onRemove={editable ? onRemove : undefined}
  />
</div>
