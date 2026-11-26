<script lang="ts">
import type { AgentAction } from "@ui-sdk/vue/agent";

export const variants = ["steer", "steer-mod-enter", "queue"] as const;

// An agent needs a person for every composer action, unless the test permits it.
export const allow = (step: AgentAction) => !step.confirm || (window as { permit?: boolean }).permit === true;
</script>

<script setup lang="ts">
import type { QueueItem } from "@kind-ui/agent-ui";
import type { ComposerSteerMode } from "@kind-ui/agent-ui/core";
import { computed, onMounted, shallowRef } from "vue";
import {
  Composer,
  ComposerAttach,
  ComposerInput,
  ComposerSteerMenu,
  ComposerStop,
  ComposerSubmit,
} from "../../../../src/vue/composer.js";
import { Queue } from "../../../../src/vue/queue.js";
import { recorder } from "../../shared/composer.js";
import { sendRecorder, steerQueue, steerRecorder } from "../../shared/composer-steer.js";
import { expose } from "../../shared/expose.js";
import { useFlush } from "./flush.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const queue = props.variant === "queue";
const flush = useFlush();
const running = shallowRef(!props.params.has("idle"));
const { onSubmit } = queue ? { onSubmit: undefined } : recorder();
const { onSteer, onStop } = queue ? { onSteer: undefined, onStop: undefined } : steerRecorder();
const onSend = queue ? sendRecorder() : undefined;
const items = shallowRef<QueueItem[]>(steerQueue);

const options = computed(() => ({
  ...(props.params.has("no-steer") ? {} : { onSteer }),
  ...(props.params.has("mode") ? { steerMode: props.params.get("mode") as ComposerSteerMode } : {}),
}));

onMounted(() =>
  expose(
    queue
      ? {
          kindQueue: {
            remove: (id: string) => {
              items.value = items.value.filter((item) => item.id !== id);
            },
          },
        }
      : {
          setRunning: (next: boolean) =>
            flush(() => {
              running.value = next;
            }),
        },
  ),
);
</script>

<template>
  <div v-if="queue" class="flex w-[24rem] flex-col gap-4 p-6">
    <Queue label="Queue" :items="items" :on-send="onSend" />
  </div>
  <div v-else class="mx-auto max-w-xl p-6">
    <Composer
      aria-label="Message"
      :submit-on="variant === 'steer-mod-enter' ? 'mod-enter' : 'enter'"
      :running="running"
      :on-submit="onSubmit"
      :on-stop="onStop"
      v-bind="options"
    >
      <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
      <ComposerAttach />
      <ComposerSubmit />
      <ComposerSteerMenu />
      <ComposerStop />
    </Composer>
  </div>
</template>
