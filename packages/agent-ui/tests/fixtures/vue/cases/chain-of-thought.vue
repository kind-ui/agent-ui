<script lang="ts">
export const variants = ["all", "reduced"] as const;
</script>

<script setup lang="ts">
import type { ChainOfThoughtStep } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import {
  ChainOfThought,
  ChainOfThoughtContent,
  ChainOfThoughtIcon,
  ChainOfThoughtItem,
  ChainOfThoughtItemContent,
  ChainOfThoughtItemTrigger,
  ChainOfThoughtList,
  ChainOfThoughtMeta,
  ChainOfThoughtTitle,
  ChainOfThoughtTrigger,
} from "../../../../src/vue/chain-of-thought.js";
import { expose } from "../../shared/expose.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const initial: ChainOfThoughtStep[] = [
  { id: "plan", status: "complete", title: "Plan the search", durationSeconds: 2 },
  { id: "search", status: "running", title: "Search flights" },
  { id: "compare", status: "pending", title: "Compare fares" },
];
const plain = initial.slice(0, 1);

const motion = props.variant === "reduced" ? "reduced" : undefined;
const steps = shallowRef(initial);
const openStepsChanges: [string[], string][] = [];

const onOpenStepsChange = (openSteps: string[], details: { reason: string }) =>
  openStepsChanges.push([openSteps, details.reason]);

onMounted(() =>
  expose({
    kindOpenStepsChanges: openStepsChanges,
    kindChain: {
      setStatus: (id: string, status: ChainOfThoughtStep["status"]) => {
        steps.value = steps.value.map((step) => (step.id === id ? { ...step, status } : step));
      },
      setStatuses: (statuses: Record<string, ChainOfThoughtStep["status"]>) => {
        steps.value = steps.value.map((step) => ({ ...step, status: statuses[step.id] ?? step.status }));
      },
      append: (step: ChainOfThoughtStep) => {
        steps.value = [...steps.value, step];
      },
      remove: (id: string) => {
        steps.value = steps.value.filter((step) => step.id !== id);
      },
    },
  }),
);
</script>

<template>
  <div class="flex w-[28rem] flex-col gap-4 p-6">
    <ChainOfThought
      id="chain"
      label="Researching flights"
      status="running"
      :duration-seconds="12"
      :steps="steps"
      :motion="motion"
      @open-steps-change="onOpenStepsChange"
    >
      <ChainOfThoughtTrigger>
        <ChainOfThoughtIcon />
        <ChainOfThoughtTitle />
        <ChainOfThoughtMeta />
      </ChainOfThoughtTrigger>
      <ChainOfThoughtContent>
        <ChainOfThoughtList>
          <ChainOfThoughtItem v-for="step in steps" :key="step.id" :value="step.id">
            <ChainOfThoughtItemTrigger />
            <ChainOfThoughtItemContent>
              <p>Details for {{ step.title }}. Collapsed text: kumquat {{ step.id }}.</p>
            </ChainOfThoughtItemContent>
          </ChainOfThoughtItem>
        </ChainOfThoughtList>
      </ChainOfThoughtContent>
    </ChainOfThought>
    <ChainOfThought id="plain" label="Planning the trip" status="complete" :steps="plain" />
  </div>
</template>
