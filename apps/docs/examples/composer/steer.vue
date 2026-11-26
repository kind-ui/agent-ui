<script setup lang="ts">
import type { ComposerDraft, ComposerSteerDetails } from "@kind-ui/agent-ui/core";
import { shallowRef } from "vue";
import {
  Composer,
  ComposerInput,
  ComposerSteerMenu,
  ComposerStop,
  ComposerSubmit,
} from "@/components/ui/vue/composer";
import { Queue } from "@/components/ui/vue/queue";

type Queued = { id: string; status: "pending"; title: string };

const running = shallowRef(false);
const queued = shallowRef<Queued[]>([]);
let timer: ReturnType<typeof setTimeout> | undefined;

const run = () => {
  running.value = true;
  clearTimeout(timer);
  timer = setTimeout(() => {
    running.value = false;
  }, 8000);
};
const stop = () => {
  running.value = false;
};
const drop = (id: string) => {
  queued.value = queued.value.filter((item) => item.id !== id);
};
const onSteer = (draft: ComposerDraft, { mode }: ComposerSteerDetails) => {
  if (mode === "queue")
    queued.value = [...queued.value, { id: crypto.randomUUID(), status: "pending", title: draft.text }];
};
</script>

<template>
  <div class="flex w-full flex-col gap-3">
    <!-- Sending now steers the running turn with the follow-up. -->
    <Queue v-if="queued.length > 0" label="Queued follow-ups" :items="queued" @remove="drop" @send="drop" />
    <Composer aria-label="Message" :running="running" @submit="run" @stop="stop" @steer="onSteer">
      <ComposerInput aria-label="Prompt" placeholder="Send, then steer while it runs" />
      <ComposerSubmit />
      <ComposerSteerMenu />
      <ComposerStop />
    </Composer>
  </div>
</template>
