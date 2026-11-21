<script lang="ts">
export const variants = ["all"] as const;
</script>

<script setup lang="ts">
import type { ReasoningOptions } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { Reasoning } from "../../../../src/vue/reasoning.js";
import { expose } from "../../shared/expose.js";

defineProps<{ variant: string; params: URLSearchParams }>();

type Row = Pick<ReasoningOptions, "status" | "durationSeconds" | "motion" | "label"> & { text: string };

const rows = shallowRef<Record<string, Row>>({
  live: { status: "running", text: "" },
  cached: { status: "pending", text: "Answered from the cache." },
  done: {
    status: "complete",
    durationSeconds: 3,
    text: "Compared **three** sources. Collapsed text: kumquat.",
  },
});

const update = (id: string, next: (row: Row) => Row) => {
  rows.value = { ...rows.value, [id]: next(rows.value[id] as Row) };
};

onMounted(() =>
  expose({
    kindReasoning: {
      set: (id: string, next: Partial<Row>) => update(id, (row) => ({ ...row, ...next })),
      append: (id: string, chunk: string) => update(id, (row) => ({ ...row, text: `${row.text}${chunk}` })),
    },
  }),
);
</script>

<template>
  <div class="flex w-96 flex-col gap-4 p-6">
    <Reasoning v-for="(row, id) in rows" :id="id" :key="id" v-bind="row" />
  </div>
</template>
