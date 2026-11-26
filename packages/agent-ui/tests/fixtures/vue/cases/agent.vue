<script lang="ts">
import type { AgentAction } from "@ui-sdk/vue/agent";
import { host } from "./agent/host.js";

export const variants = ["all", "wave-2", "wave-3", "wave-4", "wave-5", "wave-6", "wave-7a"] as const;

export const allow = (step: AgentAction) => !step.confirm || host.permit;
</script>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import Activity from "./agent/Activity.vue";
import Artifacts from "./agent/Artifacts.vue";
import Composing from "./agent/Composing.vue";
import Foundation from "./agent/Foundation.vue";
import HumanInput from "./agent/HumanInput.vue";
import Ops from "./agent/Ops.vue";
import Shell from "./agent/Shell.vue";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const wave = computed(() =>
  props.variant === "all" ? 1 : props.variant === "wave-7a" ? "7a" : Number(props.variant.slice("wave-".length)),
);
const confirm = ref(true);
onMounted(() => {
  host.confirm = (on) => {
    confirm.value = on;
  };
});
</script>

<template>
  <Foundation />
  <!-- The bridge lists 100 components at most, so Wave 6 and Wave 7a each sit beside Wave 1 alone. -->
  <Shell v-if="wave === 6" :confirm="confirm" />
  <Ops v-else-if="wave === '7a'" :confirm="confirm" />
  <template v-else-if="wave >= 2">
    <Activity :confirm="confirm" />
    <HumanInput v-if="wave >= 3" :confirm="confirm" :wave="wave === 5 ? 5 : 3" />
    <Artifacts v-if="wave >= 4" />
    <Composing v-if="wave === 5" :confirm="confirm" />
  </template>
</template>
