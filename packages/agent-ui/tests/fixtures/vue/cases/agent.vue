<script lang="ts">
import type { AgentAction } from "@ui-sdk/vue/agent";
import { host } from "./agent/host.js";

export const variants = ["all", "wave-2", "wave-3", "wave-4", "wave-5", "wave-6"] as const;

export const allow = (step: AgentAction) => !step.confirm || host.permit;
</script>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import Activity from "./agent/Activity.vue";
import Artifacts from "./agent/Artifacts.vue";
import Composing from "./agent/Composing.vue";
import Foundation from "./agent/Foundation.vue";
import HumanInput from "./agent/HumanInput.vue";
import Shell from "./agent/Shell.vue";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const wave = computed(() => (props.variant === "all" ? 1 : Number(props.variant.slice("wave-".length))));
const confirm = ref(true);
onMounted(() => {
  host.confirm = (on) => {
    confirm.value = on;
  };
});
</script>

<template>
  <Foundation />
  <Shell v-if="wave === 6" :confirm="confirm" />
  <template v-else-if="wave >= 2">
    <Activity :confirm="confirm" />
    <HumanInput v-if="wave >= 3" :confirm="confirm" :wave="wave === 5 ? 5 : 3" />
    <Artifacts v-if="wave >= 4" />
    <Composing v-if="wave === 5" :confirm="confirm" />
  </template>
</template>
