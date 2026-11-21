<script setup lang="ts">
import type { Thread } from "@kind-ui/agent-ui";
import { ref, shallowRef } from "vue";
import { ThreadList } from "@/components/ui/vue/thread-list";

const now = "2026-11-18T12:00:00Z";

const initialThreads: Thread[] = (
  [
    { id: "release", title: "Release checklist", updatedAt: "2026-11-10T09:00:00Z", pinned: true },
    { id: "style", title: "Style guide notes", updatedAt: "2026-10-02T15:00:00Z", pinned: true },
    { id: "login", title: "Fix the login redirect", updatedAt: "2026-11-18T10:30:00Z", status: "running" },
    { id: "launch", title: "Draft the launch post", updatedAt: "2026-11-18T08:00:00Z", unread: true },
    { id: "query", title: "Speed up the search query", updatedAt: "2026-11-18T07:15:00Z" },
    { id: "build", title: "Why the build is slow", updatedAt: "2026-11-17T16:00:00Z" },
    { id: "tests", title: "Flaky checkout tests", updatedAt: "2026-11-17T09:20:00Z" },
    { id: "offsite", title: "Plan the offsite", updatedAt: "2026-11-14T12:00:00Z" },
    { id: "pricing", title: "Compare pricing tiers", updatedAt: "2026-11-13T18:40:00Z" },
    { id: "onboarding", title: "Onboarding email copy", updatedAt: "2026-11-12T11:00:00Z" },
    { id: "schema", title: "Migrate the user schema", updatedAt: "2026-09-21T14:00:00Z" },
    { id: "retro", title: "Sprint retro summary", updatedAt: "2026-09-08T10:00:00Z" },
  ] satisfies Thread[]
).map((thread) => ({ ...thread, href: `#${thread.id}` }));

const threads = shallowRef(initialThreads);
const current = ref("login");

const update = (id: string, change: Partial<Thread>) => {
  threads.value = threads.value.map((thread) => (thread.id === id ? { ...thread, ...change } : thread));
};

function onSelect(id: string, details: { cancel(): void }) {
  details.cancel();
  current.value = id;
  update(id, { unread: false });
}

function onNew() {
  const id = crypto.randomUUID();
  threads.value = [{ id, title: "New chat", updatedAt: now, href: `#${id}` }, ...threads.value];
  current.value = id;
}

const onRename = (id: string, { title }: { title: string }) => update(id, { title });
const onDelete = (id: string) => {
  threads.value = threads.value.filter((thread) => thread.id !== id);
};
</script>

<template>
  <div :style="{ height: '420px', width: '280px' }">
    <ThreadList
      :threads="threads"
      :value="current"
      :now="now"
      :on-rename="onRename"
      :on-delete="onDelete"
      @select="onSelect"
      @new="onNew"
      @pin-change="(id: string, { pinned }: { pinned: boolean }) => update(id, { pinned })"
    />
  </div>
</template>
