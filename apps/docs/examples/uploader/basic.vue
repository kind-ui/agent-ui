<script setup lang="ts">
import type { UploadItem } from "@kind-ui/agent-ui/core";
import { shallowRef } from "vue";
import { Uploader } from "@/components/ui/vue/uploader";

const items = shallowRef<UploadItem[]>([
  { id: "report", name: "quarterly-report.pdf", size: 2_400_000, progress: 42, status: "uploading" },
  { id: "photo", name: "team-offsite.jpg", size: 3_100_000, progress: 100, status: "done" },
  {
    id: "dataset",
    name: "training-set.csv",
    size: 48_000_000,
    progress: 63,
    status: "error",
    error: "Connection lost",
  },
]);

const update = (id: string, change: Partial<UploadItem>) => {
  items.value = items.value.map((item) => (item.id === id ? { ...item, ...change } : item));
};
const add = (files: File[]) => {
  items.value = [
    ...items.value,
    ...files.map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      size: file.size,
      progress: 0,
      status: "queued" as const,
    })),
  ];
};
</script>

<template>
  <Uploader
    aria-label="Uploads"
    :items="items"
    @files="add"
    @cancel="(id) => update(id, { status: 'cancelled' })"
    @retry="(id) => update(id, { status: 'uploading', progress: 0 })"
  />
</template>
