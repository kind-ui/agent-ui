<script setup lang="ts">
import type { QueueItem } from "@kind-ui/agent-ui";
import { shallowRef } from "vue";
import { ChainOfThought } from "../../../../../src/vue/chain-of-thought.js";
import { Plan } from "../../../../../src/vue/plan.js";
import { Queue } from "../../../../../src/vue/queue.js";
import { Reasoning } from "../../../../../src/vue/reasoning.js";
import { Status } from "../../../../../src/vue/status.js";
import { Subagent } from "../../../../../src/vue/subagent.js";
import { Task } from "../../../../../src/vue/task.js";
import { Tool } from "../../../../../src/vue/tool.js";
import {
  chainSteps,
  moveItem,
  planItems,
  queueItems,
  taskItems,
  thoughts,
  toolCalls,
} from "../../../shared/agent.js";
import { type Details, host } from "./host.js";

defineProps<{ confirm: boolean }>();

const queue = shallowRef<readonly QueueItem[]>(queueItems);
const reorder = (id: string, details: Details & { index: number }) => {
  if (host.change("queue", details)) queue.value = moveItem(queue.value, id, details.index);
};
const remove = (id: string) => {
  host.calls.push(`remove:${id}`);
  queue.value = queue.value.filter((item) => item.id !== id);
};
</script>

<template>
  <div class="flex w-[40rem] flex-col gap-8 p-6">
    <section data-case="status">
      <Status id="status" status="running" label="Deploying" />
    </section>
    <section data-case="reasoning">
      <Reasoning
        id="reasoning"
        status="complete"
        :duration-seconds="3"
        :text="thoughts"
        :onOpenChange="(_open: boolean, details: Details) => host.change('reasoning', details)"
      />
    </section>
    <section data-case="tool" class="flex flex-col gap-2">
      <Tool v-for="call in toolCalls" :id="call.toolCallId" :key="call.toolCallId" :call="call" />
    </section>
    <section data-case="chain-of-thought">
      <ChainOfThought
        id="chain"
        label="Researching retries"
        status="complete"
        :steps="chainSteps"
        :onOpenStepsChange="(_steps: unknown, details: Details) => host.change('chain', details)"
      />
    </section>
    <section data-case="task">
      <Task id="task" label="Patching the client" :items="taskItems" />
    </section>
    <section data-case="plan">
      <Plan
        id="plan"
        label="Retry plan"
        status="awaiting-input"
        :items="planItems"
        :agent-confirm="confirm"
        :onAccept="() => void host.calls.push('accept')"
      />
    </section>
    <section data-case="subagent">
      <Subagent
        id="subagent"
        agent-name="Code reviewer"
        status="running"
        :agent-confirm="confirm"
        :onCancel="() => void host.calls.push('cancel')"
      />
    </section>
    <section data-case="queue">
      <Queue id="queue" label="Queue" :items="queue" :onReorder="reorder" :onRemove="remove" />
    </section>
  </div>
</template>
