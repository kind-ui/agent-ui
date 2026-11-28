<script lang="ts">
import type { AgentAction } from "@ui-sdk/vue/agent";
import { threadListHost } from "../../shared/thread-list.js";

export const variants = [
  "all",
  "no-confirm",
  "ten",
  "thousand",
  "inbox",
  "nothing-waiting",
  "archived",
] as const;

const handlers = threadListHost();

export const allow = (step: AgentAction) => !step.confirm || handlers.host.permit;
</script>

<script setup lang="ts">
import type { Thread } from "@kind-ui/agent-ui";
import { onMounted, shallowRef } from "vue";
import { ThreadList } from "../../../../src/vue/thread-list.js";
import { expose } from "../../shared/expose.js";
import {
  archivedThreads,
  doneThreads,
  threads as fixed,
  INBOX_NOW,
  inboxThreads,
  manyThreads,
  NOW,
} from "../../shared/thread-list.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const { host, select, newThread, rename, pin, share, remove, loadMore, archive } = handlers;

const sets: Record<string, () => Thread[]> = {
  ten: () => manyThreads(10),
  thousand: () => manyThreads(1000),
  inbox: () => inboxThreads,
  "nothing-waiting": () => doneThreads,
  archived: () => archivedThreads,
};
const initial = sets[props.variant]?.() ?? fixed;
const inbox = ["inbox", "nothing-waiting", "archived"].includes(props.variant);
const view = props.variant === "archived" ? "archived" : undefined;
const confirmDelete = props.variant === "no-confirm" ? false : undefined;

const threads = shallowRef(initial);
const value = shallowRef<string | null>(inbox ? null : (initial[1]?.id ?? null));
const loadStatus = shallowRef<"idle" | "loading" | "error">();

type Update<T> = T | ((previous: T) => T);
const apply = <T,>(previous: T, next: Update<T>) =>
  typeof next === "function" ? (next as (previous: T) => T)(previous) : next;

onMounted(() =>
  expose({
    kindHost: host,
    kindThreadList: {
      setThreads: (next: Update<Thread[]>) => {
        threads.value = apply(threads.value, next);
      },
      setValue: (next: Update<string | null>) => {
        value.value = apply(value.value, next);
      },
      setStatus: (next: Update<"idle" | "loading" | "error" | undefined>) => {
        loadStatus.value = apply(loadStatus.value, next);
      },
      manyThreads,
    },
  }),
);
</script>

<template>
  <div class="flex h-[600px] w-[400px] flex-col p-2">
    <ThreadList
      id="threads"
      :threads="threads"
      :value="value"
      :now="inbox ? INBOX_NOW : NOW"
      time-zone="UTC"
      :group-by="inbox ? 'status' : undefined"
      :view="view"
      :on-archive="inbox ? archive : undefined"
      :on-unarchive="inbox ? archive : undefined"
      :confirm-delete="confirmDelete"
      :has-more="initial.length > 100"
      :status="loadStatus"
      :on-rename="rename"
      :on-delete="remove"
      @select="select"
      @new="newThread"
      @pin-change="pin"
      @share="share"
      @load-more="loadMore"
    />
  </div>
</template>
