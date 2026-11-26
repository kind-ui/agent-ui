<script lang="ts">
import type { AgentAction } from "@ui-sdk/vue/agent";

export const variants = ["steer", "text", "docked"] as const;

// An agent needs a person for every composer action, unless the test permits it.
export const allow = (step: AgentAction) => !step.confirm || (window as { permit?: boolean }).permit === true;
</script>

<script setup lang="ts">
import type { QueueItem } from "@kind-ui/agent-ui";
import { onMounted, shallowRef } from "vue";
import { AddMenu } from "../../../../src/vue/add-menu.js";
import {
  Composer,
  ComposerInput,
  ComposerSendMenu,
  ComposerStop,
  ComposerSubmit,
} from "../../../../src/vue/composer.js";
import { ModelControl } from "../../../../src/vue/model-control.js";
import { Queue } from "../../../../src/vue/queue.js";
import { addItems } from "../../shared/add-menu.js";
import { queuedMessages, steerHost, steerText } from "../../shared/composer-steer.js";
import { expose } from "../../shared/expose.js";
import { controls } from "../../shared/full-composer.js";
import { levels, models } from "../../shared/model-control.js";
import { useFlush } from "./flush.js";

/**
 * A composer while a turn runs. `?text` starts with a draft, `?mode=queue` sends after the turn, `?queue` docks two
 * queued messages, `?folded` folds them, `?idle` has no turn running and `?pending` disables Send now.
 */
const props = defineProps<{ variant: string; params: URLSearchParams }>();

const params =
  props.variant === "text"
    ? new URLSearchParams("text")
    : props.variant === "docked"
      ? new URLSearchParams("queue&text")
      : props.params;

const flush = useFlush();
const running = shallowRef(!params.has("idle"));
const items = shallowRef<QueueItem[]>(params.has("queue") ? queuedMessages : []);
const host = steerHost(params, {
  items: () => items.value,
  setItems: (next) => flush(() => (items.value = next)),
  setRunning: (next) => {
    running.value = next;
  },
});
const steerMode = params.get("mode") === "queue" ? "queue" : "steer";
const defaultValue = { text: params.has("text") ? steerText : "", tokens: [], attachments: [] };
const pending = params.has("pending") ? { sendDisabledReason: "Available after you answer the pending request" } : {};
const ignore = () => undefined;

onMounted(() => expose({ setRunning: (next: boolean) => flush(() => (running.value = next)) }));
</script>

<template>
  <div class="mx-auto max-w-xl p-6">
    <Composer
      aria-label="Message"
      :running="running"
      :on-submit="ignore"
      :on-stop="host.onStop"
      :on-steer="host.onSteer"
      :steer-mode="steerMode"
      :default-value="defaultValue"
    >
      <Queue
        label="Queued messages"
        :items="items"
        :default-open-sections="params.has('folded') ? [] : ['pending']"
        :on-send="host.onSend"
        :on-edit="host.onEdit"
        :on-remove="host.onRemove"
        v-bind="pending"
      />
      <ComposerInput aria-label="Prompt" placeholder="Ask anything" />
      <div :style="controls">
        <AddMenu :items="addItems" :on-action="ignore" />
        <ModelControl :models="models" :levels="levels" default-model="opus" default-effort="high" />
      </div>
      <ComposerSubmit />
      <ComposerStop />
      <ComposerSendMenu />
    </Composer>
  </div>
</template>
