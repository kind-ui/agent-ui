<script setup lang="ts">
import { shallowRef } from "vue";
import { Queue } from "@/components/ui/vue/queue";

const followUps = [
  { id: "logs", status: "pending" as const, title: "Also check the server logs" },
  { id: "pr", status: "pending" as const, title: "Then open a pull request" },
];

const items = shallowRef(followUps);

const drop = (id: string) => {
  items.value = items.value.filter((item) => item.id !== id);
};
// Your app steers the running turn with the item, then drops it from the queue.
const onSend = (id: string) =>
  new Promise<void>((resolve) =>
    setTimeout(() => {
      drop(id);
      resolve();
    }, 600),
  );
</script>

<template>
  <Queue label="Queued follow-ups" :items="items" @send="onSend" @remove="drop" />
</template>
