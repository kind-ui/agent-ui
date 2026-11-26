<script setup lang="ts">
import type { QueueItem } from "@kind-ui/agent-ui";
import type { ComposerDraft, ComposerSteerDetails } from "@kind-ui/agent-ui/core";
import { ref } from "vue";
import {
  Composer,
  ComposerInput,
  ComposerSendMenu,
  ComposerStop,
  ComposerSubmit,
} from "@/components/ui/vue/composer";
import { Queue } from "@/components/ui/vue/queue";

let next = 1;

const running = ref(true);
const queued = ref<QueueItem[]>([
  { id: "0", status: "pending", title: "Then add a test for the expired session case" },
]);
const drop = (id: string) => {
  queued.value = queued.value.filter((item) => item.id !== id);
};
const steer = (draft: ComposerDraft, { mode }: ComposerSteerDetails) => {
  if (mode === "queue")
    queued.value = [...queued.value, { id: String(next++), status: "pending", title: draft.text }];
};
</script>

<template>
  <Composer
    aria-label="Message"
    :running="running"
    :on-submit="() => (running = true)"
    @stop="running = false"
    @steer="steer"
  >
    <Queue label="Queued messages" :items="queued" @send="drop" @edit="drop" @remove="drop" />
    <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
    <ComposerSubmit />
    <ComposerStop />
    <ComposerSendMenu />
  </Composer>
</template>
