<script setup lang="ts">
import type { Thread } from "@kind-ui/agent-ui";
import { shallowRef } from "vue";
import { ThreadList } from "@/components/ui/vue/thread-list";

const now = "2026-11-18T12:00:00Z";

const initialRuns: Thread[] = (
  [
    {
      id: "auth",
      title: "Refactor the auth module",
      updatedAt: "2026-11-18T11:00:00Z",
      status: "running",
      progress: 0.45,
      summary: "+120 −8 in 4 files",
    },
    {
      id: "billing",
      title: "Migrate the billing tables",
      updatedAt: "2026-11-18T10:00:00Z",
      status: "awaiting-input",
      summary: "Waiting to run 3 migrations",
    },
    {
      id: "changelog",
      title: "Write the changelog",
      updatedAt: "2026-11-18T09:30:00Z",
      status: "complete",
      unread: true,
      summary: "+48 in 1 file",
    },
    { id: "deps", title: "Update dependencies", updatedAt: "2026-11-18T09:00:00Z", status: "queued" },
    {
      id: "checkout",
      title: "Fix the flaky checkout test",
      updatedAt: "2026-11-18T08:00:00Z",
      status: "error",
      summary: "Failed after 3 attempts",
    },
    {
      id: "docs",
      title: "Translate the docs",
      updatedAt: "2026-11-17T18:00:00Z",
      status: "complete",
      summary: "+310 in 12 files",
    },
    { id: "logging", title: "Audit the logging", updatedAt: "2026-11-16T12:00:00Z", status: "complete" },
  ] satisfies Thread[]
).map((run) => ({ ...run, href: `#${run.id}` }));

const runs = shallowRef(initialRuns);

const update = (id: string, change: Partial<Thread>) => {
  runs.value = runs.value.map((run) => (run.id === id ? { ...run, ...change } : run));
};

function onSelect(id: string, details: { cancel(): void }) {
  details.cancel();
  update(id, { unread: false });
}

const onReadChange = (id: string, { read }: { read: boolean }) => update(id, { unread: !read });

const onArchive = (id: string) => {
  runs.value = runs.value.filter((run) => run.id !== id);
};
</script>

<template>
  <div :style="{ height: '420px', width: '300px' }">
    <ThreadList
      label="Runs"
      :threads="runs"
      :now="now"
      group-by="status"
      :group-labels="{ done: 'Finished' }"
      :on-archive="onArchive"
      @select="onSelect"
      @read-change="onReadChange"
    />
  </div>
</template>
