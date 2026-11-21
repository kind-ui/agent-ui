<script lang="ts">
export const variants = ["all", "reduced"] as const;
</script>

<script setup lang="ts">
import type { PlanOptions } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { Plan } from "../../../../src/vue/plan.js";
import { expose } from "../../shared/expose.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

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

const motion = props.variant === "reduced" ? "reduced" : undefined;
const items = shallowRef(initial);
const accepting = shallowRef(true);
const accepts: { resolve(): void; reject(): void }[] = [];

const accept = () => new Promise<void>((resolve, reject) => accepts.push({ resolve, reject }));
const acceptQuick = () => {};

onMounted(() =>
  expose({
    kindAccepts: accepts,
    kindStopAccepting: () => {
      accepting.value = false;
    },
    kindItems: {
      setStatus: (id: string, status: Item["status"]) => {
        items.value = items.value.map((item) => (item.id === id ? { ...item, status } : item));
      },
      append: (item: Item) => {
        items.value = [...items.value, item];
      },
      remove: (id: string) => {
        items.value = items.value.filter((item) => item.id !== id);
      },
    },
  }),
);
</script>

<template>
  <div class="flex w-[28rem] flex-col gap-4 p-6">
    <Plan
      id="plan"
      label="Migration plan"
      status="awaiting-input"
      :items="items"
      :motion="motion"
      :on-accept="accepting ? accept : undefined"
    />
    <Plan id="quick" label="Quick plan" :items="quickItems" :agent-confirm="false" @accept="acceptQuick" />
    <Plan id="readonly" label="Read-only plan" :items="readonlyItems" />
  </div>
</template>
