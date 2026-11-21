<script setup lang="ts">
import { ref } from "vue";
import { Queue } from "@/components/ui/vue/queue";

const todo = [
  { id: "limits", status: "pending" as const, title: "Add tests for the limits" },
  {
    id: "docs",
    status: "pending" as const,
    title: "Document the rate limit headers",
    description: "README and the API reference",
  },
  { id: "changelog", status: "pending" as const, title: "Write the changelog entry" },
  { id: "middleware", status: "complete" as const, title: "Write the rate limit middleware" },
  { id: "read", status: "complete" as const, title: "Read the request handlers" },
];

const items = ref(todo);

const onReorder = (id: string, { index }: { index: number }) => {
  const moved = items.value.find((item) => item.id === id);
  if (!moved) return;
  const rest = items.value.filter((item) => item !== moved);
  items.value = [...rest.slice(0, index), moved, ...rest.slice(index)];
};
const onRemove = (id: string) => {
  items.value = items.value.filter((item) => item.id !== id);
};
</script>

<template>
  <Queue label="Agent queue" :items="items" @reorder="onReorder" @remove="onRemove" />
</template>
