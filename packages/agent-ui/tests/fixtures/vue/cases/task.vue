<script lang="ts">
export const variants = ["all", "reduced"] as const;
</script>

<script setup lang="ts">
import type { TaskOptions } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { Task } from "../../../../src/vue/task.js";
import { expose } from "../../shared/expose.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

type Item = NonNullable<TaskOptions["items"]>[number];

const items = shallowRef<Item[]>([
  { id: "schema", status: "complete", title: "Read the schema", files: ["db/schema.sql"] },
  { id: "migrate", status: "running", title: "Write the migration", files: ["db/migrations/0042_users.sql"] },
  { id: "tests", status: "pending", title: "Run the tests" },
]);
const motion = props.variant === "reduced" ? "reduced" : undefined;

onMounted(() =>
  expose({
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
    <Task id="task" label="Migrating the users table" :items="items" :motion="motion" />
  </div>
</template>
