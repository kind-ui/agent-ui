<script lang="ts">
import type { AgentAction } from "@ui-sdk/vue/agent";
import { checkpointHost } from "../../shared/checkpoint.js";

export const variants = ["all", "reduced"] as const;

const { host, restore } = checkpointHost();

export const allow = (step: AgentAction) => !step.confirm || host.permit;
</script>

<script setup lang="ts">
import { onMounted, shallowRef } from "vue";
import { Checkpoint } from "../../../../src/vue/checkpoint.js";
import { expose } from "../../shared/expose.js";

const props = defineProps<{ variant: string; params: URLSearchParams }>();

const restored = shallowRef(false);
const motion = props.variant === "reduced" ? "reduced" : undefined;

onMounted(() =>
  expose({
    kindHost: host,
    kindCheckpoint: {
      restore: (next: boolean) => {
        restored.value = next;
      },
    },
  }),
);
</script>

<template>
  <div class="flex w-[28rem] flex-col gap-4 p-6">
    <p id="above">Above</p>
    <Checkpoint
      id="checkpoint"
      description="Before editing auth.ts"
      :on-restore="restore"
      :restored="restored"
      :motion="motion"
    />
    <p id="below">Below</p>
  </div>
</template>
