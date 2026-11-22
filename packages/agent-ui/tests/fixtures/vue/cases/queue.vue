<script lang="ts">
export const variants = ["all", "readonly", "remove-later", "reduced", "none"] as const;
</script>

<script setup lang="ts">
import type { QueueItem } from "@kind-ui/agent-ui";
import type { QueueOptions } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { Queue } from "../../../../src/vue/queue.js";
import { expose } from "../../shared/expose.js";
import { useFlush } from "./flush.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

type Call = { type: "reorder" | "remove"; id: string; index?: number; reason: string; source: string };

const editable = props.variant !== "readonly";
const removeLater = props.variant === "remove-later";
const motion = props.variant === "reduced" ? "reduced" : props.variant === "none" ? "none" : undefined;

const items = shallowRef<QueueItem[]>([
  { id: "a", status: "pending", title: "Write the migration" },
  { id: "b", status: "pending", title: "Update the docs", description: "README and the API page" },
  { id: "c", status: "pending", title: "Run the tests" },
  { id: "d", status: "complete", title: "Read the schema" },
]);
const calls: Call[] = [];
const flush = useFlush();

const onReorder: NonNullable<QueueOptions["onReorder"]> = (id, { index, reason, source }) => {
  calls.push({ type: "reorder", id, index, reason, source });
  const rest = items.value.filter((item) => item.id !== id);
  rest.splice(index, 0, items.value.find((item) => item.id === id) as QueueItem);
  items.value = rest;
};
const onRemove: NonNullable<QueueOptions["onRemove"]> = (id, { reason, source }) => {
  calls.push({ type: "remove", id, reason, source });
  if (!removeLater) items.value = items.value.filter((item) => item.id !== id);
};

onMounted(() =>
  expose({
    kindCalls: calls,
    kindQueue: {
      remove: (id: string) => {
        items.value = items.value.filter((item) => item.id !== id);
      },
      add: (item: QueueItem) => {
        items.value = [...items.value, item];
      },
      refresh: () =>
        flush(() => {
          items.value = [...items.value];
        }),
      renew: (id: string) =>
        flush(() => {
          items.value = items.value.map((item) => (item.id === id ? { ...item } : item));
        }),
      complete: (id: string) => {
        items.value = items.value.map((item) =>
          item.id === id ? { ...item, status: "complete" as const } : item,
        );
      },
    },
  }),
);
</script>

<template>
  <div class="flex w-[24rem] flex-col gap-4 p-6">
    <Queue
      id="queue"
      label="Queue"
      :items="items"
      :motion="motion"
      :on-reorder="editable ? onReorder : undefined"
      :on-remove="editable ? onRemove : undefined"
    />
  </div>
</template>
