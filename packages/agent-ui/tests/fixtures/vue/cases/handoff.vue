<script lang="ts">
export const variants = ["all"] as const;
</script>

<script setup lang="ts">
import type { HandoffOptions } from "@kind-ui/agent-ui/core";
import { onMounted, shallowRef } from "vue";
import { Handoff } from "../../../../src/vue/handoff.js";
import { confirmationHost } from "../../shared/confirmation.js";
import { expose } from "../../shared/expose.js";
import { handoffs } from "../../shared/handoff.js";

defineProps<{ variant: string; params: URLSearchParams }>();

const { host, approve, deny, always } = confirmationHost();
const rows = shallowRef(handoffs);

const options = ({ approve: decides, ...row }: HandoffOptions & { approve?: boolean }) => ({
  ...row,
  ...(decides && { onApprove: approve, onDeny: deny, onAlwaysAllow: always }),
});

onMounted(() =>
  expose({
    kindHost: host,
    kindHandoff: {
      set: (id: string, next: Partial<HandoffOptions>) => {
        rows.value = { ...rows.value, [id]: { ...rows.value[id], ...next } };
      },
    },
  }),
);
</script>

<template>
  <div class="flex w-[34rem] flex-col gap-3 p-6">
    <Handoff v-for="(row, id) in rows" :id="id" :key="id" v-bind="options(row)" />
  </div>
</template>
