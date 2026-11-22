<script setup lang="ts">
import { shallowRef } from "vue";
import { Attachments } from "@/components/ui/vue/attachments";

const files = [
  { id: "spec", name: "retry-spec.pdf", size: 482_000, mediaType: "application/pdf" },
  { id: "notes", name: "notes.md", size: 812, mediaType: "text/markdown" },
  { id: "fix", name: "retry.ts", size: 3_400 },
  { id: "dump", name: "heap.zip", size: 92_000_000, mediaType: "application/zip", error: "size" as const },
];

const items = shallowRef(files);
const remove = (id: string) => {
  items.value = items.value.filter((item) => item.id !== id);
};
</script>

<template>
  <Attachments aria-label="Attachments" :items="items" @remove="remove" />
</template>
